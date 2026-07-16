import { prisma } from "@/lib/prisma";
import { getCompanySession } from "@/lib/auth/session";
import { formatToman } from "@/lib/validation";
import { getDailyBuckets, sumAmountByBucket } from "@/lib/daily-buckets";
import { AmountLineChart } from "@/components/panel/AmountLineChart";

export default async function CompanyReportsPage() {
  const session = await getCompanySession();

  const orders = await prisma.order.findMany({
    where: { companyId: session!.companyId },
    orderBy: { createdAt: "desc" },
    select: {
      trackingCode: true,
      createdAt: true,
      calculatedPrice: true,
      commissionAmount: true,
    },
  });

  const totalPrice = orders.reduce((sum, o) => sum + Number(o.calculatedPrice), 0);
  const totalCommission = orders.reduce((sum, o) => sum + Number(o.commissionAmount), 0);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const buckets = getDailyBuckets(start, end);
  const salesByDay = sumAmountByBucket(
    orders.map((o) => ({ date: o.createdAt, amount: Number(o.calculatedPrice) })),
    buckets
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">نمودار فروش (۳۰ روز اخیر)</h3>
        <AmountLineChart data={salesByDay} name="فروش" color="#1487c2" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد سفارش</th>
              <th className="p-3 text-right font-medium">تاریخ سفارش</th>
              <th className="p-3 text-right font-medium">مبلغ دریافتی</th>
              <th className="p-3 text-right font-medium">کمیسیون</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.trackingCode}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="p-3 font-mono text-brand-blue-700" dir="ltr">
                  {o.trackingCode}
                </td>
                <td className="p-3 text-neutral-400 text-xs" dir="ltr">
                  {o.createdAt.toLocaleDateString("fa-IR")}
                </td>
                <td className="p-3 text-neutral-600">{formatToman(Number(o.calculatedPrice))}</td>
                <td className="p-3 text-neutral-600">{formatToman(Number(o.commissionAmount))}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  سفارشی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
          {orders.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold text-neutral-800">
                <td className="p-3" colSpan={2}>
                  جمع کل
                </td>
                <td className="p-3">{formatToman(totalPrice)}</td>
                <td className="p-3">{formatToman(totalCommission)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
