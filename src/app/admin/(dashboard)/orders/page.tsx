import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatToman } from "@/lib/validation";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus, ServiceType } from "@/generated/prisma/enums";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    companyId?: string;
    serviceType?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const orders = await prisma.order.findMany({
    where: {
      ...(sp.status ? { status: sp.status as OrderStatus } : {}),
      ...(sp.companyId ? { companyId: sp.companyId } : {}),
      ...(sp.serviceType ? { serviceType: sp.serviceType as ServiceType } : {}),
      ...(sp.q ? { trackingCode: { contains: sp.q, mode: "insensitive" } } : {}),
      ...(sp.from || sp.to
        ? {
            createdAt: {
              ...(sp.from ? { gte: new Date(sp.from) } : {}),
              ...(sp.to ? { lte: new Date(sp.to) } : {}),
            },
          }
        : {}),
    },
    include: { company: { select: { name: true } }, destinationAddress: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const statusOptions = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  return (
    <div>
      <form className="mb-4 flex flex-wrap gap-2 items-center" method="GET">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="جستجو با کد رهگیری"
          dir="ltr"
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm">
          <option value="">همه وضعیت‌ها</option>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="companyId" defaultValue={sp.companyId ?? ""} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm">
          <option value="">همه شرکت‌ها</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="serviceType" defaultValue={sp.serviceType ?? ""} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm">
          <option value="">همه سرویس‌ها</option>
          <option value="intercity">بین‌شهری</option>
          <option value="intracity">درون‌شهری</option>
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm" />
        <input type="date" name="to" defaultValue={sp.to} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm" />
        <button type="submit" className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white">
          اعمال فیلتر
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد رهگیری</th>
              <th className="p-3 text-right font-medium">شرکت</th>
              <th className="p-3 text-right font-medium">سرویس</th>
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
                  <Link href={`/admin/orders/${o.trackingCode}`} className="font-mono text-brand-blue-700 hover:underline" dir="ltr">
                    {o.trackingCode}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">{o.company.name}</td>
                <td className="p-3 text-neutral-600">
                  {o.serviceType === "intercity" ? "بین‌شهری" : "درون‌شهری"}
                </td>
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
                <td colSpan={7} className="p-8 text-center text-neutral-400">
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
