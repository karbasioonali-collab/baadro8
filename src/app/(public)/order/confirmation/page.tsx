import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatToman } from "@/lib/validation";

export const metadata: Metadata = { title: "تایید سفارش" };

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ codes?: string }>;
}) {
  const { codes } = await searchParams;
  const trackingCodes = (codes ?? "").split(",").filter(Boolean);

  const orders = await prisma.order.findMany({
    where: { trackingCode: { in: trackingCodes } },
    include: { company: { select: { name: true } } },
  });

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-neutral-600 mb-4">سفارشی یافت نشد.</p>
        <Link href="/">
          <Button>بازگشت به صفحه اصلی</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-green-100 text-3xl text-brand-green-600">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          سفارش شما با موفقیت ثبت شد
        </h1>
        <p className="mt-2 text-neutral-500">
          می‌توانید با کد رهگیری هر مرسوله، وضعیت آن را پیگیری کنید.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-500">
                شرکت: {o.company.name}
              </div>
              <div className="mt-1 font-mono text-lg font-bold text-brand-blue-700" dir="ltr">
                {o.trackingCode}
              </div>
            </div>
            <div className="text-neutral-700 font-medium">
              {formatToman(Number(o.calculatedPrice))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/panel/orders">
          <Button variant="outline" className="w-full sm:w-auto">
            مشاهده سفارش‌ها در پنل کاربری
          </Button>
        </Link>
        <Link href="/">
          <Button className="w-full sm:w-auto">بازگشت به صفحه اصلی</Button>
        </Link>
      </div>
    </div>
  );
}
