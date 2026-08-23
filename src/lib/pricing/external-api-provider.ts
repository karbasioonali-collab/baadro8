import { prisma } from "@/lib/prisma";
import {
  getChaparQuote,
  isChaparBaseUrl,
  parseChaparCredentials,
} from "@/lib/chapar/client";
import { resolveChaparCityCode } from "@/lib/chapar/city-map";
import { getTapinQuote, isTapinBaseUrl, parseTapinCredentials } from "@/lib/tapin/client";
import { resolveTapinCityCode } from "@/lib/tapin/city-map";
import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";

/** حداقل وزن معتبر برای بسته (کیلوگرم) — دقیقاً همان حداقلی که خودِ بادرو موقع ثبت سفارش اجبار می‌کند (packageSchema، ۱۰۰ گرم). وزن کمتر از این یعنی داده هنوز کامل نیست (مثلاً درخواست پیش‌نمایش زنده وسط تایپ کاربر)، نه یک سفارش واقعی. */
const MIN_VALID_WEIGHT_KG = 0.1;

/**
 * ⚠️ مقدار پیش‌فرض «ارزش کالا» وقتی مشتری چیزی وارد نکرده (فیلد اختیاری
 * است). صفر خام فرستاده نمی‌شود چون مشخص نیست چاپار با value=0 هم quote
 * درست می‌دهد یا نه (مستندات رسمی تایید نشده) — یک مقدار نمادین کوچک
 * جایگزین می‌شود. **این فرض تایید‌نشده است** و اگر چاپار حق‌بیمه/هزینه را
 * متناسب با value حساب کند، ممکن است روی مبلغ نهایی quote اثر بگذارد؛
 * باید با مستندات/پشتیبانی چاپار تایید و در صورت نیاز اصلاح شود.
 */
const NOMINAL_DECLARED_VALUE_RIAL = 100000;

/** وزن پاکت (گرم) وقتی provider تاپین است — همان مقدار ثابتی که برای چاپار هم استفاده می‌شود (۰.۵ کیلوگرم = ۵۰۰ گرم). */
const TAPIN_ENVELOPE_WEIGHT_GRAMS = 500;

/** حداقل وزن معتبر بسته (گرم) برای تاپین — معادل MIN_VALID_WEIGHT_KG بالا، فقط بدون نیاز به تبدیل چون تاپین خودش گرم می‌خواهد. */
const MIN_VALID_WEIGHT_GRAMS_TAPIN = 100;

/**
 * ⚠️ مقدار پیش‌فرض «ارزش کالا» برای تاپین وقتی مشتری چیزی وارد نکرده.
 * واحد پول تاپین (تومان/ریال) هنوز تایید نشده (به توضیح getTapinQuote در
 * src/lib/tapin/client.ts مراجعه شود) — این مقدار به همان عدد نمادین
 * چاپار (بدون ضرب در ۱۰، یعنی فرض بر تومان) تنظیم شده تا زمانی که با یک
 * سفارش تستی واقعی تایید/اصلاح شود.
 */
const NOMINAL_DECLARED_VALUE_TAPIN = 100000;

/**
 * روش pricing_source_type = external_api — بادرو در این حالت مصرف‌کننده
 * (Client) است. تشخیص provider واقعی بر اساس hostname در Company.apiBaseUrl
 * انجام می‌شود: چاپار (Chaparnet, app.krch.ir) و تاپین (Tapin, api.tapin.ir).
 * برای شرکت‌های دیگری که در آینده apiBaseUrl متفاوتی داشته باشند، تا وقتی
 * provider اختصاصی‌شان نوشته نشود، available:false برمی‌گردد.
 *
 * ⚠️ کل بدنه‌ی getQuote (و متدهای خصوصی‌ای که از داخل آن صدا زده می‌شوند،
 * از جمله getTapinQuoteResult) داخل یک try/catch است (علاوه بر
 * safeGetQuote در engine.ts که همه‌ی providerها را پوشش می‌دهد) — طبق درس
 * حادثه‌ی page_automation (infobaadro.md)، هیچ خطای شبکه/parse این
 * provider نباید بتواند بقیه‌ی شرکت‌ها یا کل درخواست را تحت تاثیر قرار
 * دهد؛ فقط همین شرکت با available:false از نتایج حذف می‌شود.
 */
