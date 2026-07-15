import { prisma } from "@/lib/prisma";
import { computeRouteDistanceKm } from "./distance";
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
 */
export class InternalFormulaProvider implements PriceProvider {
  async getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult> {
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

    // وزن مؤثر: پاکت‌ها وزن سبک استاندارد فرض می‌شوند
    const effectiveWeight =
      input.parcelType === "envelope" ? 0.5 : input.weightKg ?? 0.5;

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
