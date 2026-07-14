/** N ماه اخیر (شامل ماه جاری) را به بازه‌های [start,end) میلادی تقسیم می‌کند و برچسب شمسی هر بازه را برمی‌گرداند */
export function getMonthlyBuckets(monthsBack: number) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(start);
    buckets.push({ label, start, end });
  }

  return buckets;
}

export function countByBucket(
  dates: Date[],
  buckets: { label: string; start: Date; end: Date }[]
) {
  return buckets.map((b) => ({
    month: b.label,
    count: dates.filter((d) => d >= b.start && d < b.end).length,
  }));
}