export class ExternalApiProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    try {
      const company = await prisma.company.findUnique({ where: { id: input.companyId } });
      if (!company?.apiBaseUrl) {
        return { available: false, reason: "این شرکت به API متصل نیست" };
      }

      if (isTapinBaseUrl(company.apiBaseUrl)) {
        return await this.getTapinQuoteResult(company.apiBaseUrl, company.apiKey, input);
      }

      if (!isChaparBaseUrl(company.apiBaseUrl)) {
        return { available: false, reason: "اتصال API این شرکت هنوز پشتیبانی نمی‌شود" };
      }

      const creds = parseChaparCredentials(company.apiKey);
      if (!creds) {
        return { available: false, reason: "تنظیمات احراز هویت API این شرکت ناقص است" };
      }

      if (!input.originProvince || !input.destinationProvince) {
        return { available: false, reason: "استان مبدا/مقصد برای استعلام API مشخص نیست" };
      }

      const chaparCreds = { baseUrl: company.apiBaseUrl, ...creds };

      const [originResolution, destinationResolution] = await Promise.all([
        resolveChaparCityCode(chaparCreds, input.originProvince, input.originCity),
        resolveChaparCityCode(chaparCreds, input.destinationProvince, input.destinationCity),
      ]);

      if (!originResolution || !destinationResolution) {
        // TODO(لاگ موقت تشخیصی): بعد از پیدا شدن علت این‌که چاپار توی نتایج
        // ظاهر نمی‌شود، این console.error و بقیه‌ی لاگ‌های این فایل حذف شوند.
        console.error("[Chapar] شناسایی کد شهر ناموفق بود", {
          companyId: input.companyId,
          originProvince: input.originProvince,
          originCity: input.originCity,
          originResolution,
          destinationProvince: input.destinationProvince,
          destinationCity: input.destinationCity,
          destinationResolution,
        });
        return { available: false, reason: "شهر مبدا یا مقصد در سامانه چاپار شناسایی نشد" };
      }

      const originCode = originResolution.code;
      const destinationCode = destinationResolution.code;

      // TODO(لاگ موقت تشخیصی): بررسی این‌که کد پیدا‌شده واقعاً مال شهر/استان
      // درستی است (نه یک هم‌نام تصادفی در استان دیگر) — بعد از تایید، حذف شود.
      console.error("[Chapar] نگاشت شهر مبدا/مقصد به کد چاپار (برای تایید صحت match)", {
        companyId: input.companyId,
        origin: {
          badroProvince: input.originProvince,
          badroCity: input.originCity,
          chaparCode: originResolution.code,
          chaparMatchedCityName: originResolution.matchedCityName,
          chaparMatchedStateId: originResolution.matchedStateId,
          chaparMatchedStateName: originResolution.matchedStateName,
        },
        destination: {
          badroProvince: input.destinationProvince,
          badroCity: input.destinationCity,
          chaparCode: destinationResolution.code,
          chaparMatchedCityName: destinationResolution.matchedCityName,
          chaparMatchedStateId: destinationResolution.matchedStateId,
          chaparMatchedStateName: destinationResolution.matchedStateName,
        },
      });

