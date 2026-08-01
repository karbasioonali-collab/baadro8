"use server";

import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import {
  getChaparTracking,
  isChaparBaseUrl,
  parseChaparCredentials,
} from "@/lib/chapar/client";

export type TrackResult =
  | {
      kind: "internal";
      trackingCode: string;
      companyName: string;
      currentStatusLabel: string;
      history: { statusLabel: string; changedAt: string }[];
    }
  | {
      kind: "api";
      companyName: string;
      status: string;
      history: { title: string; date?: string }[];
      origin?: string;
      destination?: string;
      agents?: string[];
      recipient?: string;
      signatureUrl?: string;
    }
  | { kind: "api_error"; message: string }
  | { kind: "external_link"; url: string }
  | { kind: "not_implemented" }
  | { kind: "not_found" };

export async function trackOrderAction(
  companyId: string,
  code: string
): Promise<TrackResult> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { kind: "not_found" };

  // اگر شرکت به یک API واقعی وصل است (فعلاً فقط چاپار)، رهگیری مستقیماً از
  // همان API خوانده می‌شود — این بررسی قبل از trackingMethod انجام می‌شود.
  if (company.apiBaseUrl) {
    if (!isChaparBaseUrl(company.apiBaseUrl)) {
      return { kind: "api_error", message: "اتصال API این شرکت هنوز پشتیبانی نمی‌شود" };
    }

    const creds = parseChaparCredentials(company.apiKey);
    if (!creds) {
      return { kind: "api_error", message: "تنظیمات احراز هویت API این شرکت ناقص است" };
    }

    try {
      const result = await getChaparTracking(
        { baseUrl: company.apiBaseUrl, ...creds },
        { reference: code.trim(), lang: "fa" }
      );
      if (!result) return { kind: "not_found" };
      return { kind: "api", companyName: company.name, ...result };
    } catch (err) {
      return {
        kind: "api_error",
        message: err instanceof Error ? err.message : "خطای نامشخص در اتصال به API چاپار",
      };
    }
  }

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
