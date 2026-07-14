import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/panel/StatTile";
import { OrdersChart } from "@/components/panel/OrdersChart";
import { PieBreakdown } from "@/components/panel/PieBreakdown";
import { getMonthlyBuckets, countByBucket } from "@/lib/monthly-buckets";
import { requireStaffView } from "@/lib/auth/require-permission";

export default async function AdminDashboardPage() {
  await requireStaffView("dashboard");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayCount, weekCount, monthCount, allOrders, companies] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      select: { createdAt: true, serviceType: true, companyId: true },
    }),
    prisma.company.findMany({ select: { id: true, name: true } }),
  ]);

  const buckets = getMonthlyBuckets(6);
  const chartData = countByBucket(
    allOrders.map((o) => o.createdAt),
    buckets
  );

  const serviceTypeData = [
    { name: "بین‌شهری", value: allOrders.filter((o) => o.serviceType === "intercity").length },
    { name: "درون‌شهری", value: allOrders.filter((o) => o.serviceType === "intracity").length },
  ].filter((d) => d.value > 0);

  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const byCompanyCounts = new Map<string, number>();
  for (const o of allOrders) {
    byCompanyCounts.set(o.companyId, (byCompanyCounts.get(o.companyId) ?? 0) + 1);
  }
  const companyData = Array.from(byCompanyCounts.entries())
    .map(([id, value]) => ({ name: companyMap.get(id) ?? "نامشخص", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="سفارش امروز" value={String(todayCount)} icon="📅" />
        <StatTile label="سفارش هفته اخیر" value={String(weekCount)} icon="🗓" />
        <StatTile label="سفارش این ماه" value={String(monthCount)} icon="📦" />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">روند سفارش‌ها (۶ ماه اخیر)</h3>
        <OrdersChart data={chartData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-2">تفکیک بر اساس نوع سرویس</h3>
          <PieBreakdown data={serviceTypeData} />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-2">تفکیک بر اساس شرکت</h3>
          <PieBreakdown data={companyData} />
        </div>
      </div>
    </div>
  );
}
