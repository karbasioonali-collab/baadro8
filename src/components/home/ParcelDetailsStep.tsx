"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { getApproximatePriceAction } from "@/actions/quote";
import { formatToman } from "@/lib/validation";

export type ParcelDetailsValue = {
  parcelType: "envelope" | "package";
  envelopeTypeId: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
};

export function emptyParcelDetails(): ParcelDetailsValue {
  return {
    parcelType: "package",
    envelopeTypeId: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
  };
}

export function ParcelDetailsStep({
  value,
  onChange,
  envelopeTypes,
  originProvince,
  originCity,
  destinationProvince,
  destinationCity,
}: {
  value: ParcelDetailsValue;
  onChange: (v: ParcelDetailsValue) => void;
  envelopeTypes: { id: string; name: string }[];
  originProvince: string;
  originCity: string;
  destinationProvince: string;
  destinationCity: string;
}) {
  const [, startTransition] = useTransition();
  const [approxPrice, setApproxPrice] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set<K extends keyof ParcelDetailsValue>(key: K, v: ParcelDetailsValue[K]) {
    onChange({ ...value, [key]: v });
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (
      value.parcelType !== "package" ||
      !originCity ||
      !destinationCity ||
      !value.weightKg ||
      Number(value.weightKg) <= 0
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
          weightKg: Number(value.weightKg),
        });
        setApproxPrice(price);
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.parcelType, value.weightKg, originCity, destinationCity, originProvince, destinationProvince]);

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => set("parcelType", "envelope")}
          className={clsx(
            "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
            value.parcelType === "envelope"
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
          onClick={() => set("parcelType", "package")}
          className={clsx(
            "flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
            value.parcelType === "package"
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

      {value.parcelType === "envelope" && (
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
                onClick={() => set("envelopeTypeId", et.id)}
                className={clsx(
                  "rounded-xl border px-4 py-2 text-sm transition-colors",
                  value.envelopeTypeId === et.id
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

      {value.parcelType === "package" && (
        <div className="mt-4 rounded-2xl bg-neutral-50 border border-neutral-200 p-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">وزن (کیلوگرم)</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                max={50}
                value={value.weightKg}
                onChange={(e) => set("weightKg", e.target.value)}
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
                value={value.lengthCm}
                onChange={(e) => set("lengthCm", e.target.value)}
                className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">عرض (سانتی‌متر)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={value.widthCm}
                onChange={(e) => set("widthCm", e.target.value)}
                className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">ارتفاع (سانتی‌متر)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={value.heightCm}
                onChange={(e) => set("heightCm", e.target.value)}
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
  );
}
