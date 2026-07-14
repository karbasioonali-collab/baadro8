import type { OrderStatus } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  registered: "ثبت شده",
  confirmed: "تایید شده توسط شرکت",
  collecting: "در حال جمع‌آوری",
  shipping: "در حال ارسال",
  delivered: "تحویل شده",
  canceled: "لغو شده",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "registered",
  "confirmed",
  "collecting",
  "shipping",
  "delivered",
];

export function nextStatusOptions(current: OrderStatus): OrderStatus[] {
  if (current === "delivered" || current === "canceled") return [];
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  const options: OrderStatus[] = [];
  if (idx !== -1 && idx + 1 < ORDER_STATUS_FLOW.length) {
    options.push(ORDER_STATUS_FLOW[idx + 1]);
  }
  options.push("canceled");
  return options;
}