      let weightKg: number;
      if (input.parcelType === "envelope") {
        weightKg = 0.5;
      } else {
        // تبدیل گرم (واحد ذخیره‌شده در بادرو، Order.weightGrams) به کیلوگرم
        // (واحد مورد انتظار چاپار) — همیشه دقیقاً تقسیم بر ۱۰۰۰.
        weightKg = (input.weightGrams ?? 0) / 1000;
        if (weightKg < MIN_VALID_WEIGHT_KG) {
          // یعنی weightGrams اصلاً ست نشده یا مقدار غیرمنطقی کوچکی دارد
          // (مثلاً درخواست پیش‌نمایش زنده‌ی قیمت وسط تایپ‌کردن وزن توسط
          // کاربر، قبل از کامل شدن عدد) — نه یک سفارش واقعی و کامل. به‌جای
          // فرستادن یک وزن بی‌معنی به چاپار (که می‌تواند quote نادرست
          // بدهد)، همین‌جا available:false برمی‌گردانیم.
          return { available: false, reason: "وزن مرسوله برای استعلام قیمت هنوز کامل/معتبر نیست" };
        }
      }

      // Order.declaredValue در بادرو بر حسب تومان ذخیره/جمع‌آوری می‌شود
      // (برچسب فرم: «ارزش مرسوله (تومان، اختیاری)»)، ولی طبق مستندات
      // ارائه‌شده «value» در get_quote چاپار بر حسب ریال است — پس همیشه
      // در ۱۰ ضرب می‌شود. اگر مشتری چیزی وارد نکرده (۰/خالی)، به‌جای صفر
      // خام یک مقدار نمادین ثابت فرستاده می‌شود (توضیح کامل بالای فایل).
      const declaredValueRial =
        input.declaredValue != null && input.declaredValue > 0
          ? Math.round(input.declaredValue * 10)
          : NOMINAL_DECLARED_VALUE_RIAL;

      const quote = await getChaparQuote(chaparCreds, {
        origin: originCode,
        destination: destinationCode,
        // طبق نمونه‌ی تایید‌شده‌ی پشتیبانی چاپار، «۱» (زمینی) مقدار معتبر است.
        method: "1",
        value: declaredValueRial,
        weight: weightKg,
      });

      if (quote == null) {
        // پیام دقیق چاپار همین الان توسط getChaparQuote در client.ts لاگ شد؛
        // این‌جا فقط companyId برای ارتباط‌دادن آن لاگ به همین شرکت اضافه می‌شود.
        console.error("[Chapar] در نتیجه، این شرکت از مقایسه قیمت حذف شد", {
          companyId: input.companyId,
        });
        return { available: false, reason: "چاپار برای این مسیر قیمتی برنگرداند" };
      }

      // quote.total (و quote.costs) از get_quote چاپار بر حسب ریال است —
      // تایید شده با مقایسه‌ی مستقیم با ماشین‌حساب رسمی چاپار (کرج→قم:
      // چاپار ۱,۵۵۷,۱۶۰ ریال داد، بادرو بدون این تبدیل همان عدد را به
      // اشتباه به‌عنوان تومان نشان می‌داد — یعنی ۱۰ برابر واقعی). بقیه‌ی
      // سیستم بادرو (نمایش، مقایسه با شرکت‌های دیگر، ثبت سفارش) همه‌جا
      // تومان است، پس همین‌جا (نقطه‌ی خروجی از این provider، تنها جایی
      // که provider دیگری را تحت تاثیر قرار نمی‌دهد) بر ۱۰ تقسیم می‌شود.
      const priceToman = Math.round(quote.total / 10);
      const breakdownToman = quote.costs
        ? Object.fromEntries(
            Object.entries(quote.costs).map(([key, rialValue]) => [key, Math.round(rialValue / 10)])
          )
        : { قیمت_کل: priceToman };

