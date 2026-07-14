"use client";

import { useMemo } from "react";
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

const provinceNames = IRAN_PROVINCES.map((p) => p.name);

export function AddressFields({
  value,
  onChange,
  showMap = false,
  mapRequired = false,
  hideLocationSelect = false,
}: {
  value: AddressFormValue;
  onChange: (v: AddressFormValue) => void;
  showMap?: boolean;
  mapRequired?: boolean;
  /** وقتی استان/شهر از قبل در مرحله دیگری انتخاب شده و نباید دوباره پرسیده شود */
  hideLocationSelect?: boolean;
}) {
  const cities = useMemo(() => getCitiesOfProvince(value.province), [value.province]);

  function set<K extends keyof AddressFormValue>(key: K, v: AddressFormValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-3">
      {!hideLocationSelect && (
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="استان"
            value={value.province}
            onChange={(e) => {
              set("province", e.target.value);
              set("city", "");
            }}
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
      />
      <Input
        label="کوچه (اختیاری)"
        value={value.alley}
        onChange={(e) => set("alley", e.target.value)}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="پلاک"
          value={value.plaque}
          onChange={(e) => set("plaque", e.target.value)}
        />
        <Input
          label="طبقه (اختیاری)"
          value={value.floor}
          onChange={(e) => set("floor", e.target.value)}
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
          className="rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
        />
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
