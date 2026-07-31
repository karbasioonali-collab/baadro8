"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { getQuoteForCompany, detectServiceType } from "@/lib/pricing/engine";
import { generateTrackingCode } from "@/lib/tracking-code";
import { addressSchema, personNameSchema } from "@/lib/validation";

const parcelSchema = z.object({
  destination: addressSchema,
  parcelType: z.enum(["envelope", "package"]),
  envelopeTypeId: z.string().optional(),
  weightGrams: z.number().min(100).max(50000).optional(),
  lengthCm: z.number().int().min(1).max(200).optional(),
  widthCm: z.number().int().min(1).max(200).optional(),
  heightCm: z.number().int().min(1).max(200).optional(),
  declaredValue: z.number().min(0).optional(),
  itemNote: z.string().max(200).optional(),
});

const createOrderBatchSchema = z.object({
  companyId: z.string().min(1),
  senderName: personNameSchema,
  origin: addressSchema,
  parcels: z.array(parcelSchema).min(1, "حداقل یک مرسوله لازم است"),
});

export type CreateOrderBatchInput = z.infer<typeof createOrderBatchSchema>;

export type CreateOrderBatchResult =
  | {
      ok: true;
      batchId: string;
      orders: { trackingCode: string; price: number }[];
    }
  | { ok: false; error: string };

export async function createOrderBatchAction(
  input: CreateOrderBatchInput
): Promise<CreateOrderBatchResult> {
  const session = await getCustomerSession();
  if (!session) {
    return { ok: false, error: "برای ثبت سفارش ابتدا وارد شوید" };
  }

  const parsed = createOrderBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  const { companyId, origin, parcels } = parsed.data;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || !company.active) {
    return { ok: false, error: "شرکت انتخاب‌شده در دسترس نیست" };
  }

  for (const parcel of parcels) {
    if (parcel.parcelType === "envelope" && !parcel.envelopeTypeId) {
      return { ok: false, error: "لطفاً نوع پاکت را برای همه مرسوله‌ها انتخاب کنید" };
    }
    const serviceType = detectServiceType(origin.city, parcel.destination.city);
    if (serviceType !== company.type) {
      return {
        ok: false,
        error: "مسیر یکی از مرسوله‌ها با نوع سرویس شرکت انتخاب‌شده سازگار نیست",
      };
    }
    // پیک موتوری (intracity) وزن/ابعاد نمی‌گیرد؛ قیمتش فقط بر اساس فاصله است
    if (
      serviceType !== "intracity" &&
      parcel.parcelType === "package" &&
      (!parcel.weightGrams || !parcel.lengthCm || !parcel.widthCm || !parcel.heightCm)
    ) {
      return { ok: false, error: "لطفاً وزن و ابعاد بسته را کامل وارد کنید" };
    }
  }

  const quotes = await Promise.all(
    parcels.map((parcel) =>
      getQuoteForCompany(companyId, {
        originProvince: origin.province,
        originCity: origin.city,
        destinationProvince: parcel.destination.province,
        destinationCity: parcel.destination.city,
        parcelType: parcel.parcelType,
        weightGrams: parcel.weightGrams,
        lengthCm: parcel.lengthCm,
        widthCm: parcel.widthCm,
        heightCm: parcel.heightCm,
        declaredValue: parcel.declaredValue,
        envelopeTypeId: parcel.envelopeTypeId,
      })
    )
  );

  for (const q of quotes) {
    if (!q || !q.quote.available) {
      return { ok: false, error: "امکان محاسبه قیمت برای یکی از مرسوله‌ها وجود ندارد" };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const originAddress = await tx.address.create({ data: origin });

    const batch = await tx.orderBatch.create({
      data: { userId: session.userId, companyId },
    });

    const createdOrders: { trackingCode: string; price: number }[] = [];

    for (let i = 0; i < parcels.length; i++) {
      const parcel = parcels[i];
      const quote = quotes[i]!;
      const price = quote.quote.available ? quote.quote.price : 0;

      const destinationAddress = await tx.address.create({
        data: parcel.destination,
      });

      let trackingCode = generateTrackingCode();
      // اطمینان از یکتا بودن کد رهگیری
      while (await tx.order.findUnique({ where: { trackingCode } })) {
        trackingCode = generateTrackingCode();
      }

      const commissionAmount = Math.round(
        company.commissionType === "percent"
          ? price * (Number(company.commissionValue) / 100)
          : Number(company.commissionValue)
      );

      const order = await tx.order.create({
        data: {
          trackingCode,
          batchId: batch.id,
          userId: session.userId,
          companyId,
          serviceType: detectServiceType(origin.city, parcel.destination.city),
          originAddressId: originAddress.id,
          destinationAddressId: destinationAddress.id,
          parcelType: parcel.parcelType,
          envelopeTypeId: parcel.envelopeTypeId || null,
          weightGrams: parcel.weightGrams ?? null,
          lengthCm: parcel.lengthCm ?? null,
          widthCm: parcel.widthCm ?? null,
          heightCm: parcel.heightCm ?? null,
          declaredValue: parcel.declaredValue ?? null,
          itemNote: parcel.itemNote || null,
          calculatedPrice: price,
          commissionAmount,
          paymentStatus: "not_applicable",
          status: "registered",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "registered",
          changedBy: "system",
        },
      });

      createdOrders.push({ trackingCode: order.trackingCode, price });
    }

    return { batchId: batch.id, orders: createdOrders };
  });

  return { ok: true, ...result };
}

export async function getOrderByTrackingCodeAction(trackingCode: string) {
  const order = await prisma.order.findUnique({
    where: { trackingCode: trackingCode.trim() },
    include: {
      company: { select: { name: true, logoUrl: true } },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  });
  return order;
}
