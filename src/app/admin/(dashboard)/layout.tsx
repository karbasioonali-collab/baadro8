import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { PanelShell, type PanelNavItem } from "@/components/panel/PanelShell";
import { logoutStaffAction } from "@/actions/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentEmployee();
  if (!current) redirect("/admin/login");

  const { employee, can } = current;

  const navItems: PanelNavItem[] = [];
  if (can("dashboard")) navItems.push({ href: "/admin", label: "داشبورد", icon: "📊" });
  if (can("companies") || can("pricing"))
    navItems.push({ href: "/admin/companies", label: "شرکت‌ها و فرمول قیمت", icon: "🏢" });
  if (can("orders")) navItems.push({ href: "/admin/orders", label: "سفارش‌ها", icon: "📦" });
  if (can("commission_report"))
    navItems.push({ href: "/admin/commission-report", label: "گزارش کمیسیون", icon: "💰" });
  if (can("users")) navItems.push({ href: "/admin/users", label: "کاربران", icon: "👥" });
  if (employee.isFullAdmin) {
    navItems.push({ href: "/admin/employees", label: "کارمندان", icon: "🧑‍💼" });
    navItems.push({ href: "/admin/content", label: "محتوای صفحه اصلی", icon: "🖼" });
  }

  return (
    <PanelShell
      navItems={navItems}
      title={`پنل ادمین — ${employee.name}`}
      logoutAction={logoutStaffAction}
    >
      {children}
    </PanelShell>
  );
}
