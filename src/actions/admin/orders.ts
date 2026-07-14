"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { nextStatusOptions, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { sendOrderStatusSms } from "@/lib/auth/otp";
import type { OrderStatus } from "@/generated/prisma/enums";

export type UpdateStatusResult = { ok: boolean; error?: string };

export async function updateAdminOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<UpdateStatusResult> {
  const current = await getCurrentEmployee();
  if (!current || !current.can("orders", "edit")) {
    return { ok: false, error: "شما دسترسی تغییر وضعیت سفارش را ندارید" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) return { ok: false, error: "سفارش یافت نشد" };

  const allowed = nextStatusOptions(order.status);
  if (!allowed.includes(newStatus)) {
    return { ok: false, error: "تغییر وضعیت مجاز نیست" };
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: newStatus } }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: newStatus,
        changedBy: current.employee.isFullAdmin ? "admin" : "employee",
        changedByEmployeeId: current.employee.id,
      },
    }),
  ]);

  await sendOrderStatusSms(order.user.mobile, order.trackingCode, ORDER_STATUS_LABELS[newStatus]);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.trackingCode}`);

  return { ok: true };
}
