import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { StatTile } from "@/components/panel/StatTile";
import { formatToman } from "@/lib/validation";

export default async function PanelPaymentsPage() {
  const session = await getCustomerSession();

  const orders = await prisma.order.findMany({
    where: { userId: session!.userId },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = orders.reduce((sum, o) => sum + Number(o.calculatedPrice), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-4 text-sm text-brand-blue-800">
        در بادرو پرداخت آنلاین وجود ندارد؛ تسویه حساب مستقیم با شرکت انجام می‌شود. این
        صفحه صرفاً برای شفافیت، جمع مبلغ سفارش‌های ثبت‌شده شما را نمایش می‌دهد.
      </div>

      <StatTile label="جمع کل مبلغ سفارش‌ها" value={formatToman(total)} icon="💳" />

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد رهگیری</th>
              <th className="p-3 text-right font-medium">شرکت</th>
              <th className="p-3 text-right font-medium">مبلغ</th>
              <th className="p-3 text-right font-medium">وضعیت پرداخت</th>
              <th className="p-3 text-right font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3 font-mono text-neutral-700" dir="ltr">
                  {o.trackingCode}
                </td>
                <td className="p-3 text-neutral-600">{o.company.name}</td>
                <td className="p-3 text-neutral-600">{formatToman(Number(o.calculatedPrice))}</td>
                <td className="p-3 text-neutral-500">تسویه خارج از سایت</td>
                <td className="p-3 text-neutral-400 text-xs" dir="ltr">
                  {o.createdAt.toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
