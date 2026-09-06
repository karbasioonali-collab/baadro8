import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";
import {
  POST_PISHTAZ_WEIGHT_PRICE_TABLE_BY_HALF_STEP,
  POST_PISHTAZ_EXTRA_PER_HALF_KG_OVER_20,
  POST_PISHTAZ_MIN_HALF_STEP,
  POST_PISHTAZ_MAX_HALF_STEP_IN_TABLE,
  POST_PISHTAZ_MAX_HALF_STEP_SUPPORTED,
  findPostPishtazZoneForCity,
} from "./post-pishtaz-data";

/**
 * ⚠️ عمداً کاملاً مستقل از `dts-provider.ts` نوشته شده — طبق دستور صریح
 * کارفرما، هیچ import/اشتراک کدی بین این دو provider وجود ندارد، حتی
 * اگرچه منطق محاسبه‌شان فعلاً یکسان است. تغییر آینده در فرمول یکی از این
 * دو شرکت (DTS یا پست پیشتاز) نباید روی دیگری اثر بگذارد.
 */

/** پاکت (envelope) وزن مشخصی از کاربر نمی‌گیرد — وزن سبک استاندارد ۵۰۰ گرم فرض می‌شود. */
const POST_PISHTAZ_ENVELOPE_WEIGHT_GRAMS = 500;

/** حداقل وزن معتبر بسته (گرم) — همان حداقلی که خودِ بادرو موقع ثبت سفارش اجبار می‌کند؛ کمتر از این یعنی داده هنوز کامل نیست. */
const MIN_VALID_WEIGHT_GRAMS_POST_PISHTAZ = 100;

/** طبق قانون ۴ کارفرما: وقتی نه مبدا نه مقصد تهران نباشند، ۲۰٪ به قیمت پایه‌ی زون مبدا اضافه می‌شود. */
const NON_TEHRAN_ORIGIN_SURCHARGE_RATE = 0.2;

/**
 * قیمت یک زون در یک پله‌ی نیم‌کیلویی مشخص. اگر halfSteps از جدول اصلی
 * (تا ۲۰ کیلوگرم) بیشتر باشد: قیمت ردیف ۲۰ کیلوگرم + (تعداد نیم‌کیلوی
 * اضافه × مبلغ هر نیم‌کیلوی اضافه‌ی همان زون).
 */
function priceForZoneAtHalfStep(zone: 1 | 2 | 3 | 4 | 5, halfSteps: number): number {
  const zoneIndex = zone - 1;
  if (halfSteps <= POST_PISHTAZ_MAX_HALF_STEP_IN_TABLE) {
    return POST_PISHTAZ_WEIGHT_PRICE_TABLE_BY_HALF_STEP[halfSteps][zoneIndex];
  }
  const basePrice =
    POST_PISHTAZ_WEIGHT_PRICE_TABLE_BY_HALF_STEP[POST_PISHTAZ_MAX_HALF_STEP_IN_TABLE][zoneIndex];
  const overHalfSteps = halfSteps - POST_PISHTAZ_MAX_HALF_STEP_IN_TABLE;
  return basePrice + overHalfSteps * POST_PISHTAZ_EXTRA_PER_HALF_KG_OVER_20[zoneIndex];
}

/**
 * منطق کامل قیمت‌گذاری پست پیشتاز، به‌صورت یک تابع خالص (بدون هیچ فراخوانی
 * دیتابیس/شبکه) تا مستقیماً قابل تست باشد — دقیقاً طبق ۵ قانون کارفرما
 * (همان قوانین DTS، پیاده‌سازی مستقل):
 * ۱) گرد کردن وزن به بالاترین پله‌ی نیم‌کیلویی.
 * ۲) بالای ۲۰ کیلوگرم: قیمت ردیف ۲۰kg + نیم‌کیلوهای اضافه × مبلغ اضافه‌ی همان زون.
 * ۳) اگر مبدا یا مقصد تهران بود: قیمت طبق زون شهر غیرتهرانی (بدون افزایش).
 * ۴) اگر هیچ‌کدام تهران نبودند: قیمت طبق زون مبدا + ۲۰٪.
 * ۵) اگر شهر لازم (غیرتهرانی در حالت ۳، یا مبدا در حالت ۴) در هیچ زونی نبود: available:false (نه throw).
 */
