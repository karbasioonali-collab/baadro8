type WeightTier = { minWeight: number; maxWeight: number; price: number };
type DistanceFactor = { minDistance: number; maxDistance: number; factor: number };

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
  };
}
