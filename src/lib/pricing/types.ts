export type FormulaParams = {
  basePrice: number;
  pricePerKg: number;
  pricePerKm: number;
};

export type WeightTier = { minWeight: number; maxWeight: number; price: number };
export type DistanceFactor = {
  minDistance: number;
  maxDistance: number;
  factor: number;
};

export type TieredParams = {
  weightTiers: WeightTier[];
  distanceFactors: DistanceFactor[];
};

export type PriceQuoteInput = {
  companyId: string;
  serviceType: "intercity" | "intracity";
  originCity: string;
  destinationCity: string;
  parcelType: "envelope" | "package";
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  envelopePriceModifier?: number;
};

export type PriceQuoteResult = {
  available: true;
  price: number; // به تومان
  breakdown: Record<string, number>;
  estimatedDeliveryDays: [number, number];
} | {
  available: false;
  reason: string;
};

export interface PriceProvider {
  getQuote(input: PriceQuoteInput): Promise<PriceQuoteResult>;
}
