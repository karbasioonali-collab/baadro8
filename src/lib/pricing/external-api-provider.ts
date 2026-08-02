import { prisma } from "@/lib/prisma";
import {
  getChaparQuote,
  isChaparBaseUrl,
  parseChaparCredentials,
} from "@/lib/chapar/client";
import { resolveChaparCityCode } from "@/lib/chapar/city-map";
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

/**
 * روش pricing_source_type = external_api — بادرو در این حالت مصرف‌کننده
 * (Client) است. اولین و فعلاً تنها provider واقعی پیاده‌شده، چاپار
 * (Chaparnet, app.krch.ir) است — تشخیص بر اساس Company.apiBaseUrl انجام
 * می‌شود. برای شرکت‌های دیگری که در آینده apiBaseUrl متفاوتی داشته باشند،
 * تا وقتی provider اختصاصی‌شان نوشته نشود، available:false برمی‌گردد.
 *
 * ⚠️ کل بدنه‌ی getQuote داخل یک try/catch است (علاوه بر safeGetQuote در
 * engine.ts که همه‌ی providerها را پوشش می‌دهد) — طبق درس حادثه‌ی
 * page_automation (infobaadro.md)، هیچ خطای شبکه/parse این provider
 * نباید بتواند بقیه‌ی شرکت‌ها یا کل درخواست را تحت تاثیر قرار دهد؛ فقط
 * همین شرکت با available:false از نتایج حذف می‌شود.
 */
export class ExternalApiProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    try {
      const company = await prisma.company.findUnique({ where: { id: input.companyId } });
      if (!company?.apiBaseUrl) {
        return { available: false, reason: "این شرکت به API متصل نیست" };
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

      // TODO(تست موقت تشخیصی): کد نوع سرویس («method») از مستندات رسمی چاپار
      // تایید نشده. به‌جای هاردکد یک مقدار، چند کد محتمل به‌ترتیب امتحان
      // می‌شوند (هرکدام جواب داد، همان استفاده می‌شود و بقیه امتحان نمی‌شوند)
      // تا مشخص شود کدام برای این حساب/مسیر معتبر است. بعد از پیدا شدن مقدار
      // درست، این آرایه باید با همان یک مقدار ثابت جایگزین شود.
      const CANDIDATE_METHODS: { code: string; label: string }[] = [
        { code: "1", label: "زمینی" },
        { code: "6", label: "هوایی" },
        { code: "11", label: "پستی" },
        { code: "35", label: "چاپار پلاس" },
        { code: "97", label: "پاکت" },
      ];

      let quote: Awaited<ReturnType<typeof getChaparQuote>> = null;
      let workingMethod: string | null = null;

      for (const candidate of CANDIDATE_METHODS) {
        const attemptPayload = {
          origin: originCode,
          destination: destinationCode,
          method: candidate.code,
          value: declaredValueRial,
          weight: weightKg,
        };
        const attempt = await getChaparQuote(chaparCreds, attemptPayload);
        console.error(`[Chapar] تست method=${candidate.code} (${candidate.label})`, {
          companyId: input.companyId,
          success: attempt != null,
          quote: attempt?.total,
        });
        if (attempt != null) {
          quote = attempt;
          workingMethod = candidate.code;
          break;
        }
      }

      if (quote == null) {
        console.error("[Chapar] هیچ‌کدام از methodهای تست‌شده جواب ندادند — این شرکت از مقایسه قیمت حذف شد", {
          companyId: input.companyId,
          testedMethods: CANDIDATE_METHODS.map((m) => m.code),
        });
        return { available: false, reason: "چاپار برای این مسیر قیمتی برنگرداند" };
      }

      console.error("[Chapar] method کارآمد پیدا شد", { companyId: input.companyId, workingMethod });

      return {
        available: true,
        price: Math.round(quote.total),
        breakdown: quote.costs ?? { قیمت_کل: Math.round(quote.total) },
        estimatedDeliveryDays: [2, 5],
      };
    } catch (err) {
      // TODO(لاگ موقت تشخیصی): بعد از پیدا شدن علت این‌که چاپار توی نتایج
      // ظاهر نمی‌شود، این console.error حذف شود.
      console.error("[Chapar] استعلام قیمت با خطا مواجه شد", {
        companyId: input.companyId,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
      });
      return {
        available: false,
        reason: `خطا در استعلام از API چاپار: ${err instanceof Error ? err.message : "خطای نامشخص"}`,
      };
    }
  }
}
