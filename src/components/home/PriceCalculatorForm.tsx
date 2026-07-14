"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { IRAN_PROVINCES, getCitiesOfProvince } from "@/lib/iran-locations";
import { getApproximatePriceAction } from "@/actions/quote";
import { formatToman } from "@/lib/validation";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type EnvelopeType = { id: string; name: string };

const provinceNames = IRAN_PROVINCES.map((p) => p.name);

function LocationPicker({
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
    <div className="grid grid-cols-2 gap-2">
      <Select
        label={`استان ${title}`}
        value={province}
        onChange={(e) => onChangeProvince(e.target.value)}
      >
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

export function PriceCalculatorForm({
  envelopeTypes,
}: {
  envelopeTypes: EnvelopeType[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [originProvince, setOriginProvince] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [destinationProvince, setDestinationProvince] = useState("");
  const [destinationCity, setDestinationCity] = useState("");

  const [parcelType, setParcelType] = useState<"envelope" | "package" | null>(
    null
  );
  const [envelopeTypeId, setEnvelopeTypeId] = useState<string>("");

  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [approxPrice, setApproxPrice] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // ریست قیمت تقریبی وقتی ورودی‌ها ناقص می‌شوند، پیش از فراخوانی دیبانس‌شده
    // به سرور (سیستم خارجی)؛ این افکت برای همگام‌سازی با آن سرویس async است.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (
      parcelType !== "package" ||
      !originCity ||
      !destinationCity ||
      !weightKg ||
      Number(weightKg) <= 0
    ) {
      setApproxPrice(null);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const price = await getApproximatePriceAction({
          originProvince,
          originCity,
          destinationProvince,
          destinationCity,
          parcelType: "package",
          weightKg: Number(weightKg),
        });
        setApproxPrice(price);
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [parcelType, originCity, destinationCity, weightKg, originProvince, destinationProvince]);

  function handleSubmit() {
    if (!originProvince || !originCity || !destinationProvince || !destinationCity) {
      toast.show("لطفاً استان و شهر مبدا و مقصد را انتخاب کنید", "error");
      return;
    }
    if (!parcelType) {
      toast.show("لطفاً نوع مرسوله (پاکت یا بسته) را انتخاب کنید", "error");
      return;
    }
    if (parcelType === "envelope" && !envelopeTypeId) {
      toast.show("لطفاً نوع پاکت را انتخاب کنید", "error");
      return;
    }
    if (parcelType === "package") {
      if (!weightKg || Number(weightKg) < 0.1 || Number(weightKg) > 50) {
        toast.show("وزن بسته نمی‌تواند بیشتر از ۵۰ کیلوگرم باشد", "error");
        return;
      }
      if (!lengthCm || !widthCm || !heightCm) {
        toast.show("لطفاً ابعاد بسته را کامل وارد کنید", "error");
        return;
      }
    }

    const params = new URLSearchParams({
      originProvince,
      originCity,
      destinationProvince,
      destinationCity,
      parcelType,
    });
    if (parcelType === "envelope") params.set("envelopeTypeId", envelopeTypeId);
    if (parcelType === "package") {
      params.set("weightKg", weightKg);
      params.set("lengthCm", lengthCm);
      params.set("widthCm", widthCm);
      params.set("heightCm", heightCm);
    }

    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-neutral-200 shadow-sm shadow-neutral-900/[0.04] p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <LocationPicker
          title="مبدا"
          province={originProvince}
          city={originCity}
          onChangeProvince={(v) => {
            setOriginProvince(v);
            setOriginCity("");
          }}
          onChangeCity={setOriginCity}
        />
        <LocationPicker
          title="مقصد"
          province={destinationProvince}
          city={destinationCity}
          onChangeProvince={(v) => {
            setDestinationProvince(v);
            setDestinationCity("");
          }}
          onChangeCity={setDestinationCity}
        />
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium text-neutral-700 mb-3">نوع مرسوله</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setParcelType(parcelType === "envelope" ? null : "envelope")}
            className={clsx(
              "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
              parcelType === "envelope"
                ? "border-brand-blue-400 bg-brand-blue-50"
                : "border-neutral-200 hover:border-neutral-300"
            )}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 6.5L12 13L21 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium text-neutral-700">پاکت</span>
          </button>
          <button
            type="button"
            onClick={() => setParcelType(parcelType === "package" ? null : "package")}
            className={clsx(
              "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
              parcelType === "package"
                ? "border-brand-green-400 bg-brand-green-50"
                : "border-neutral-200 hover:border-neutral-300"
            )}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M4 7.5L12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-medium text-neutral-700">بسته</span>
          </button>
        </div>

        {parcelType === "envelope" && (
          <div className="mt-4 rounded-2xl bg-neutral-50 border border-neutral-200 p-4 animate-in fade-in slide-in-from-top-1">
            <div className="text-sm text-neutral-600 mb-3">نوع پاکت را انتخاب کنید:</div>
            <div className="flex flex-wrap gap-2">
              {envelopeTypes.length === 0 && (
                <span className="text-sm text-neutral-400">فعلاً نوع پاکتی ثبت نشده است</span>
              )}
              {envelopeTypes.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setEnvelopeTypeId(et.id)}
                  className={clsx(
                    "rounded-xl border px-4 py-2 text-sm transition-colors",
                    envelopeTypeId === et.id
                      ? "border-brand-blue-400 bg-brand-blue-100 text-brand-blue-800"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                  )}
                >
                  {et.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {parcelType === "package" && (
          <div className="mt-4 rounded-2xl bg-neutral-50 border border-neutral-200 p-4 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">وزن (کیلوگرم)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={50}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
                  placeholder="مثلا 2.5"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">طول (سانتی‌متر)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lengthCm}
                  onChange={(e) => setLengthCm(e.target.value)}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">عرض (سانتی‌متر)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">ارتفاع (سانتی‌متر)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
                />
              </div>
            </div>

            {approxPrice !== null && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="rounded-full bg-brand-green-100 px-2 py-0.5 text-xs text-brand-green-700 font-medium">
                  تقریبی
                </span>
                <span className="text-neutral-600">
                  حدود <b className="text-neutral-900">{formatToman(approxPrice)}</b>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Button size="lg" onClick={handleSubmit} className="mt-6 w-full sm:w-auto">
        استعلام قیمت
      </Button>
    </div>
  );
}
