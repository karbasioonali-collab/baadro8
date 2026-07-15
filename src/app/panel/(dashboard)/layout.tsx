import { redirect } from "next/navigation";
import { LayoutDashboard, Package, CreditCard, User } from "lucide-react";
import { getCustomerSession } from "@/lib/auth/session";
import { PanelShell } from "@/components/panel/PanelShell";
import { logoutCustomerAction } from "@/actions/auth";

const iconProps = { className: "size-[18px] shrink-0", strokeWidth: 1.8 };
const navItems = [
  { href: "/panel", label: "نمای کلی", icon: <LayoutDashboard {...iconProps} /> },
  { href: "/panel/orders", label: "سفارش‌های من", icon: <Package {...iconProps} /> },
  { href: "/panel/payments", label: "پرداختی‌ها", icon: <CreditCard {...iconProps} /> },
  { href: "/panel/profile", label: "پروفایل", icon: <User {...iconProps} /> },
];

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/panel/login");

  return (
    <PanelShell navItems={navItems} title="پنل کاربری" logoutAction={logoutCustomerAction}>
      {children}
    </PanelShell>
  );
}
