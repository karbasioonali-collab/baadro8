import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatToman } from "@/lib/validation";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/generated/prisma/enums";

export default async function PanelOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const session = await getCustomerSession();

  const orders = await prisma.order.findMany({
    where: {
      userId: session!.userId,
      ...(status ? { status: status as OrderStatus } : {}),
      ...(q ? { trackingCode: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { company: { select: { name: true } }, destinationAddress: true },
    orderBy: { createdAt: "desc" },
  });

  const statusOptions = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2 items-center" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجو با کد رهگیری"
          dir="ltr"
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none"
        >
          <option value="">همه وضعیت‌ها</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white"
        >
          اعمال فیلتر
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد رهگیری</th>
              <th className="p-3 text-right font-medium">شرکت</th>
              <th className="p-3 text-right font-medium">مقصد</th>
              <th className="p-3 text-right font-medium">مبلغ</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
              <th className="p-3 text-right font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="p-3">
                  <Link
                    href={`/panel/orders/${o.trackingCode}`}
                    className="font-mono text-brand-blue-700 hover:underline"
                    dir="ltr"
                  >
                    {o.trackingCode}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">{o.company.name}</td>
                <td className="p-3 text-neutral-600">{o.destinationAddress.city}</td>
                <td className="p-3 text-neutral-600">{formatToman(Number(o.calculatedPrice))}</td>
                <td className="p-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="p-3 text-neutral-400 text-xs" dir="ltr">
                  {o.createdAt.toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  سفارشی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
