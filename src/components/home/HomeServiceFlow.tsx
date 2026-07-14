"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { IRAN_PROVINCES, getCitiesOfProvince } from "@/lib/iran-locations";
import { AddressFields, emptyAddress, type AddressFormValue } from "@/components/order/AddressFields";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { StepShell, NextButton } from "./StepShell";
import { ParcelDetailsStep, type ParcelDetailsValue, emptyParcelDetails } from "./ParcelDetailsStep";

type EnvelopeType = { id: string; name: string };
type ServiceType = "intracity" | "intercity";

const provinceNames = IRAN_PROVINCES.map((p) => p.name);

function CityPicker({
  title,
  province,
  city,
  onChangeProvince,
  onChangeCity,
}: {
  title: string;
  province: string;
  city: string;
  onChangeProvince: (v: string) => void;
  onChangeCity: (v: string) => void;
}) {
  const cities = useMemo(() => getCitiesOfProvince(province), [province]);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Select label={`استان ${title}`} value={province} onChange={(e) => onChangeProvince(e.target.value)}>
        <option value="">انتخاب استان</option>
        {provinceNames.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
      <Select
        label={`شهرستان ${title}`}
        value={city}
        disabled={!province}
        onChange={(e) => onChangeCity(e.target.value)}
      >
        <option value="">{province ? "انتخاب شهرستان" : "ابتدا استان را انتخاب کنید"}</option>
        {cities.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

type Step =
  | "service"
  | "ic-city"
  | "ic-origin"
  | "ic-destination"
  | "ie-origin-city"
  | "ie-origin-address"
  | "ie-destination"
  | "parcel";

export function HomeServiceFlow({ envelopeTypes }: { envelopeTypes: EnvelopeType[] }) {
  const router = useRouter();
  const toast = useToast();

  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [step, setStep] = useState<Step>("service");

  // پیک موتوری (درون‌شهری): یک شهر برای مبدا و مقصد
  const [icProvince, setIcProvince] = useState("");
  const [icCity, setIcCity] = useState("");
  const [icOrigin, setIcOrigin] = useState<AddressFormValue>(emptyAddress());
  const [icDestination, setIcDestination] = useState<AddressFormValue>(emptyAddress());

  // ارسال پستی (بین‌شهری): مبدا با نقشه، مقصد فقط شهر/آدرس متنی
  const [ieOriginProvince, setIeOriginProvince] = useState("");
  const [ieOriginCity, setIeOriginCity] = useState("");
  const [ieOrigin, setIeOrigin] = useState<AddressFormValue>(emptyAddress());
  const [ieDestProvince, setIeDestProvince] = useState("");
  const [ieDestCity, setIeDestCity] = useState("");
  const [ieDestText, setIeDestText] = useState("");

  const [parcel, setParcel] = useState<ParcelDetailsValue>(emptyParcelDetails());

  function chooseService(type: ServiceType) {
    setServiceType(type);
    setStep(type === "intracity" ? "ic-city" : "ie-origin-city");
  }

  function submit() {
    if (parcel.parcelType === "envelope" && !parcel.envelopeTypeId) {
      toast.show("لطفاً نوع پاکت را انتخاب کنید", "error");
      return;
    }
    if (parcel.parcelType === "package") {
      if (!parcel.weightKg || Number(parcel.weightKg) < 0.1 || Number(parcel.weightKg) > 50) {
        toast.show("وزن بسته نمی‌تواند بیشتر از ۵۰ کیلوگرم باشد", "error");
        return;
      }
      if (!parcel.lengthCm || !parcel.widthCm || !parcel.heightCm) {
        toast.show("لطفاً ابعاد بسته را کامل وارد کنید", "error");
        return;
      }
    }

    const originProvince = serviceType === "intracity" ? icProvince : ieOriginProvince;
    const originCity = serviceType === "intracity" ? icCity : ieOriginCity;
    const destinationProvince = serviceType === "intracity" ? icProvince : ieDestProvince;
    const destinationCity = serviceType === "intracity" ? icCity : ieDestCity;

    const params = new URLSearchParams({
      originProvince,
      originCity,
      destinationProvince,
      destinationCity,
      parcelType: parcel.parcelType,
    });
    if (parcel.parcelType === "envelope") params.set("envelopeTypeId", parcel.envelopeTypeId);
    if (parcel.parcelType === "package") {
      params.set("weightKg", parcel.weightKg);
      params.set("lengthCm", parcel.lengthCm);
      params.set("widthCm", parcel.widthCm);
      params.set("heightCm", parcel.heightCm);
    }

    router.push(`/results?${params.toString()}`);
  }

  const totalSteps = 4;
  const stepIndexMap: Record<Step, number> = {
    service: 0,
    "ic-city": 1,
    "ic-origin": 2,
    "ic-destination": 3,
    "ie-origin-city": 1,
    "ie-origin-address": 2,
    "ie-destination": 3,
    parcel: 3,
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/[0.04] p-5 sm:p-8">
      {step === "service" && (
        <StepShell title="می‌خواهید چطور ارسال کنید؟" stepIndex={0} totalSteps={totalSteps}>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseService("intracity")}
              className={clsx(
                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-colors",
                "border-neutral-200 hover:border-brand-blue-400 hover:bg-brand-blue-50"
              )}
            >
              <span className="text-4xl">🏍️</span>
              <span className="font-bold text-neutral-800">پیک موتوری</span>
              <span className="text-sm text-neutral-500">ارسال درون‌شهری، همان روز</span>
            </button>
            <button
              type="button"
              onClick={() => chooseService("intercity")}
              className={clsx(
                "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-colors",
                "border-neutral-200 hover:border-brand-green-400 hover:bg-brand-green-50"
              )}
            >
              <span className="text-4xl">📮</span>
              <span className="font-bold text-neutral-800">ارسال پستی</span>
              <span className="text-sm text-neutral-500">ارسال بین‌شهری به سراسر ایران</span>
            </button>
          </div>
        </StepShell>
      )}

      {step === "ic-city" && (
        <StepShell
          title="شهر مورد نظر را انتخاب کنید"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("service")}
        >
          <CityPicker
            title=""
            province={icProvince}
            city={icCity}
            onChangeProvince={(v) => {
              setIcProvince(v);
              setIcCity("");
            }}
            onChangeCity={setIcCity}
          />
          <NextButton disabled={!icCity} onClick={() => setStep("ic-origin")} />
        </StepShell>
      )}

      {step === "ic-origin" && (
        <StepShell
          title="آدرس مبدا (محل تحویل بسته به پیک)"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("ic-city")}
        >
          <AddressFields
            value={{ ...icOrigin, province: icProvince, city: icCity }}
            onChange={setIcOrigin}
            hideLocationSelect
            showMap
            mapRequired
          />
          <NextButton
            disabled={icOrigin.street.trim().length < 3 || !icOrigin.plaque.trim()}
            onClick={() => setStep("ic-destination")}
          />
        </StepShell>
      )}

      {step === "ic-destination" && (
        <StepShell
          title="آدرس مقصد (محل تحویل بسته توسط پیک)"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("ic-origin")}
        >
          <AddressFields
            value={{ ...icDestination, province: icProvince, city: icCity }}
            onChange={setIcDestination}
            hideLocationSelect
            showMap
            mapRequired
          />
          <NextButton
            disabled={icDestination.street.trim().length < 3 || !icDestination.plaque.trim()}
            onClick={() => setStep("parcel")}
          />
        </StepShell>
      )}

      {step === "ie-origin-city" && (
        <StepShell
          title="شهر مبدا را انتخاب کنید"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("service")}
        >
          <CityPicker
            title=""
            province={ieOriginProvince}
            city={ieOriginCity}
            onChangeProvince={(v) => {
              setIeOriginProvince(v);
              setIeOriginCity("");
            }}
            onChangeCity={setIeOriginCity}
          />
          <NextButton disabled={!ieOriginCity} onClick={() => setStep("ie-origin-address")} />
        </StepShell>
      )}

      {step === "ie-origin-address" && (
        <StepShell
          title="آدرس مبدا (محل تحویل بسته)"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("ie-origin-city")}
        >
          <AddressFields
            value={{ ...ieOrigin, province: ieOriginProvince, city: ieOriginCity }}
            onChange={setIeOrigin}
            hideLocationSelect
            showMap
            mapRequired
          />
          <NextButton
            disabled={ieOrigin.street.trim().length < 3 || !ieOrigin.plaque.trim()}
            onClick={() => setStep("ie-destination")}
          />
        </StepShell>
      )}

      {step === "ie-destination" && (
        <StepShell
          title="شهر و آدرس مقصد"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("ie-origin-address")}
        >
          <CityPicker
            title=""
            province={ieDestProvince}
            city={ieDestCity}
            onChangeProvince={(v) => {
              setIeDestProvince(v);
              setIeDestCity("");
            }}
            onChangeCity={setIeDestCity}
          />
          <div className="mt-3">
            <Input
              label="آدرس مقصد (اختیاری)"
              value={ieDestText}
              onChange={(e) => setIeDestText(e.target.value)}
              placeholder="مثلا خیابان، کوچه، پلاک گیرنده"
            />
          </div>
          <NextButton disabled={!ieDestCity} onClick={() => setStep("parcel")} />
        </StepShell>
      )}

      {step === "parcel" && (
        <StepShell
          title="مشخصات مرسوله"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() =>
            setStep(serviceType === "intracity" ? "ic-destination" : "ie-destination")
          }
        >
          <ParcelDetailsStep
            value={parcel}
            onChange={setParcel}
            envelopeTypes={envelopeTypes}
            originProvince={serviceType === "intracity" ? icProvince : ieOriginProvince}
            originCity={serviceType === "intracity" ? icCity : ieOriginCity}
            destinationProvince={serviceType === "intracity" ? icProvince : ieDestProvince}
            destinationCity={serviceType === "intracity" ? icCity : ieDestCity}
          />
          <NextButton onClick={submit}>استعلام قیمت</NextButton>
        </StepShell>
      )}
    </div>
  );
}
