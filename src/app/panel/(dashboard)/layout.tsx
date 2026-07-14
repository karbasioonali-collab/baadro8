import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/session";
import { PanelShell } from "@/components/panel/PanelShell";
import { logoutCustomerAction } from "@/actions/auth";

const navItems = [
  { href: "/panel", label: "نمای کلی", icon: "📊" },
  { href: "/panel/orders", label: "سفارش‌های من", icon: "📦" },
  { href: "/panel/payments", label: "پرداختی‌ها", icon: "💳" },
  { href: "/panel/profile", label: "پروفایل", icon: "👤" },
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
