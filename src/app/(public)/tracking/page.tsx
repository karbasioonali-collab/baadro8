import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TrackingGrid } from "@/components/tracking/TrackingGrid";

export const metadata: Metadata = { title: "پیگیری مرسوله" };

export default async function TrackingPage() {
  const companies = await prisma.company.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, logoUrl: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          پیگیری مرسوله
        </h1>
        <p className="mt-2 text-neutral-500 text-sm sm:text-base">
          شرکتی که بسته خود را به آن سپرده‌اید انتخاب کنید و کد رهگیری را وارد
          نمایید.
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          هنوز شرکتی ثبت نشده است.
        </div>
      ) : (
        <TrackingGrid companies={companies} />
      )}
    </div>
  );
}
