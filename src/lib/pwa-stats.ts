/** منطق خالص تقسیم‌بندی بازه‌ی تاریخ به سطل‌های روزانه/ماهانه و اعتبارسنجی محدودیت بازه — بدون هیچ وابستگی به Next.js/Prisma، برای تست مستقیم. */

export const MAX_DAILY_RANGE_DAYS = 31;
export const MAX_MONTHLY_RANGE_MONTHS = 12;

export type Bucket = { key: string; label: string; start: Date; end: Date };

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDayBuckets(start: Date, end: Date): Bucket[] {
  const buckets: Bucket[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= lastDay) {
    const bStart = new Date(cursor);
    const bEnd = new Date(cursor);
    bEnd.setDate(bEnd.getDate() + 1);
    buckets.push({
      key: dayKey(bStart),
      label: new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(bStart),
      start: bStart,
      end: bEnd,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function getMonthBuckets(start: Date, end: Date): Bucket[] {
  const buckets: Bucket[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= lastMonth) {
    const bStart = new Date(cursor);
    const bEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    buckets.push({
      key: `${bStart.getFullYear()}-${String(bStart.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short" }).format(bStart),
      start: bStart,
      end: bEnd,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

export function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

export function daysBetween(start: Date, end: Date): number {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
