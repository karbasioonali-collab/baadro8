import { prisma } from "@/lib/prisma";

/**
 * فاصله تقریبی بین دو شهرستان بر اساس جدول شاخص فاصله (CityDistanceIndex).
 * route_distance = |distance_index(مبدا) − distance_index(مقصد)|
 * برای سرویس درون‌شهری، فاصله صفر در نظر گرفته می‌شود (هزینه در basePrice شرکت لحاظ می‌شود).
 */
export async function computeRouteDistanceKm(
  originCity: string,
  destinationCity: string
): Promise<number> {
  if (originCity === destinationCity) return 0;

  const [origin, destination] = await Promise.all([
    prisma.cityDistanceIndex.findUnique({ where: { cityName: originCity } }),
    prisma.cityDistanceIndex.findUnique({
      where: { cityName: destinationCity },
    }),
  ]);

  if (!origin || !destination) return 0;

  return Math.abs(
    origin.distanceFromCenterKm - destination.distanceFromCenterKm
  );
}
