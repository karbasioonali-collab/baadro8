import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Wallet,
  Users,
  Briefcase,
  Image as ImageIcon,
} from "lucide-react";
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

  const iconProps = { className: "size-[18px] shrink-0", strokeWidth: 1.8 };
  const navItems: PanelNavItem[] = [];
  if (can("dashboard"))
    navItems.push({ href: "/admin", label: "داشبورد", icon: <LayoutDashboard {...iconProps} /> });
  if (can("companies") || can("pricing"))
    navItems.push({
      href: "/admin/companies",
      label: "شرکت‌ها و فرمول قیمت",
      icon: <Building2 {...iconProps} />,
    });
  if (can("orders"))
    navItems.push({ href: "/admin/orders", label: "سفارش‌ها", icon: <Package {...iconProps} /> });
  if (can("commission_report"))
    navItems.push({
      href: "/admin/commission-report",
      label: "گزارش کمیسیون",
      icon: <Wallet {...iconProps} />,
    });
  if (can("users"))
    navItems.push({ href: "/admin/users", label: "کاربران", icon: <Users {...iconProps} /> });
  if (employee.isFullAdmin) {
    navItems.push({ href: "/admin/employees", label: "کارمندان", icon: <Briefcase {...iconProps} /> });
    navItems.push({
      href: "/admin/content",
      label: "محتوای صفحه اصلی",
      icon: <ImageIcon {...iconProps} />,
    });
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
