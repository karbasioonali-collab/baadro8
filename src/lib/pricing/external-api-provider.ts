import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";

/**
 * روش pricing_source_type = external_api — اولویت دوم.
 * بادرو در این حالت مصرف‌کننده (Client) است: درخواست را به API خود شرکت پستی/پیک می‌فرستد.
 * ساختار داده (Company.apiBaseUrl / apiKey) از هم‌اکنون در مدل آماده است؛
 * اتصال واقعی به محض دریافت مستندات API از هر شرکت پیاده‌سازی می‌شود.
 */
export class ExternalApiProvider implements PriceProvider {
  async getQuote(_input: PriceQuoteInput): Promise<PriceQuoteResult> {
    return {
      available: false,
      reason: "اتصال به API این شرکت هنوز پیاده‌سازی نشده است",
    };
  }
}
