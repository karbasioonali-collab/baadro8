import type { CurrentEmployee } from "./current-staff";

const PRIORITY: { module: Parameters<CurrentEmployee["can"]>[0]; path: string }[] = [
  { module: "dashboard", path: "/admin" },
  { module: "orders", path: "/admin/orders" },
  { module: "companies", path: "/admin/companies" },
  { module: "pricing", path: "/admin/companies" },
  { module: "commission_report", path: "/admin/commission-report" },
  { module: "users", path: "/admin/users" },
];

/** اولین صفحه‌ای که کارمند مجاز به مشاهده آن است؛ اگر ادمین کامل باشد همیشه داشبورد است */
export function getStaffLandingPath(current: CurrentEmployee): string | null {
  if (current.employee.isFullAdmin) return "/admin";
  for (const { module, path } of PRIORITY) {
    if (current.can(module, "view")) return path;
  }
  return null;
}
