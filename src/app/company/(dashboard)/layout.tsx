import { redirect } from "next/navigation";
import { getCompanySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PanelShell } from "@/components/panel/PanelShell";
import { logoutCompanyAction } from "@/actions/auth";

const navItems = [{ href: "/company", label: "سفارش‌های ارجاعی", icon: "📦" }];

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
