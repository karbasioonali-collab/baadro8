import { prisma } from "@/lib/prisma";
import {
  getChaparQuote,
  isChaparBaseUrl,
  parseChaparCredentials,
} from "@/lib/chapar/client";
import { resolveChaparCityCode } from "@/lib/chapar/city-map";
import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";

/**
 * روش pricing_source_type = external_api — بادرو در این حالت مصرف‌کننده
 * (Client) است. اولین و فعلاً تنها provider واقعی پیاده‌شده، چاپار
 * (Chaparnet, app.krch.ir) است — تشخیص بر اساس Company.apiBaseUrl انجام
 * می‌شود. برای شرکت‌های دیگری که در آینده apiBaseUrl متفاوتی داشته باشند،
 * تا وقتی provider اختصاصی‌شان نوشته نشود، available:false برمی‌گردد.
 */
export class ExternalApiProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
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

    const [originCode, destinationCode] = await Promise.all([
      resolveChaparCityCode(chaparCreds, input.originProvince, input.originCity),
      resolveChaparCityCode(chaparCreds, input.destinationProvince, input.destinationCity),
    ]);

    if (!originCode || !destinationCode) {
      return { available: false, reason: "شهر مبدا یا مقصد در سامانه چاپار شناسایی نشد" };
    }

    const weightKg = input.parcelType === "envelope" ? 0.5 : (input.weightGrams ?? 500) / 1000;

    try {
      const quote = await getChaparQuote(chaparCreds, {
        origin: originCode,
        destination: destinationCode,
        // ⚠️ کد نوع سرویس («method») از مستندات رسمی چاپار تایید نشده — فعلاً
        // مقدار پیش‌فرض «۱» فرستاده می‌شود. باید با پشتیبانی/مستندات چاپار تایید شود.
        method: "1",
        value: input.declaredValue ?? 0,
        weight: weightKg,
      });

      if (quote == null) {
        return { available: false, reason: "چاپار برای این مسیر قیمتی برنگرداند" };
      }

      return {
        available: true,
        price: Math.round(quote.total),
        breakdown: quote.costs ?? { قیمت_کل: Math.round(quote.total) },
        estimatedDeliveryDays: [2, 5],
      };
    } catch (err) {
      return {
        available: false,
        reason: `خطا در استعلام از API چاپار: ${err instanceof Error ? err.message : "خطای نامشخص"}`,
      };
    }
  }
}
