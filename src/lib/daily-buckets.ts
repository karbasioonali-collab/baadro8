/** بازه [start,end) را به بازه‌های روزانه تقسیم می‌کند و برچسب شمسی هر روز را برمی‌گرداند */
export function getDailyBuckets(start: Date, end: Date) {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  while (cursor < end) {
    const bStart = new Date(cursor);
    const bEnd = new Date(cursor);
    bEnd.setDate(bEnd.getDate() + 1);
    const label = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(bStart);
    buckets.push({ label, start: bStart, end: bEnd });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

/** جمع مبلغ هر آیتم را در بازه‌ی روزانه‌ی مربوطه می‌ریزد */
export function sumAmountByBucket(
  items: { date: Date; amount: number }[],
  buckets: { label: string; start: Date; end: Date }[]
) {
  return buckets.map((b) => ({
    label: b.label,
    amount: items
      .filter((i) => i.date >= b.start && i.date < b.end)
      .reduce((sum, i) => sum + i.amount, 0),
  }));
}
