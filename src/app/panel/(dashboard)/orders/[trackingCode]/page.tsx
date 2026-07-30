import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { AddressCard } from "@/components/panel/AddressCard";
import { formatToman } from "@/lib/validation";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export default async function PanelOrderDetailPage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = await params;
  const session = await getCustomerSession();

  const order = await prisma.order.findUnique({
    where: { trackingCode },
    include: {
      originAddress: true,
      destinationAddress: true,
      envelopeType: true,
      company: { select: { name: true } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!order || order.userId !== session?.userId) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-neutral-500">کد رهگیری</div>
          <div className="font-mono text-lg font-bold text-brand-blue-700" dir="ltr">
            {order.trackingCode}
          </div>
        </div>
        <div className="text-sm text-neutral-500">شرکت: {order.company.name}</div>
        <OrderStatusBadge status={order.status} />
        <div className="text-neutral-700 font-medium">
          {formatToman(Number(order.calculatedPrice))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AddressCard title="آدرس مبدا" address={order.originAddress} />
        <AddressCard title="آدرس مقصد" address={order.destinationAddress} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h4 className="font-semibold text-neutral-800 mb-3">مشخصات مرسوله</h4>
        <div className="text-sm text-neutral-600 space-y-1">
          <div>نوع: {order.parcelType === "envelope" ? "پاکت" : "بسته"}</div>
          {order.envelopeType && <div>نوع پاکت: {order.envelopeType.name}</div>}
          {order.weightGrams != null && <div>وزن: {order.weightGrams.toLocaleString("fa-IR")} گرم</div>}
          {order.lengthCm && (
            <div>
              ابعاد: {order.lengthCm} × {order.widthCm} × {order.heightCm} سانتی‌متر
            </div>
          )}
          {order.declaredValue && (
            <div>ارزش اظهارشده: {Number(order.declaredValue).toLocaleString("fa-IR")} تومان</div>
          )}
          {order.itemNote && <div>توضیحات: {order.itemNote}</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h4 className="font-semibold text-neutral-800 mb-3">تاریخچه وضعیت</h4>
        <ol className="flex flex-col gap-2">
          {order.statusHistory.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="size-2 rounded-full bg-brand-blue-500" />
              {ORDER_STATUS_LABELS[h.status]}
              <span className="text-xs text-neutral-400" dir="ltr">
                {h.changedAt.toLocaleString("fa-IR")}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
