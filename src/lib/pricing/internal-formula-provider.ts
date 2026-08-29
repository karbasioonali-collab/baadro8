import { prisma } from "@/lib/prisma";
import { computeRouteDistanceKm } from "./distance";
import { DTS_COMPANY_ID } from "./dts-data";
import { DtsZoneFormulaProvider } from "./dts-provider";
import type {
  DistanceFactor,
  FormulaParams,
  PriceProvider,
  PriceQuoteInput,
  PriceQuoteResult,
  TieredParams,
  WeightTier,
} from "./types";

function findWeightTier(tiers: WeightTier[], weightKg: number) {
  return (
    tiers.find((t) => weightKg > t.minWeight && weightKg <= t.maxWeight) ??
    tiers[tiers.length - 1]
  );
}

function findDistanceFactor(factors: DistanceFactor[], distanceKm: number) {
  return (
    factors.find(
      (f) => distanceKm >= f.minDistance && distanceKm <= f.maxDistance
    ) ?? factors[factors.length - 1]
  );
}

function estimateDeliveryDays(
  serviceType: "intercity" | "intracity",
  distanceKm: number
): [number, number] {
  if (serviceType === "intracity") return [0, 1];
  if (distanceKm <= 300) return [1, 2];
  if (distanceKm <= 800) return [2, 3];
  return [3, 5];
}

/**
 * روش pricing_source_type = internal_formula
 * اولویت اول MVP — فرمول ریاضی ساده یا جدول پله‌ای که از پنل ادمین برای هر شرکت تعریف می‌شود.
 *
 * ⚠️ استثنا: شرکت DTS (companyId ثابت، DTS_COMPANY_ID) هم از همین
 * pricingSourceType=internal_formula استفاده می‌کند (چون افزودن یک مقدار
 * enum جدید فقط برای همین یک شرکت نیاز به migration داشت)، ولی منطق
 * قیمتش کاملاً متفاوت است — یک فرمول زون‌محور با داده‌ی ثابت در کد
 * (dts-data.ts/dts-provider.ts)، نه جدول PricingRule در دیتابیس. تشخیص با
 * companyId است، دقیقاً همان الگویی که ExternalApiProvider با hostname
 * (isChaparBaseUrl/isTapinBaseUrl) برای تشخیص provider واقعی استفاده می‌کند.
 */
export class InternalFormulaProvider implements PriceProvider {
  private dtsProvider = new DtsZoneFormulaProvider();

  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
    if (input.companyId === DTS_COMPANY_ID) {
      return this.dtsProvider.getQuote(input);
    }

    const rule = await prisma.pricingRule.findFirst({
      where: {
        companyId: input.companyId,
        sourceType: "internal_formula",
        active: true,
      },
    });

    if (!rule) {
      return { available: false, reason: "فرمول قیمتی برای این شرکت تعریف نشده است" };
    }

    const distanceKm = await computeRouteDistanceKm(
      input.originCity,
      input.destinationCity
    );

    // وزن مؤثر بر حسب کیلوگرم: ورودی مشتری (weightGrams) بر حسب گرم است، ولی
    // تعرفه‌های ادمین (pricePerKg، weightTiers) بر مبنای کیلوگرم تعریف شده‌اند،
    // پس تبدیل فقط همین‌جا انجام می‌شود. پاکت‌ها وزن سبک استاندارد فرض می‌شوند.
    const effectiveWeight =
      input.parcelType === "envelope"
        ? 0.5
        : input.weightGrams != null
          ? input.weightGrams / 1000
          : 0.5;

    const envelopeModifier =
      input.parcelType === "envelope" ? input.envelopePriceModifier ?? 0 : 0;

    // پیک موتوری (درون‌شهری) بدون وزن/ابعاد از کاربر گرفته می‌شود، پس قیمت
    // آن فقط بر اساس هزینه پایه و فاصله محاسبه می‌شود، بدون جزء وزنی.
    const isIntracity = input.serviceType === "intracity";

    if (rule.ruleType === "formula") {
      const params = rule.formulaParams as unknown as FormulaParams;
      const basePrice = params.basePrice;
      const weightCost = isIntracity ? 0 : effectiveWeight * params.pricePerKg;
      const distanceCost = distanceKm * params.pricePerKm;
      const price = Math.round(
        basePrice + weightCost + distanceCost + envelopeModifier
      );

      return {
        available: true,
        price,
        breakdown: {
          basePrice,
          weightCost: Math.round(weightCost),
          distanceCost: Math.round(distanceCost),
          envelopeModifier,
        },
        estimatedDeliveryDays: estimateDeliveryDays(
          input.serviceType,
          distanceKm
        ),
      };
    }

    // ruleType === "tiered"
    const tiers = rule.tiers as unknown as TieredParams;
    const weightTier = findWeightTier(tiers.weightTiers, effectiveWeight);
    const distanceFactor = findDistanceFactor(
      tiers.distanceFactors,
      distanceKm
    );

    if (!weightTier || !distanceFactor) {
      return {
        available: false,
        reason: "جدول قیمت برای این بازه وزن/فاصله تعریف نشده است",
      };
    }

    const price = Math.round(
      weightTier.price * distanceFactor.factor + envelopeModifier
    );

    return {
      available: true,
      price,
      breakdown: {
        tierPrice: weightTier.price,
        distanceFactor: distanceFactor.factor,
        envelopeModifier,
      },
      estimatedDeliveryDays: estimateDeliveryDays(
        input.serviceType,
        distanceKm
      ),
    };
  }
}
