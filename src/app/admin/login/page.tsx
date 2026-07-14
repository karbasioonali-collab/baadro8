import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth/session";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "ورود ادمین" };

export default async function AdminLoginPage() {
  const session = await getStaffSession();
  if (session) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card className="p-6">
          <h1 className="text-lg font-bold text-neutral-900 mb-1 text-center">
            ورود پنل ادمین
          </h1>
          <p className="text-sm text-neutral-500 mb-6 text-center">
            ویژه ادمین و کارمندان بادرو
          </p>
          <StaffLoginForm />
        </Card>
      </div>
    </div>
  );
}
