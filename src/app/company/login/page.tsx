import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCompanySession } from "@/lib/auth/session";
import { CompanyLoginForm } from "@/components/auth/CompanyLoginForm";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "ورود شرکت‌های طرف قرارداد" };

export default async function CompanyLoginPage() {
  const session = await getCompanySession();
  if (session) redirect("/company");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card className="p-6">
          <h1 className="text-lg font-bold text-neutral-900 mb-1 text-center">
            ورود پنل شرکت
          </h1>
          <p className="text-sm text-neutral-500 mb-6 text-center">
            با نام کاربری و رمز عبوری که ادمین بادرو برای شما ایجاد کرده وارد شوید
          </p>
          <CompanyLoginForm />
        </Card>
      </div>
    </div>
  );
}
