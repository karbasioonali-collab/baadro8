"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveEmployeeAction, type EmployeeFormInput } from "@/actions/admin/employees";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const MODULES: { value: EmployeeFormInput["permissions"][number]["module"]; label: string }[] = [
  { value: "dashboard", label: "داشبورد" },
  { value: "companies", label: "شرکت‌ها" },
  { value: "pricing", label: "فرمول قیمت" },
  { value: "orders", label: "سفارش‌ها" },
  { value: "commission_report", label: "گزارش کمیسیون" },
  { value: "users", label: "کاربران" },
  { value: "employees", label: "کارمندان" },
];

export type EmployeeFormValue = {
  id?: string;
  name: string;
  mobile: string;
  username: string;
  password: string;
  isFullAdmin: boolean;
  active: boolean;
  permissions: Record<string, { canView: boolean; canEdit: boolean }>;
};

export function emptyEmployeeForm(): EmployeeFormValue {
  return {
    name: "",
    mobile: "",
    username: "",
    password: "",
    isFullAdmin: false,
    active: true,
    permissions: Object.fromEntries(
      MODULES.map((m) => [m.value, { canView: false, canEdit: false }])
    ),
  };
}

export function EmployeeForm({ initial }: { initial: EmployeeFormValue }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<EmployeeFormValue>(initial);

  function set<K extends keyof EmployeeFormValue>(key: K, v: EmployeeFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }));
  }

  function togglePermission(moduleKey: string, field: "canView" | "canEdit") {
    setValue((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [field]: !prev.permissions[moduleKey][field],
          ...(field === "canEdit" && !prev.permissions[moduleKey].canEdit
            ? { canView: true }
            : {}),
        },
      },
    }));
  }

  function handleSubmit() {
    if (value.name.trim().length < 3) {
      toast.show("نام باید حداقل ۳ حرف باشد", "error");
      return;
    }
    if (!value.id && value.password.length < 4) {
      toast.show("رمز عبور باید حداقل ۴ کاراکتر باشد", "error");
      return;
    }

    const input: EmployeeFormInput = {
      id: value.id,
      name: value.name,
      mobile: value.mobile,
      username: value.username,
      password: value.password || undefined,
      isFullAdmin: value.isFullAdmin,
      active: value.active,
      permissions: MODULES.map((m) => ({
        module: m.value,
        canView: value.permissions[m.value]?.canView ?? false,
        canEdit: value.permissions[m.value]?.canEdit ?? false,
      })),
    };

    startTransition(async () => {
      const result = await saveEmployeeAction(input);
      if (!result.ok) {
        toast.show(result.error ?? "خطا در ذخیره‌سازی", "error");
        return;
      }
      toast.show("کارمند با موفقیت ذخیره شد", "success");
      router.push("/admin/employees");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">اطلاعات کارمند</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام و نام‌خانوادگی" value={value.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="شماره موبایل" value={value.mobile} onChange={(e) => set("mobile", e.target.value)} dir="ltr" />
          <Input label="نام کاربری" value={value.username} onChange={(e) => set("username", e.target.value)} dir="ltr" />
          <Input
            label={value.id ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
            type="password"
            value={value.password}
            onChange={(e) => set("password", e.target.value)}
            dir="ltr"
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={value.isFullAdmin}
            onChange={(e) => set("isFullAdmin", e.target.checked)}
          />
          ادمین کامل (دسترسی به همه بخش‌ها + مدیریت کارمندان)
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={value.active} onChange={(e) => set("active", e.target.checked)} />
          حساب فعال
        </label>
      </div>

      {!value.isFullAdmin && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-800 mb-4">سطح دسترسی به هر بخش</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="p-2 text-right font-medium">بخش</th>
                  <th className="p-2 text-center font-medium">مشاهده</th>
                  <th className="p-2 text-center font-medium">ویرایش</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.value} className="border-b border-neutral-100 last:border-0">
                    <td className="p-2 text-neutral-700">{m.label}</td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={value.permissions[m.value]?.canView ?? false}
                        onChange={() => togglePermission(m.value, "canView")}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={value.permissions[m.value]?.canEdit ?? false}
                        onChange={() => togglePermission(m.value, "canEdit")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Button size="lg" loading={pending} onClick={handleSubmit} className="w-full sm:w-auto">
        ذخیره کارمند
      </Button>
    </div>
  );
}
