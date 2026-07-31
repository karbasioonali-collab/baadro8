import { prisma } from "@/lib/prisma";
import { InternalFormulaProvider } from "./internal-formula-provider";
import { ExternalApiProvider } from "./external-api-provider";
import { PageAutomationProvider } from "./page-automation-provider";
import type { PriceProvider, PriceQuoteResult } from "./types";

const providers: Record<string, PriceProvider> = {
  internal_formula: new InternalFormulaProvider(),
  external_api: new ExternalApiProvider(),
  page_automation: new PageAutomationProvider(),
};

export type CompanyQuote = {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  quote: PriceQuoteResult;
};

export type QuoteRequest = {
  originProvince: string;
  originCity: string;
  destinationProvince: string;
  destinationCity: string;
  parcelType: "envelope" | "package";
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  envelopeTypeId?: string;
};

/**
 * سیستم خودش تشخیص می‌دهد: شهرستان مبدا و مقصد یکسان → درون‌شهری، در غیر این صورت بین‌شهری.
 */
export function detectServiceType(
  originCity: string,
  destinationCity: string
): "intercity" | "intracity" {
  return originCity === destinationCity ? "intracity" : "intercity";
}

export async function getQuotesForRequest(
  req: QuoteRequest
): Promise<CompanyQuote[]> {
  const serviceType = detectServiceType(req.originCity, req.destinationCity);

  const companies = await prisma.company.findMany({
    where: {
      active: true,
      type: serviceType,
      ...(serviceType === "intracity"
        ? { coveredCities: { some: { cityName: req.originCity } } }
        : {}),
    },
    include: { coveredCities: true },
  });

  let envelopePriceModifier: number | undefined;
  if (req.parcelType === "envelope" && req.envelopeTypeId) {
    const envelopeType = await prisma.envelopeType.findUnique({
      where: { id: req.envelopeTypeId },
    });
    envelopePriceModifier = envelopeType
      ? Number(envelopeType.priceModifier)
      : 0;
  }

  const results = await Promise.all(
    companies.map(async (company): Promise<CompanyQuote> => {
      const provider = providers[company.pricingSourceType];
      const quote = await provider.getQuote({
        companyId: company.id,
        serviceType,
        originCity: req.originCity,
        destinationCity: req.destinationCity,
        parcelType: req.parcelType,
        weightGrams: req.weightGrams,
        lengthCm: req.lengthCm,
        widthCm: req.widthCm,
        heightCm: req.heightCm,
        declaredValue: req.declaredValue,
        envelopePriceModifier,
      });

      return {
        companyId: company.id,
        companyName: company.name,
        logoUrl: company.logoUrl,
        quote,
      };
    })
  );

  return results.filter((r) => r.quote.available);
}

/** محاسبه مجدد و امن قیمت یک شرکت مشخص در سرور (برای ثبت نهایی سفارش) */
export async function getQuoteForCompany(
  companyId: string,
  req: QuoteRequest
): Promise<CompanyQuote | null> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || !company.active) return null;

  const serviceType = detectServiceType(req.originCity, req.destinationCity);
  if (company.type !== serviceType) return null;

  let envelopePriceModifier: number | undefined;
  if (req.parcelType === "envelope" && req.envelopeTypeId) {
    const envelopeType = await prisma.envelopeType.findUnique({
      where: { id: req.envelopeTypeId },
    });
    envelopePriceModifier = envelopeType ? Number(envelopeType.priceModifier) : 0;
  }

  const provider = providers[company.pricingSourceType];
  const quote = await provider.getQuote({
    companyId: company.id,
    serviceType,
    originCity: req.originCity,
    destinationCity: req.destinationCity,
    parcelType: req.parcelType,
    weightGrams: req.weightGrams,
    lengthCm: req.lengthCm,
    widthCm: req.widthCm,
    heightCm: req.heightCm,
    declaredValue: req.declaredValue,
    envelopePriceModifier,
  });

  return {
    companyId: company.id,
    companyName: company.name,
    logoUrl: company.logoUrl,
    quote,
  };
}

/** برای پیش‌نمایش «قیمت تقریبی» در صفحه اصلی — ارزان‌ترین گزینه در دسترس */
export async function getApproximatePrice(
  req: QuoteRequest
): Promise<number | null> {
  const quotes = await getQuotesForRequest(req);
  const available = quotes.filter((q) => q.quote.available) as Array<
    CompanyQuote & { quote: Extract<PriceQuoteResult, { available: true }> }
  >;
  if (available.length === 0) return null;
  return Math.min(...available.map((q) => q.quote.price));
}
