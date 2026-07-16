import { redirect } from "next/navigation";
import { Package, Wallet } from "lucide-react";
import { getCompanySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PanelShell } from "@/components/panel/PanelShell";
import { logoutCompanyAction } from "@/actions/auth";

const navItems = [
  {
    href: "/company",
    label: "سفارش‌های ارجاعی",
    icon: <Package className="size-[18px] shrink-0" strokeWidth={1.8} />,
  },
  {
    href: "/company/reports",
    label: "گزارشات مالی",
    icon: <Wallet className="size-[18px] shrink-0" strokeWidth={1.8} />,
  },
];

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCompanySession();
  if (!session) redirect("/company/login");

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { name: true },
  });

  return (
    <PanelShell
      navItems={navItems}
      title={`پنل شرکت — ${company?.name ?? ""}`}
      logoutAction={logoutCompanyAction}
    >
      {children}
    </PanelShell>
  );
}