      return {
        available: true,
        price: priceToman,
        breakdown: breakdownToman,
        estimatedDeliveryDays: [2, 5],
      };
    } catch (err) {
      // TODO(لاگ موقت تشخیصی): بعد از پیدا شدن علت این‌که چاپار توی نتایج
      // ظاهر نمی‌شود، این console.error حذف شود.
      // ⚠️ این catch مشترک بین چاپار و تاپین است (هر دو داخل همین try صدا
      // زده می‌شوند) — پیام عمداً نام یک provider خاص را نمی‌آورد.
      console.error("[ExternalApiProvider] استعلام قیمت با خطا مواجه شد", {
        companyId: input.companyId,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
      });
      return {
        available: false,
        reason: `خطا در استعلام از API شرکت: ${err instanceof Error ? err.message : "خطای نامشخص"}`,
      };
    }
  }

  /**
   * Tapin (api.tapin.ir) — استعلام قیمت فقط (بدون ثبت خودکار سفارش فعلاً).
   * الگوی این متد دقیقاً همان الگوی مسیر چاپار در getQuote بالاست: نگاشت
   * شهر با کش (resolveTapinCityCode)، تبدیل وزن/ارزش، فراخوانی
   * getTapinQuote، و بازگرداندن نتیجه به شکل PriceQuoteResult. چون این
   * متد از داخل try/catch سراسری getQuote صدا زده می‌شود، هر خطای شبکه/
   * parse همان‌جا گرفته و به available:false تبدیل می‌شود — بدون تاثیر
   * روی بقیه‌ی شرکت‌ها.
   */
  private async getTapinQuoteResult(
    apiBaseUrl: string,
    apiKey: string | null,
    input: PriceQuoteInput
  ): Promise<PriceQuoteResult> {
    const creds = parseTapinCredentials(apiKey);
    if (!creds) {
      return { available: false, reason: "تنظیمات احراز هویت API این شرکت ناقص است" };
    }

    if (!input.destinationProvince) {
      return { available: false, reason: "استان مقصد برای استعلام API مشخص نیست" };
    }

    const tapinCreds = { baseUrl: apiBaseUrl, ...creds };

    const destinationResolution = await resolveTapinCityCode(
      tapinCreds,
      input.destinationProvince,
      input.destinationCity
    );

    if (!destinationResolution) {
      console.error("[Tapin] شناسایی کد شهر/استان مقصد ناموفق بود", {
        companyId: input.companyId,
        destinationProvince: input.destinationProvince,
        destinationCity: input.destinationCity,
      });
      return { available: false, reason: "شهر یا استان مقصد در سامانه تاپین شناسایی نشد" };
    }

    let weightGrams: number;
    if (input.parcelType === "envelope") {
      weightGrams = TAPIN_ENVELOPE_WEIGHT_GRAMS;
    } else {
      weightGrams = input.weightGrams ?? 0;
      if (weightGrams < MIN_VALID_WEIGHT_GRAMS_TAPIN) {
        // همان دلیل MIN_VALID_WEIGHT_KG برای چاپار بالا — یعنی وزن هنوز
        // کامل/معتبر نیست (مثلاً پیش‌نمایش زنده وسط تایپ کاربر).
        return { available: false, reason: "وزن مرسوله برای استعلام قیمت هنوز کامل/معتبر نیست" };
      }
    }

    const declaredValue =
      input.declaredValue != null && input.declaredValue > 0
        ? input.declaredValue
        : NOMINAL_DECLARED_VALUE_TAPIN;

    const quote = await getTapinQuote(tapinCreds, {
      destinationCityCode: destinationResolution.cityCode,
      destinationProvinceCode: destinationResolution.provinceCode,
      packageWeightGrams: weightGrams,
      declaredValue,
    });

    if (quote == null) {
      console.error("[Tapin] در نتیجه، این شرکت از مقایسه قیمت حذف شد", {
        companyId: input.companyId,
      });
      return { available: false, reason: "تاپین برای این مسیر قیمتی برنگرداند" };
    }

    // ⚠️ واحد پول total_price تاپین هنوز تایید نشده — به توضیح کامل
    // getTapinQuote در src/lib/tapin/client.ts مراجعه شود. فعلاً بدون هیچ
    // تبدیلی (فرض بر تومان) برگردانده می‌شود.
    const price = Math.round(quote.totalPrice);
    return {
      available: true,
      price,
      breakdown: { قیمت_کل: price },
      estimatedDeliveryDays: [2, 5],
    };
  }
}
