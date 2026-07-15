import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";
import { CustomerLoginForm } from "@/components/auth/CustomerLoginForm";
import { OrderForm } from "@/components/order/OrderForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "ثبت سفارش" };

type SearchParams = {
  originProvince?: string;
  originCity?: string;
  destinationProvince?: string;
  destinationCity?: string;
  parcelType?: "envelope" | "package";
  envelopeTypeId?: string;
  weightKg?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  declaredValue?: string;
  companyId?: string;
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const hasRequired =
    sp.originProvince &&
    sp.originCity &&
    sp.destinationProvince &&
    sp.destinationCity &&
    sp.parcelType &&
    sp.companyId;

  if (!hasRequired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-neutral-600 mb-4">اطلاعات سفارش کامل نیست.</p>
        <Link href="/">
          <Button>بازگشت به صفحه اصلی</Button>
        </Link>
      </div>
    );
  }

  const [session, company, envelopeTypes] = await Promise.all([
    getCustomerSession(),
    prisma.company.findUnique({ where: { id: sp.companyId! } }),
    prisma.envelopeType.findMany({ where: { active: true }, orderBy: { orderIndex: "asc" } }),
  ]);

  if (!company) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-neutral-600 mb-4">شرکت انتخاب‌شده یافت نشد.</p>
        <Link href="/">
          <Button>بازگشت به صفحه اصلی</Button>
        </Link>
      </div>
    );
  }

  if (!session) {
    const currentUrl = `/order?${new URLSearchParams(
      sp as Record<string, string>
    ).toString()}`;
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <Card className="p-6">
          <h1 className="text-lg font-bold text-neutral-900 mb-1 text-center">
            ورود برای ثبت سفارش
          </h1>
          <p className="text-sm text-neutral-500 mb-6 text-center">
            برای ادامه ثبت سفارش، ابتدا با شماره موبایل خود وارد شوید
          </p>
          <CustomerLoginForm redirectTo={currentUrl} />
        </Card>
      </div>
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">ثبت سفارش</h1>
      <OrderForm
        companyId={company.id}
        companyName={company.name}
        serviceType={company.type}
        originProvince={sp.originProvince!}
        originCity={sp.originCity!}
        initial={{
          destinationProvince: sp.destinationProvince!,
          destinationCity: sp.destinationCity!,
          parcelType: sp.parcelType!,
          envelopeTypeId: sp.envelopeTypeId ?? "",
          weightKg: sp.weightKg ?? "",
          lengthCm: sp.lengthCm ?? "",
          widthCm: sp.widthCm ?? "",
          heightCm: sp.heightCm ?? "",
          declaredValue: sp.declaredValue ?? "",
        }}
        envelopeTypes={envelopeTypes.map((e) => ({ id: e.id, name: e.name }))}
        userMobile={user?.mobile ?? session.mobile}
      />
    </div>
  );
}
