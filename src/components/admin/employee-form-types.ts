import type { PermissionModule } from "@/generated/prisma/enums";

export const EMPLOYEE_MODULES: { value: PermissionModule; label: string }[] = [
  { value: "dashboard", label: "داشبورد" },
  { value: "companies", label: "شرکت‌ها" },
  { value: "pricing", label: "فرمول قیمت" },
  { value: "orders", label: "سفارش‌ها" },
  { value: "commission_report", label: "گزارش کمیسیون" },
  { value: "users", label: "کاربران" },
  // مدیریت کارمندان همیشه مخصوص «ادمین کامل» است و در این جدول قابل واگذاری نیست
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

/** تابع ساده (بدون "use client") تا صفحات سرور هم بتوانند آن را فراخوانی کنند */
export function emptyEmployeeForm(): EmployeeFormValue {
  return {
    name: "",
    mobile: "",
    username: "",
    password: "",
    isFullAdmin: false,
    active: true,
    permissions: Object.fromEntries(
      EMPLOYEE_MODULES.map((m) => [m.value, { canView: false, canEdit: false }])
    ),
  };
}
