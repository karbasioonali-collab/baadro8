import { Calendar, CalendarDays, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { OrdersChart } from "@/components/panel/OrdersChart";
import { StatTile } from "@/components/panel/StatTile";
import { formatToman } from "@/lib/validation";
import { getMonthlyBuckets, countByBucket } from "@/lib/monthly-buckets";

export default async function PanelOverviewPage() {
  const session = await getCustomerSession();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalCount, todayCount, monthCount, orders] = await Promise.all([
    prisma.order.count({ where: { userId: session!.userId } }),
    prisma.order.count({ where: { userId: session!.userId, createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { userId: session!.userId, createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      where: { userId: session!.userId },
      select: { createdAt: true, calculatedPrice: true },
    }),
  ]);

  const totalPaid = orders.reduce((sum, o) => sum + Number(o.calculatedPrice), 0);
  const buckets = getMonthlyBuckets(6);
  const chartData = countByBucket(orders.map((o) => o.createdAt), buckets);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="سفارش امروز" value={String(todayCount)} icon={Calendar} />
        <StatTile label="سفارش این ماه" value={String(monthCount)} icon={CalendarDays} />
        <StatTile label="مجموع سفارش‌ها" value={String(totalCount)} icon={Package} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">روند سفارش‌ها (۶ ماه اخیر)</h3>
        <OrdersChart data={chartData} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-1">جمع مبلغ سفارش‌ها</h3>
        <p className="text-sm text-neutral-400 mb-2">
          (پرداخت آنلاین در سایت وجود ندارد؛ این مبلغ صرفاً برای شفافیت نمایش داده می‌شود)
        </p>
        <div className="text-2xl font-bold text-brand-blue-700">{formatToman(totalPaid)}</div>
      </div>
    </div>
  );
}
