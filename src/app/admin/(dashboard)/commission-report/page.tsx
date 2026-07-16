import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/validation";
import { requireStaffView } from "@/lib/auth/require-permission";
import { getDailyBuckets, sumAmountByBucket } from "@/lib/daily-buckets";
import { AmountLineChart } from "@/components/panel/AmountLineChart";

function monthRange(monthStr: string | undefined) {
  const now = new Date();
  const [y, m] = (monthStr ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end, monthStr: monthStr ?? `${y}-${String(m).padStart(2, "0")}` };
}

export default async function CommissionReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireStaffView("commission_report");
  const { month } = await searchParams;
  const { start, end, monthStr } = monthRange(month);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { company: { select: { id: true, name: true } } },
  });

  const byCompany = new Map<
    string,
    { name: string; count: number; totalPrice: number; totalCommission: number }
  >();

  for (const o of orders) {
    const key = o.companyId;
    const entry = byCompany.get(key) ?? {
      name: o.company.name,
      count: 0,
      totalPrice: 0,
      totalCommission: 0,
    };
    entry.count += 1;
    entry.totalPrice += Number(o.calculatedPrice);
    entry.totalCommission += Number(o.commissionAmount);
    byCompany.set(key, entry);
  }

  const rows = Array.from(byCompany.values()).sort((a, b) => b.totalCommission - a.totalCommission);
  const totalCommission = rows.reduce((s, r) => s + r.totalCommission, 0);

  const buckets = getDailyBuckets(start, end);
  const salesByDay = sumAmountByBucket(
    orders.map((o) => ({ date: o.createdAt, amount: Number(o.calculatedPrice) })),
    buckets
  );
  const commissionByDay = sumAmountByBucket(
    orders.map((o) => ({ date: o.createdAt, amount: Number(o.commissionAmount) })),
    buckets
  );

  return (
    <div>
      <form className="mb-4 flex items-center gap-2" method="GET">
        <input
          type="month"
          name="month"
          defaultValue={monthStr}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white">
          نمایش گزارش
        </button>
        <a
          href={`/admin/commission-report/export?month=${monthStr}`}
          className="h-10 flex items-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          دانلود CSV
        </a>
      </form>

      <div className="mb-4 rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-4 text-sm text-brand-blue-800">
        جمع کل کمیسیون ماه انتخاب‌شده: <b>{formatToman(totalCommission)}</b>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">نمودار فروش بر حسب تاریخ</h3>
          <AmountLineChart data={salesByDay} name="فروش" color="#1487c2" />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">نمودار کمیسیون بر حسب تاریخ</h3>
          <AmountLineChart data={commissionByDay} name="کمیسیون" color="#689722" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">شرکت</th>
              <th className="p-3 text-right font-medium">تعداد سفارش</th>
              <th className="p-3 text-right font-medium">جمع مبلغ سفارش‌ها</th>
              <th className="p-3 text-right font-medium">کمیسیون بادرو</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-medium text-neutral-800">{r.name}</td>
                <td className="p-3 text-neutral-600">{r.count}</td>
                <td className="p-3 text-neutral-600">{formatToman(r.totalPrice)}</td>
                <td className="p-3 text-neutral-800 font-medium">{formatToman(r.totalCommission)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  سفارشی در این بازه ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
