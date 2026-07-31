type WeightTier = { minWeight: number; maxWeight: number; price: number };
type DistanceFactor = { minDistance: number; maxDistance: number; factor: number };

/**
 * تنظیمات pricingSourceType = page_automation. فقط تنظیمات ذخیره می‌شوند —
 * اجرای واقعی ربات (Playwright/Puppeteer) هنوز پیاده نشده، فاز بعدی است.
 */
export type AutomationConfig = {
  url: string;
  fieldSelectors: { origin: string; destination: string; weight: string };
  submitSelector: string;
  resultSelector: string;
};

export type CompanyFormValue = {
  id?: string;
  name: string;
  logoUrl: string;
  type: "intercity" | "intracity";
  active: boolean;
  commissionType: "percent" | "fixed";
  commissionValue: number;
  contractInfo: string;
  trackingMethod: "internal" | "external_url" | "api";
  trackingEndpoint: string;
  pricingSourceType: "internal_formula" | "external_api" | "page_automation";
  coveredCities: string[];
  ruleType: "formula" | "tiered";
  formulaParams: { basePrice: number; pricePerKg: number; pricePerKm: number };
  tiers: { weightTiers: WeightTier[]; distanceFactors: DistanceFactor[] };
  /** برای pricingSourceType = external_api — در Company.apiBaseUrl ذخیره می‌شود */
  apiBaseUrl: string;
  /** برای pricingSourceType = external_api — در Company.apiKey ذخیره می‌شود */
  apiKey: string;
  /** برای pricingSourceType = page_automation — در PricingRule.formulaParams ذخیره می‌شود */
  automationConfig: AutomationConfig;
  /** نام کاربری ورود پنل شرکت (CompanyAccount) */
  username: string;
  /** رمز عبور — موقع ساخت شرکت جدید یا شرکتی که هنوز حساب ورود ندارد اجباری است */
  password: string;
  /** آیا این شرکت از قبل یک CompanyAccount دارد؟ فقط برای تعیین برچسب/الزامی‌بودن رمز در فرم استفاده می‌شود */
  hasAccount: boolean;
};

/**
 * تابع ساده (بدون "use client") تا هم صفحات سرور و هم کامپوننت کلاینت
 * بتوانند آن را فراخوانی کنند. فراخوانی توابع صادرشده از یک ماژول
 * "use client" در کد سمت سرور مجاز نیست، به همین دلیل این مقادیر
 * پیش‌فرض در یک فایل جدا نگه‌داری می‌شوند.
 */
export function emptyCompanyForm(): CompanyFormValue {
  return {
    name: "",
    logoUrl: "",
    type: "intercity",
    active: true,
    commissionType: "percent",
    commissionValue: 10,
    contractInfo: "",
    trackingMethod: "internal",
    trackingEndpoint: "",
    pricingSourceType: "internal_formula",
    coveredCities: [],
    ruleType: "formula",
    formulaParams: { basePrice: 50000, pricePerKg: 8000, pricePerKm: 150 },
    tiers: {
      weightTiers: [{ minWeight: 0, maxWeight: 5, price: 60000 }],
      distanceFactors: [{ minDistance: 0, maxDistance: 500, factor: 1 }],
    },
    apiBaseUrl: "",
    apiKey: "",
    automationConfig: {
      url: "",
      fieldSelectors: { origin: "", destination: "", weight: "" },
      submitSelector: "",
      resultSelector: "",
    },
    username: "",
    password: "",
    hasAccount: false,
  };
}
