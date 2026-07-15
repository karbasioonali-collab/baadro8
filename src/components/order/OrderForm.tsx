"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrderBatchAction } from "@/actions/orders";
import { AddressFields, emptyAddress, type AddressFormValue } from "./AddressFields";
import { ParcelRow, type ParcelFormValue } from "./ParcelRow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `parcel-${keyCounter}-${Date.now()}`;
}

function makeParcel(
  destProvince: string,
  destCity: string,
  parcelType: "envelope" | "package",
  envelopeTypeId: string,
  weightKg: string,
  lengthCm: string,
  widthCm: string,
  heightCm: string,
  declaredValue: string
): ParcelFormValue {
  return {
    key: newKey(),
    destination: emptyAddress(destProvince, destCity),
    parcelType,
    envelopeTypeId,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValue,
    itemNote: "",
  };
}

export function OrderForm({
  companyId,
  companyName,
  serviceType,
  originProvince,
  originCity,
  initial,
  envelopeTypes,
  userMobile,
}: {
  companyId: string;
  companyName: string;
  /** پیک موتوری (intracity) وزن/ابعاد نمی‌گیرد؛ قیمتش فقط بر اساس فاصله است */
  serviceType: "intracity" | "intercity";
  originProvince: string;
  originCity: string;
  initial: {
    destinationProvince: string;
    destinationCity: string;
    parcelType: "envelope" | "package";
    envelopeTypeId: string;
    weightKg: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
    declaredValue: string;
  };
  envelopeTypes: { id: string; name: string }[];
  userMobile: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const needsWeight = serviceType !== "intracity";

  const [senderName, setSenderName] = useState("");
  const [origin, setOrigin] = useState<AddressFormValue>(
    emptyAddress(originProvince, originCity)
  );
  const [parcels, setParcels] = useState<ParcelFormValue[]>([
    makeParcel(
      initial.destinationProvince,
      initial.destinationCity,
      initial.parcelType,
      initial.envelopeTypeId,
      initial.weightKg,
      initial.lengthCm,
      initial.widthCm,
      initial.heightCm,
      initial.declaredValue
    ),
  ]);

  function addParcel() {
    setParcels((prev) => [
      ...prev,
      makeParcel(
        initial.destinationProvince,
        initial.destinationCity,
        "package",
        "",
        "",
        "",
        "",
        "",
        ""
      ),
    ]);
  }

  function updateParcel(key: string, value: ParcelFormValue) {
    setParcels((prev) => prev.map((p) => (p.key === key ? value : p)));
  }

  function removeParcel(key: string) {
    setParcels((prev) => prev.filter((p) => p.key !== key));
  }

  function handleSubmit() {
    if (senderName.trim().length < 3) {
      toast.show("نام باید حداقل ۳ حرف باشد", "error");
      return;
    }
    if (!origin.street.trim() || !origin.plaque.trim()) {
      toast.show("لطفاً آدرس فرستنده را کامل وارد کنید", "error");
      return;
    }

    for (const p of parcels) {
      if (!p.destination.street.trim() || !p.destination.plaque.trim()) {
        toast.show("لطفاً آدرس همه گیرندگان را کامل وارد کنید", "error");
        return;
      }
      if (p.parcelType === "envelope" && !p.envelopeTypeId) {
        toast.show("لطفاً نوع پاکت را انتخاب کنید", "error");
        return;
      }
      if (
        needsWeight &&
        p.parcelType === "package" &&
        (!p.weightKg || !p.lengthCm || !p.widthCm || !p.heightCm)
      ) {
        toast.show("لطفاً وزن و ابعاد بسته را کامل وارد کنید", "error");
        return;
      }
    }

    startTransition(async () => {
      const result = await createOrderBatchAction({
        companyId,
        senderName,
        origin: {
          province: origin.province,
          city: origin.city,
          street: origin.street,
          alley: origin.alley,
          plaque: origin.plaque,
          floor: origin.floor,
          description: origin.description,
          postalCode: origin.postalCode,
          lat: origin.lat ?? undefined,
          lng: origin.lng ?? undefined,
        },
        parcels: parcels.map((p) => ({
          destination: {
            province: p.destination.province,
            city: p.destination.city,
            street: p.destination.street,
            alley: p.destination.alley,
            plaque: p.destination.plaque,
            floor: p.destination.floor,
            description: p.destination.description,
            postalCode: p.destination.postalCode,
            lat: p.destination.lat ?? undefined,
            lng: p.destination.lng ?? undefined,
          },
          parcelType: p.parcelType,
          envelopeTypeId: p.envelopeTypeId || undefined,
          weightKg: p.weightKg ? Number(p.weightKg) : undefined,
          lengthCm: p.lengthCm ? Number(p.lengthCm) : undefined,
          widthCm: p.widthCm ? Number(p.widthCm) : undefined,
          heightCm: p.heightCm ? Number(p.heightCm) : undefined,
          declaredValue: p.declaredValue ? Number(p.declaredValue) : undefined,
          itemNote: p.itemNote || undefined,
        })),
      });

      if (!result.ok) {
        toast.show(result.error, "error");
        return;
      }

      toast.show("سفارش شما با موفقیت ثبت شد", "success");
      const codes = result.orders.map((o) => o.trackingCode).join(",");
      router.push(`/order/confirmation?codes=${encodeURIComponent(codes)}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 px-4 py-3 text-sm text-brand-blue-800">
        شرکت انتخاب‌شده: <b>{companyName}</b>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">اطلاعات فرستنده</h3>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <Input
            label="نام و نام‌خانوادگی"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
          <Input label="شماره موبایل" value={userMobile} disabled dir="ltr" />
        </div>
        <div className="text-sm font-medium text-neutral-700 mb-2">آدرس مبدا</div>
        <AddressFields value={origin} onChange={setOrigin} showMap mapRequired />
      </div>

      {parcels.map((p, idx) => (
        <ParcelRow
          key={p.key}
          index={idx}
          value={p}
          envelopeTypes={envelopeTypes}
          needsWeight={needsWeight}
          onChange={(v) => updateParcel(p.key, v)}
          onRemove={() => removeParcel(p.key)}
          removable={parcels.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addParcel}
        className="self-start rounded-xl border border-dashed border-brand-blue-300 px-4 py-2.5 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-50 transition-colors"
      >
        + افزودن مرسوله دیگر
      </button>

      <Button size="lg" loading={pending} onClick={handleSubmit} className="w-full sm:w-auto">
        تایید نهایی سفارش
      </Button>
    </div>
  );
}
