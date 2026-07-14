import { clsx } from "clsx";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/generated/prisma/enums";

const colors: Record<OrderStatus, string> = {
  registered: "bg-neutral-100 text-neutral-700",
  confirmed: "bg-brand-blue-100 text-brand-blue-800",
  collecting: "bg-amber-100 text-amber-800",
  shipping: "bg-brand-green-100 text-brand-green-800",
  delivered: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        colors[status]
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
