"use client";

import { AddressFields, type AddressFormValue } from "./AddressFields";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export type ParcelFormValue = {
  key: string;
  destination: AddressFormValue;
  parcelType: "envelope" | "package";
  envelopeTypeId: string;
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  itemNote: string;
};

export function ParcelRow({
  index,
  value,
  envelopeTypes,
  needsWeight = true,
  destinationMapRequired = false,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  value: ParcelFormValue;
  envelopeTypes: { id: string; name: string }[];
  /** پیک موتوری (intracity) وزن/ابعاد نمی‌گیرد */
  needsWeight?: boolean;
  /** پیک موتوری: انتخاب موقعیت گیرنده روی نقشه اجباری است؛ ارسال پستی: اختیاری */
  destinationMapRequired?: boolean;
  onChange: (v: ParcelFormValue) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800">مرسوله {index + 1}</h3>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-danger hover:underline"
          >
            حذف
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-neutral-700 mb-2">آدرس گیرنده</div>
        <AddressFields
          value={value.destination}
          onChange={(destination) => onChange({ ...value, destination })}
          showMap
          mapRequired={destinationMapRequired}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="نوع مرسوله"
          value={value.parcelType}
          onChange={(e) =>
            onChange({ ...value, parcelType: e.target.value as "envelope" | "package" })
          }
        >
          <option value="package">بسته</option>
          <option value="envelope">پاکت</option>
        </Select>

        {value.parcelType === "envelope" ? (
          <Select
            label="نوع پاکت"
            value={value.envelopeTypeId}
            onChange={(e) => onChange({ ...value, envelopeTypeId: e.target.value })}
          >
            <option value="">انتخاب کنید</option>
            {envelopeTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </Select>
        ) : needsWeight ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">وزن (گرم)</label>
            <input
              type="number"
              step="10"
              min={100}
              max={50000}
              value={value.weightGrams}
              onChange={(e) => onChange({ ...value, weightGrams: e.target.value })}
              className="h-11 rounded-xl border border-brand-green-300 bg-white px-3.5 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
            />
          </div>
        ) : (
          <Input
            label="ارزش مرسوله (تومان، اختیاری)"
            type="number"
            min={0}
            inputMode="numeric"
            value={value.declaredValue}
            onChange={(e) => onChange({ ...value, declaredValue: e.target.value })}
          />
        )}
      </div>

      {value.parcelType === "package" && needsWeight && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {(["lengthCm", "widthCm", "heightCm"] as const).map((k, i) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                {["طول", "عرض", "ارتفاع"][i]} (سانتی‌متر)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={value[k]}
                onChange={(e) => onChange({ ...value, [k]: e.target.value })}
                className="h-11 rounded-xl border border-brand-green-300 bg-white px-3.5 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
              />
            </div>
          ))}
        </div>
      )}

      {(value.parcelType === "envelope" || needsWeight) && (
        <div className="mt-3">
          <Input
            label="ارزش مرسوله (تومان، اختیاری)"
            type="number"
            min={0}
            inputMode="numeric"
            value={value.declaredValue}
            onChange={(e) => onChange({ ...value, declaredValue: e.target.value })}
          />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">توضیحات بسته (اختیاری)</label>
        <textarea
          value={value.itemNote}
          onChange={(e) => onChange({ ...value, itemNote: e.target.value })}
          maxLength={200}
          rows={2}
          className="rounded-xl border border-brand-green-300 bg-white p-3 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
        />
      </div>
    </div>
  );
}
