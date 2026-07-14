export function computeCommission(
  finalPrice: number,
  commissionType: "percent" | "fixed",
  commissionValue: number
): number {
  if (commissionType === "percent") {
    return Math.round(finalPrice * (commissionValue / 100));
  }
  return Math.round(commissionValue);
}