export function computePostPishtazQuote(input: {
  originCity: string;
  destinationCity: string;
  parcelType: "envelope" | "package";
  weightGrams?: number;
}): PriceQuoteResult {
  let weightGrams: number;
  if (input.parcelType === "envelope") {
    weightGrams = POST_PISHTAZ_ENVELOPE_WEIGHT_GRAMS;
  } else {
    if (input.weightGrams == null || input.weightGrams < MIN_VALID_WEIGHT_GRAMS_POST_PISHTAZ) {
      return { available: false, reason: "وزن مرسوله برای استعلام قیمت هنوز کامل/معتبر نیست" };
    }
    weightGrams = input.weightGrams;
  }

  // قانون ۱: گرد کردن به بالاترین پله‌ی نیم‌کیلویی. چون جدول از ۱ کیلوگرم
  // (halfSteps=۲) شروع می‌شود، وزن‌های کمتر با نرخ همان حداقل ردیف
  // محاسبه می‌شوند — همان فرض مستندنشده‌ی اعمال‌شده برای DTS.
  const halfSteps = Math.max(Math.ceil(weightGrams / 500), POST_PISHTAZ_MIN_HALF_STEP);

  if (halfSteps > POST_PISHTAZ_MAX_HALF_STEP_SUPPORTED) {
    return {
      available: false,
      reason: "وزن مرسوله بیشتر از محدوده‌ی پشتیبانی‌شده‌ی پست پیشتاز (۱۰۰ کیلوگرم) است",
    };
  }

  const originZone = findPostPishtazZoneForCity(input.originCity);
  const destinationZone = findPostPishtazZoneForCity(input.destinationCity);

  let zone: 1 | 2 | 3 | 4 | 5;
  let surchargeRate = 0;

  if (originZone === 1 && destinationZone === 1) {
    // مسیر ویژه‌ی تهران↔تهران — مستقیم زون ۱، بدون افزایش.
    zone = 1;
  } else if (originZone === 1 || destinationZone === 1) {
    // قانون ۳: شهر غیرتهرانی (هرکدام از مبدا/مقصد که تهران نبود) را پیدا کن.
    const nonTehranZone = originZone === 1 ? destinationZone : originZone;
    if (nonTehranZone == null) {
      return { available: false, reason: "شهر مبدا یا مقصد در زون‌بندی پست پیشتاز پوشش داده نمی‌شود" };
    }
    zone = nonTehranZone;
  } else {
    // قانون ۴: نه مبدا نه مقصد تهران — زون مبدا + ۲۰٪.
    if (originZone == null) {
      return { available: false, reason: "شهر مبدا در زون‌بندی پست پیشتاز پوشش داده نمی‌شود" };
    }
    zone = originZone;
    surchargeRate = NON_TEHRAN_ORIGIN_SURCHARGE_RATE;
  }

  const zonePrice = priceForZoneAtHalfStep(zone, halfSteps);
  const surcharge = Math.round(zonePrice * surchargeRate);
  const price = zonePrice + surcharge;

  return {
    available: true,
    price,
    breakdown:
      surcharge > 0
        ? { قیمت_پایه_زون: zonePrice, افزایش_مبدا_غیرتهران_۲۰_درصد: surcharge }
        : { قیمت_پایه_زون: zonePrice },
    estimatedDeliveryDays: [2, 5],
  };
}

/**
 * روش pricing_source_type = internal_formula، مخصوص شرکت «پست پیشتاز» —
 * «شرکت با فرمول قیمت‌گذاری زون‌محور، بدون API واقعی». همه‌ی داده‌های این
 * شرکت (زون‌بندی + جدول وزن-قیمت) طبق دستور صریح در یک فایل ثابت کد
 * (post-pishtaz-data.ts) نگه‌داری می‌شوند — بدون migration. این کلاس هیچ
 * فراخوانی دیتابیس/شبکه‌ای ندارد؛ فقط منطق خالص computePostPishtazQuote
 * را روی ورودی اجرا می‌کند، پس هیچ try/catch اضافه‌ای هم لازم ندارد —
 * ایزوله‌سازی از بقیه‌ی شرکت‌ها را safeGetQuote در engine.ts انجام می‌دهد.
 */
export class PostPishtazZoneFormulaProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    return computePostPishtazQuote(input);
  }
}
