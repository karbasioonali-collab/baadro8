import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatToman } from "@/lib/validation";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const orders = await prisma.order.findMany({
    where: { userId: id },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-2">{user.name ?? "بدون نام"}</h3>
        <div className="text-sm text-neutral-600" dir="ltr">
          {user.mobile}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">کد رهگیری</th>
              <th className="p-3 text-right font-medium">شرکت</th>
              <th className="p-3 text-right font-medium">مبلغ</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
              <th className="p-3 text-right font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 last:border-0">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.trackingCode}`} className="font-mono text-brand-blue-700 hover:underline" dir="ltr">
                    {o.trackingCode}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">{o.company.name}</td>
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
                <td colSpan={5} className="p-8 text-center text-neutral-400">
                  این کاربر هنوز سفارشی ثبت نکرده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
