import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompanySession } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatToman } from "@/lib/validation";
import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export default async function CompanyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await getCompanySession();

  const orders = await prisma.order.findMany({
    where: {
      companyId: session!.companyId,
      ...(status ? { status: status as OrderStatus } : {}),
    },
    include: { destinationAddress: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusOptions = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/company"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !status ? "bg-brand-blue-500 text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          همه
        </Link>
        {statusOptions.map(([value, label]) => (
          <Link
            key={value}
            href={`/company?status=${value}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              status === value ? "bg-brand-blue-500 text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد رهگیری</th>
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
                    href={`/company/orders/${o.trackingCode}`}
                    className="font-mono text-brand-blue-700 hover:underline"
                    dir="ltr"
                  >
                    {o.trackingCode}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">
                  {o.destinationAddress.city}
                </td>
                <td className="p-3 text-neutral-600">
                  {formatToman(Number(o.calculatedPrice))}
                </td>
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
                <td colSpan={5} className="p-8 text-center text-neutral-400">
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
