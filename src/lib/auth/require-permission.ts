import "server-only";
import { redirect } from "next/navigation";
import { getCurrentEmployee, type CurrentEmployee } from "./current-staff";
import { getStaffLandingPath } from "./staff-landing";
import type { PermissionModule } from "@/generated/prisma/enums";

/**
 * برای صفحات پنل ادمین: اگر کارمند وارد نشده ریدایرکت به لاگین می‌شود؛
 * اگر مجوز مشاهده هیچ‌کدام از ماژول‌های داده‌شده را نداشته باشد، به اولین
 * صفحه‌ای که واقعاً به آن دسترسی دارد هدایت می‌شود (بدون حلقه ریدایرکت).
 */
export async function requireStaffView(
  modules: PermissionModule | PermissionModule[]
): Promise<CurrentEmployee> {
  const current = await getCurrentEmployee();
  if (!current) redirect("/admin/login");

  const moduleList = Array.isArray(modules) ? modules : [modules];
  if (moduleList.some((m) => current.can(m, "view"))) return current;

  const landing = getStaffLandingPath(current);
  redirect(landing ?? "/admin/no-access");
}
