import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import {
  MAX_DAILY_RANGE_DAYS,
  MAX_MONTHLY_RANGE_MONTHS,
  getDayBuckets,
  getMonthBuckets,
  daysBetween,
  monthsBetween,
} from "@/lib/pwa-stats";

export async function GET(request: NextRequest) {
  const current = await getCurrentEmployee();
  if (!current || !current.can("commission_report", "view")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("mode");
  const startDateStr = params.get("startDate");
  const endDateStr = params.get("endDate");

  if (mode !== "daily" && mode !== "monthly") {
    return NextResponse.json({ error: "پارامتر mode باید daily یا monthly باشد" }, { status: 400 });
  }
  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: "پارامترهای startDate و endDate الزامی هستند" }, { status: 400 });
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "فرمت تاریخ نامعتبر است" }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: "تاریخ شروع نباید بعد از تاریخ پایان باشد" }, { status: 400 });
  }

  if (mode === "daily" && daysBetween(startDate, endDate) > MAX_DAILY_RANGE_DAYS) {
    return NextResponse.json(
      { error: `در حالت روزانه، بازه‌ی انتخاب‌شده نباید بیشتر از ${MAX_DAILY_RANGE_DAYS} روز باشد` },
      { status: 400 }
    );
  }
  if (mode === "monthly" && monthsBetween(startDate, endDate) > MAX_MONTHLY_RANGE_MONTHS) {
    return NextResponse.json(
      { error: `در حالت ماهانه، بازه‌ی انتخاب‌شده نباید بیشتر از ${MAX_MONTHLY_RANGE_MONTHS} ماه باشد` },
      { status: 400 }
    );
  }

  const buckets = mode === "daily" ? getDayBuckets(startDate, endDate) : getMonthBuckets(startDate, endDate);
  const rangeStart = buckets[0]?.start ?? startDate;
  const rangeEnd = buckets[buckets.length - 1]?.end ?? endDate;

  const [totalInstalls, installsInRange] = await Promise.all([
    prisma.pwaInstall.count(),
    prisma.pwaInstall.findMany({
      where: { createdAt: { gte: rangeStart, lt: rangeEnd } },
      select: { createdAt: true },
    }),
  ]);

  const counts = buckets.map((b) => ({
    label: b.label,
    count: installsInRange.filter((i) => i.createdAt >= b.start && i.createdAt < b.end).length,
  }));

  return NextResponse.json({ totalInstalls, buckets: counts });
}
