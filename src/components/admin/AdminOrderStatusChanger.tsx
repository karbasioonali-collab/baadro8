"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAdminOrderStatusAction } from "@/actions/admin/orders";
import { ORDER_STATUS_LABELS, nextStatusOptions } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { OrderStatus } from "@/generated/prisma/enums";

export function AdminOrderStatusChanger({
  orderId,
  currentStatus,
  canEdit,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  if (!canEdit) return null;

  const options = nextStatusOptions(currentStatus);
  if (options.length === 0) return null;

  function handleClick(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateAdminOrderStatusAction(orderId, status);
      if (!result.ok) {
        toast.show(result.error ?? "خطا در تغییر وضعیت", "error");
        return;
      }
      toast.show("وضعیت سفارش به‌روزرسانی شد", "success");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => (
        <Button
          key={status}
          variant={status === "canceled" ? "danger" : "primary"}
          size="sm"
          loading={pending}
          onClick={() => handleClick(status)}
        >
          تغییر به: {ORDER_STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  );
}
