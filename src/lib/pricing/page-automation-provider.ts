import { chromium, type Browser, type Page } from "playwright";
import { prisma } from "@/lib/prisma";
import type { PriceProvider, PriceQuoteInput, PriceQuoteResult } from "./types";

const NAV_TIMEOUT_MS = 15000;
const ACTION_TIMEOUT_MS = 10000;

export type AutomationFieldKey =
  | "origin"
  | "destination"
  | "weight"
  | "declaredValue"
  | "length"
  | "width"
  | "height"
  | "contentType";

/**
 * تنظیمات pricingSourceType = page_automation. برای هر شرکت در PricingRule.formulaParams
 * ذخیره می‌شود. طراحی به‌صورت عمومی است تا برای هر شرکتی با فرم استعلام قیمت متفاوت
 * (نه فقط دکاپست) قابل استفاده باشد: هر فیلد شناخته‌شده (origin, weight, ...) یک selector
 * می‌گیرد و مقدارش از سفارش واقعی پر می‌شود؛ فیلدهایی که در سفارش بادرو معادل ندارند
 * (مثل «نوع محتوا» که مشتری بادرو انتخاب نمی‌کند) با یک مقدار ثابت تعریف‌شده توسط ادمین
 * پر می‌شوند؛ extraStaticFields هم برای فیلدهای خاصِ یک شرکت که در این لیست از پیش
 * پیش‌بینی نشده (مثلاً فیلد نهم ناشناخته‌ی دکاپست) استفاده می‌شود.
 */
export type AutomationConfig = {
  url: string;
  fieldSelectors: Partial<Record<AutomationFieldKey, string>>;
  /** مقداری که همیشه در فیلد «نوع محتوا» انتخاب می‌شود (بادرو این را از مشتری نمی‌گیرد) */
  contentTypeValue?: string;
  weightUnit?: "kg" | "gram";
  /** selector چک‌باکس‌هایی که باید همیشه تیک بخورند (مثل «قبول از محل مشتری») */
  checkboxSelectors?: string[];
  /** فیلدهای خاصِ این شرکت با مقدار ثابت که در لیست fieldSelectors نمی‌گنجند */
  extraStaticFields?: { selector: string; value: string }[];
  submitSelector: string;
  resultSelector: string;
};

function toEnglishDigits(input: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const pIdx = persian.indexOf(ch);
    if (pIdx !== -1) return String(pIdx);
    return String(arabic.indexOf(ch));
  });
}

function parsePriceFromText(text: string): number | null {
  const digitsOnly = toEnglishDigits(text).replace(/[^\d]/g, "");
  if (!digitsOnly) return null;
  const n = Number(digitsOnly);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** فیلد را پر می‌کند؛ اگر عنصر واقعی select باشد به‌جای fill از selectOption استفاده می‌کند */
async function fillSmart(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: ACTION_TIMEOUT_MS });
  const tagName = await locator.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === "select") {
    try {
      await locator.selectOption({ label: value }, { timeout: ACTION_TIMEOUT_MS });
    } catch {
      await locator.selectOption(value, { timeout: ACTION_TIMEOUT_MS });
    }
  } else {
    await locator.fill(value, { timeout: ACTION_TIMEOUT_MS });
  }
}

/**
 * روش pricing_source_type = page_automation — پرریسک‌ترین و آخرین اولویت.
 * با Playwright صفحه‌ی محاسبه‌ی قیمت شرکت را باز، فیلدهای پیکربندی‌شده در پنل ادمین
 * را پر، چک‌باکس‌های لازم را تیک، دکمه‌ی محاسبه را کلیک و قیمت نهایی را از صفحه
 * استخراج می‌کند. هر گونه خطا (تایم‌اوت، عدم وجود selector، عدم لود صفحه) باعث کرش
 * نمی‌شود؛ فقط available:false برمی‌گرداند.
 */
export class PageAutomationProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    const rule = await prisma.pricingRule.findFirst({
      where: { companyId: input.companyId, sourceType: "page_automation", active: true },
    });

    if (!rule) {
      return { available: false, reason: "تنظیمات ربات استعلام برای این شرکت تعریف نشده است" };
    }

    const config = rule.formulaParams as unknown as AutomationConfig | null;
    if (!config?.url || !config.submitSelector || !config.resultSelector) {
      return { available: false, reason: "تنظیمات ربات استعلام این شرکت ناقص است" };
    }

    const weightKg = input.parcelType === "envelope" ? 0.5 : (input.weightGrams ?? 500) / 1000;
    const weightValue =
      config.weightUnit === "gram" ? String(Math.round(weightKg * 1000)) : String(weightKg);

    const fieldValues: Partial<Record<AutomationFieldKey, string>> = {
      origin: input.originCity,
      destination: input.destinationCity,
      weight: weightValue,
      declaredValue: input.declaredValue != null ? String(Math.round(input.declaredValue)) : undefined,
      length: input.lengthCm != null ? String(input.lengthCm) : undefined,
      width: input.widthCm != null ? String(input.widthCm) : undefined,
      height: input.heightCm != null ? String(input.heightCm) : undefined,
      contentType: config.contentTypeValue,
    };

    let browser: Browser | undefined;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      page.setDefaultTimeout(ACTION_TIMEOUT_MS);

      await page.goto(config.url, { timeout: NAV_TIMEOUT_MS, waitUntil: "domcontentloaded" });

      for (const [key, selector] of Object.entries(config.fieldSelectors)) {
        const value = fieldValues[key as AutomationFieldKey];
        if (!selector || value == null || value === "") continue;
        await fillSmart(page, selector, value);
      }

      for (const { selector, value } of config.extraStaticFields ?? []) {
        if (selector) await fillSmart(page, selector, value);
      }

      for (const selector of config.checkboxSelectors ?? []) {
        if (!selector) continue;
        const checkbox = page.locator(selector).first();
        await checkbox.waitFor({ state: "visible", timeout: ACTION_TIMEOUT_MS });
        if (!(await checkbox.isChecked())) {
          await checkbox.check({ timeout: ACTION_TIMEOUT_MS });
        }
      }

      await page.locator(config.submitSelector).first().click({ timeout: ACTION_TIMEOUT_MS });

      const resultLocator = page.locator(config.resultSelector).first();
      await resultLocator.waitFor({ state: "visible", timeout: ACTION_TIMEOUT_MS });
      const resultText = await resultLocator.innerText();

      const price = parsePriceFromText(resultText);
      if (price == null) {
        return { available: false, reason: "استخراج قیمت از صفحه‌ی شرکت ناموفق بود" };
      }

      return {
        available: true,
        price,
        breakdown: { automationPrice: price },
        estimatedDeliveryDays: [2, 4],
      };
    } catch (err) {
      return {
        available: false,
        reason: `خطا در استعلام خودکار از صفحه‌ی شرکت: ${
          err instanceof Error ? err.message : "خطای نامشخص"
        }`,
      };
    } finally {
      await browser?.close().catch(() => {});
    }
  }
}
