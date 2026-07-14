import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";

/**
 * روش pricing_source_type = page_automation — اولویت سوم و آخر (پرریسک‌ترین).
 * در فاز اول پیاده‌سازی نمی‌شود؛ در آینده با Playwright/Puppeteer صفحه محاسبه قیمت
 * شرکت را پر و قیمت را استخراج می‌کند. فعلاً فقط ساختار Interface آماده است.
 */
export class PageAutomationProvider implements PriceProvider {
  async getQuote(_input: PriceQuoteInput): Promise<PriceQuoteResult> {
    return {
      available: false,
      reason: "استعلام خودکار از صفحه قیمت این شرکت هنوز پیاده‌سازی نشده است",
    };
  }
}
