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
  originProvince?: string;
  originCity: string;
  // مختصات GPS مبدا — از همان lat/lng که MapPicker موقع انتخاب آدرس مبدا
  // جمع‌آوری می‌کند (Address.lat/lng در دیتابیس از قبل وجود دارند؛ این
  // فقط بستری در لایه‌ی قیمت‌گذاری بود که کم داشت). الوپست به این نیاز
  // دارد (calc با pick.location.lat/lng)، ولی چون این ورودی مشترک همه‌ی
  // providerهاست، اینجا و نه فقط در یک provider اضافه شد.
  originLat?: number;
  originLng?: number;
  destinationProvince?: string;
  destinationCity: string;
  // مختصات GPS مقصد — همان الگوی originLat/originLng بالا، فقط برای آدرس
  // مقصد. الوپیک (پیک موتوری درون‌شهری) به این نیاز دارد چون calc آن
  // addresses:[{type:"origin",...},{type:"destination",...}] می‌خواهد، نه
  // فقط مبدا. در UI فعلاً فقط مرحله‌ی «آدرس مقصد» پیک درون‌شهری
  // (ic-destination در HomeServiceFlow) نقشه‌ی مقصد را اجباری جمع‌آوری
  // می‌کند؛ برای ارسال پستی بین‌شهری نقشه‌ی مقصد اختیاری است (و برای
  // الوپیک هم مهم نیست چون فقط درون‌شهری است).
  destinationLat?: number;
  destinationLng?: number;
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
