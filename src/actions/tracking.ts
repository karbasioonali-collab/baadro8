"use server";

import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";

export type TrackResult =
  | {
      kind: "internal";
      trackingCode: string;
      companyName: string;
      currentStatusLabel: string;
      history: { statusLabel: string; changedAt: string }[];
    }
  | { kind: "external_link"; url: string }
  | { kind: "not_implemented" }
  | { kind: "not_found" };

export async function trackOrderAction(
  companyId: string,
  code: string
): Promise<TrackResult> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { kind: "not_found" };

  if (company.trackingMethod === "internal") {
    const order = await prisma.order.findFirst({
      where: { trackingCode: code.trim(), companyId },
      include: { statusHistory: { orderBy: { changedAt: "asc" } } },
    });
    if (!order) return { kind: "not_found" };

    return {
      kind: "internal",
      trackingCode: order.trackingCode,
      companyName: company.name,
      currentStatusLabel: ORDER_STATUS_LABELS[order.status],
      history: order.statusHistory.map((h) => ({
        statusLabel: ORDER_STATUS_LABELS[h.status],
        changedAt: h.changedAt.toISOString(),
      })),
    };
  }

  if (company.trackingMethod === "external_url" && company.trackingEndpoint) {
    return { kind: "external_link", url: company.trackingEndpoint };
  }

  // trackingMethod === "api" یا external_url بدون endpoint — در فاز بعدی تکمیل می‌شود
  return { kind: "not_implemented" };
}
