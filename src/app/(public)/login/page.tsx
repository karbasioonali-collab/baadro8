import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/session";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "ورود / ثبت‌نام" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  const session = await getCustomerSession();
  if (session) redirect(redirectTo || "/panel");

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="flex justify-center mb-6">
        <Logo />
      </div>
      <Card className="p-6">
        <h1 className="text-lg font-bold text-neutral-900 mb-1 text-center">
          ورود به بادرو
        </h1>
        <p className="text-sm text-neutral-500 mb-6 text-center">
          با شماره موبایل خود وارد شوید
        </p>
        <CustomerLoginForm redirectTo={redirectTo || "/panel"} />
      </Card>
    </div>
  );
}
