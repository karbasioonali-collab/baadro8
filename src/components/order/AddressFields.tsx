"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { IRAN_PROVINCES, getCitiesOfProvince } from "@/lib/iran-locations";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MapPicker } from "./MapPickerLoader";

export type AddressFormValue = {
  province: string;
  city: string;
  street: string;
  alley: string;
  plaque: string;
  floor: string;
  description: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
};

export function emptyAddress(province = "", city = ""): AddressFormValue {
  return {
    province,
    city,
    street: "",
    alley: "",
    plaque: "",
    floor: "",
    description: "",
    postalCode: "",
    lat: null,
    lng: null,
  };
}

const ENGLISH_LETTERS_RE = /[A-Za-z]/;
const PERSIAN_ONLY_ERROR = "لطفا فارسی تایپ کنید";

/** پیام خطای زیر همان فیلد وقتی حاوی حرف انگلیسی باشد؛ تایپ خودش مسدود نمی‌شود. */
function persianError(text: string): string | undefined {
  return ENGLISH_LETTERS_RE.test(text) ? PERSIAN_ONLY_ERROR : undefined;
}

/** برای مسدود کردن رفتن به مرحله بعد/ثبت نهایی تا وقتی حرف انگلیسی در آدرس باقی مانده. */
export function addressHasEnglishLetters(address: AddressFormValue): boolean {
  return [address.street, address.alley, address.plaque, address.floor, address.description].some(
    (v) => ENGLISH_LETTERS_RE.test(v)
  );
}

const provinceNames = IRAN_PROVINCES.map((p) => p.name);

export function AddressFields({
  value,
  onChange,
  showMap = false,
  mapRequired = false,
  hideLocationSelect = false,
  requireAlley = false,
}: {
  value: AddressFormValue;
  onChange: (v: AddressFormValue) => void;
  showMap?: boolean;
  mapRequired?: boolean;
  /** وقتی استان/شهر از قبل در مرحله دیگری انتخاب شده و نباید دوباره پرسیده شود */
  hideLocationSelect?: boolean;
  /** کوچه را اجباری نمایش بده (پیش‌فرض اختیاری است) */
  requireAlley?: boolean;
}) {
  const cities = useMemo(() => getCitiesOfProvince(value.province), [value.province]);

  function set<K extends keyof AddressFormValue>(key: K, v: AddressFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-blue-300 p-3.5 sm:p-4">
      {!hideLocationSelect && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="استان"
            value={value.province}
            onChange={(e) => onChange({ ...value, province: e.target.value, city: "" })}
          >
            <option value="">انتخاب استان</option>
            {provinceNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            label="شهر"
            value={value.city}
            disabled={!value.province}
            onChange={(e) => set("city", e.target.value)}
          >
            <option value="">انتخاب شهر</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Input
        label="خیابان"
        value={value.street}
        onChange={(e) => set("street", e.target.value)}
        placeholder="نام خیابان اصلی"
        error={persianError(value.street)}
      />
      <Input
        label={requireAlley ? "کوچه" : "کوچه (اختیاری)"}
        value={value.alley}
        onChange={(e) => set("alley", e.target.value)}
        error={persianError(value.alley)}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="پلاک"
          value={value.plaque}
          onChange={(e) => set("plaque", e.target.value)}
          error={persianError(value.plaque)}
        />
        <Input
          label="طبقه (اختیاری)"
          value={value.floor}
          onChange={(e) => set("floor", e.target.value)}
          error={persianError(value.floor)}
        />
        <Input
          label="کد پستی (اختیاری)"
          value={value.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          dir="ltr"
          inputMode="numeric"
          placeholder="۱۰ رقمی"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">
          توضیحات آدرس (اختیاری)
        </label>
        <textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={200}
          rows={2}
          className={clsx(
            "rounded-xl border bg-white p-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100",
            persianError(value.description) ? "border-danger" : "border-brand-green-300"
          )}
        />
        {persianError(value.description) && (
          <span className="text-xs text-danger">{persianError(value.description)}</span>
        )}
      </div>

      {showMap && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">
            موقعیت روی نقشه
          </label>
          <MapPicker
            lat={value.lat}
            lng={value.lng}
            onChange={(lat, lng) => onChange({ ...value, lat, lng })}
          />
          {mapRequired && value.lat == null && (
            <span className="text-xs text-warning">
              برای دقت بیشتر تحویل، لطفاً موقعیت را روی نقشه مشخص کنید
            </span>
          )}
        </div>
      )}
    </div>
  );
}
