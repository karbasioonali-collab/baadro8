"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCompanyOrderStatusAction } from "@/actions/company-orders";
import { ORDER_STATUS_LABELS, nextStatusOptions } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { OrderStatus } from "@/generated/prisma/enums";

export function CompanyOrderStatusChanger({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const options = nextStatusOptions(currentStatus);
  if (options.length === 0) return null;

  function handleClick(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateCompanyOrderStatusAction(orderId, status);
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
