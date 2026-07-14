"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompanySession } from "@/lib/auth/session";
import { nextStatusOptions, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { sendOrderStatusSms } from "@/lib/auth/otp";
import type { OrderStatus } from "@/generated/prisma/enums";

export type UpdateStatusResult = { ok: boolean; error?: string };

export async function updateCompanyOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<UpdateStatusResult> {
  const session = await getCompanySession();
  if (!session) return { ok: false, error: "ابتدا وارد شوید" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order || order.companyId !== session.companyId) {
    return { ok: false, error: "سفارش یافت نشد" };
  }

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
        changedBy: "company_account",
        changedByCompanyAccountId: session.companyAccountId,
      },
    }),
  ]);

  await sendOrderStatusSms(
    order.user.mobile,
    order.trackingCode,
    ORDER_STATUS_LABELS[newStatus]
  );

  revalidatePath("/company/orders");
  revalidatePath(`/company/orders/${order.trackingCode}`);

  return { ok: true };
}
