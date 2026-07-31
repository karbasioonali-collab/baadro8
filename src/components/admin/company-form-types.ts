type WeightTier = { minWeight: number; maxWeight: number; price: number };
type DistanceFactor = { minDistance: number; maxDistance: number; factor: number };

/**
 * تنظیمات pricingSourceType = page_automation — با Playwright صفحه‌ی استعلام قیمت
 * شرکت را پر و قیمت نهایی را استخراج می‌کند (src/lib/pricing/page-automation-provider.ts).
 */
export type AutomationConfig = {
  url: string;
  fieldSelectors: {
    origin: string;
    destination: string;
    weight: string;
    declaredValue: string;
    length: string;
    width: string;
    height: string;
    contentType: string;
  };
  /** مقداری که همیشه در فیلد «نوع محتوا» انتخاب می‌شود (بادرو این را از مشتری نمی‌گیرد) */
  contentTypeValue: string;
  weightUnit: "kg" | "gram";
  /** selector چک‌باکس‌هایی که باید همیشه تیک بخورند (مثل «قبول از محل مشتری») */
  checkboxSelectors: string[];
  /** فیلدهای خاصِ این شرکت با مقدار ثابت که در fieldSelectors نمی‌گنجند */
  extraStaticFields: { selector: string; value: string }[];
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
      fieldSelectors: {
        origin: "",
        destination: "",
        weight: "",
        declaredValue: "",
        length: "",
        width: "",
        height: "",
        contentType: "",
      },
      contentTypeValue: "",
      weightUnit: "kg",
      checkboxSelectors: ["", ""],
      extraStaticFields: [],
      submitSelector: "",
      resultSelector: "",
    },
    username: "",
    password: "",
    hasAccount: false,
  };
}
