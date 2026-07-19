"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Bike, Mail } from "lucide-react";
import { IRAN_PROVINCES, getCitiesOfProvince, findProvinceForCity } from "@/lib/iran-locations";
import { AddressFields, emptyAddress, type AddressFormValue } from "@/components/order/AddressFields";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { HOME_WIZARD_RESET_EVENT } from "@/lib/home-wizard-reset";
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
  | "ie-origin-address"
  | "ie-destination"
  | "parcel";

export function HomeServiceFlow({
  envelopeTypes,
  intracityCities,
}: {
  envelopeTypes: EnvelopeType[];
  intracityCities: string[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [step, setStep] = useState<Step>("service");

  // پیک موتوری (درون‌شهری): یک شهر برای مبدا و مقصد
  const [icProvince, setIcProvince] = useState("");
  const [icCity, setIcCity] = useState("");
  const [icOrigin, setIcOrigin] = useState<AddressFormValue>(emptyAddress());
  const [icDestination, setIcDestination] = useState<AddressFormValue>(emptyAddress());

  // ارسال پستی (بین‌شهری): مبدا (استان/شهر + آدرس + نقشه در یک باکس واحد)، مقصد بدون نقشه ولی با فیلدهای جدا
  const [ieOrigin, setIeOrigin] = useState<AddressFormValue>(emptyAddress());
  const [ieDestProvince, setIeDestProvince] = useState("");
  const [ieDestCity, setIeDestCity] = useState("");
  const [ieDestination, setIeDestination] = useState<AddressFormValue>(emptyAddress());

  const [parcel, setParcel] = useState<ParcelDetailsValue>(emptyParcelDetails());

  useEffect(() => {
    function resetWizard() {
      setServiceType(null);
      setStep("service");
      setIcProvince("");
      setIcCity("");
      setIcOrigin(emptyAddress());
      setIcDestination(emptyAddress());
      setIeOrigin(emptyAddress());
      setIeDestProvince("");
      setIeDestCity("");
      setIeDestination(emptyAddress());
      setParcel(emptyParcelDetails());
    }

    window.addEventListener(HOME_WIZARD_RESET_EVENT, resetWizard);
    return () => window.removeEventListener(HOME_WIZARD_RESET_EVENT, resetWizard);
  }, []);

  function chooseService(type: ServiceType) {
    setServiceType(type);
    setStep(type === "intracity" ? "ic-city" : "ie-origin-address");
  }

  function chooseIntracityCity(cityName: string) {
    setIcCity(cityName);
    setIcProvince(findProvinceForCity(cityName));
  }

  function submit() {
    const needsWeight = serviceType !== "intracity";

    if (parcel.parcelType === "envelope" && !parcel.envelopeTypeId) {
      toast.show("لطفاً نوع پاکت را انتخاب کنید", "error");
      return;
    }
    if (parcel.parcelType === "package" && needsWeight) {
      if (!parcel.weightKg || Number(parcel.weightKg) < 0.1 || Number(parcel.weightKg) > 50) {
        toast.show("وزن بسته نمی‌تواند بیشتر از ۵۰ کیلوگرم باشد", "error");
        return;
      }
      if (!parcel.lengthCm || !parcel.widthCm || !parcel.heightCm) {
        toast.show("لطفاً ابعاد بسته را کامل وارد کنید", "error");
        return;
      }
    }

    const originProvince = serviceType === "intracity" ? icProvince : ieOrigin.province;
    const originCity = serviceType === "intracity" ? icCity : ieOrigin.city;
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
    if (parcel.parcelType === "package" && needsWeight) {
      params.set("weightKg", parcel.weightKg);
      params.set("lengthCm", parcel.lengthCm);
      params.set("widthCm", parcel.widthCm);
      params.set("heightCm", parcel.heightCm);
    }
    if (parcel.declaredValue) params.set("declaredValue", parcel.declaredValue);

    router.push(`/results?${params.toString()}`);
  }

  const totalSteps = 4;
  const stepIndexMap: Record<Step, number> = {
    service: 0,
    "ic-city": 1,
    "ic-origin": 2,
    "ic-destination": 3,
    "ie-origin-address": 1,
    "ie-destination": 2,
    parcel: 3,
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/[0.04] p-5 sm:p-8">
      {step === "service" && (
        <StepShell title="می‌خواهید چطور ارسال کنید؟" stepIndex={0} totalSteps={totalSteps}>
          <div className="grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseService("intracity")}
              className={clsx(
                "flex min-h-[260px] sm:min-h-[300px] flex-col items-center justify-center gap-5 rounded-3xl border-2 p-10 sm:p-14 transition-colors",
                "border-neutral-200 hover:border-brand-blue-400 hover:bg-brand-blue-50"
              )}
            >
              <Bike className="size-16 sm:size-20 text-brand-blue-500" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-neutral-800">پیک موتوری</span>
              <span className="text-base text-neutral-500">ارسال درون‌شهری، همان روز</span>
            </button>
            <button
              type="button"
              onClick={() => chooseService("intercity")}
              className={clsx(
                "flex min-h-[260px] sm:min-h-[300px] flex-col items-center justify-center gap-5 rounded-3xl border-2 p-10 sm:p-14 transition-colors",
                "border-neutral-200 hover:border-brand-green-400 hover:bg-brand-green-50"
              )}
            >
              <Mail className="size-16 sm:size-20 text-brand-green-600" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-neutral-800">ارسال پستی</span>
              <span className="text-base text-neutral-500">ارسال بین‌شهری به سراسر ایران</span>
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
          {intracityCities.length === 0 ? (
            <p className="text-sm text-neutral-500">
              فعلاً هیچ شهری برای سرویس پیک موتوری تعریف نشده است.
            </p>
          ) : (
            <Select label="شهر" value={icCity} onChange={(e) => chooseIntracityCity(e.target.value)}>
              <option value="">انتخاب شهر</option>
              {intracityCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
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

      {step === "ie-origin-address" && (
        <StepShell
          title="استان، شهر و آدرس مبدا (محل تحویل بسته)"
          stepIndex={stepIndexMap[step]}
          totalSteps={totalSteps}
          onBack={() => setStep("service")}
        >
          <AddressFields value={ieOrigin} onChange={setIeOrigin} showMap mapRequired />
          <NextButton
            disabled={
              !ieOrigin.city || ieOrigin.street.trim().length < 3 || !ieOrigin.plaque.trim()
            }
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
            <AddressFields
              value={{ ...ieDestination, province: ieDestProvince, city: ieDestCity }}
              onChange={setIeDestination}
              hideLocationSelect
              requireAlley
            />
          </div>
          <NextButton
            disabled={
              !ieDestCity ||
              ieDestination.street.trim().length < 3 ||
              !ieDestination.alley.trim() ||
              !ieDestination.plaque.trim()
            }
            onClick={() => setStep("parcel")}
          />
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
            serviceType={serviceType ?? "intercity"}
            originProvince={serviceType === "intracity" ? icProvince : ieOrigin.province}
            originCity={serviceType === "intracity" ? icCity : ieOrigin.city}
            destinationProvince={serviceType === "intracity" ? icProvince : ieDestProvince}
            destinationCity={serviceType === "intracity" ? icCity : ieDestCity}
          />
          <NextButton onClick={submit}>استعلام قیمت</NextButton>
        </StepShell>
      )}
    </div>
  );
}
