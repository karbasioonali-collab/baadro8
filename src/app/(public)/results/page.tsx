import type { Metadata } from "next";
import Link from "next/link";
import { getQuotesForRequest } from "@/lib/pricing/engine";
import { ResultsList } from "@/components/results/ResultsList";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "نتایج مقایسه قیمت" };

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
};

export default async function ResultsPage({
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
    sp.parcelType;

  if (!hasRequired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-neutral-600 mb-4">
          اطلاعات مورد نیاز برای استعلام قیمت کامل نیست.
        </p>
        <Link href="/">
          <Button>بازگشت به صفحه اصلی</Button>
        </Link>
      </div>
    );
  }

  const quotes = await getQuotesForRequest({
    originProvince: sp.originProvince!,
    originCity: sp.originCity!,
    destinationProvince: sp.destinationProvince!,
    destinationCity: sp.destinationCity!,
    parcelType: sp.parcelType!,
    weightKg: sp.weightKg ? Number(sp.weightKg) : undefined,
    envelopeTypeId: sp.envelopeTypeId,
  });

  const serviceType =
    sp.originCity === sp.destinationCity ? "درون‌شهری" : "بین‌شهری";

  const orderBaseParams = new URLSearchParams({
    originProvince: sp.originProvince!,
    originCity: sp.originCity!,
    destinationProvince: sp.destinationProvince!,
    destinationCity: sp.destinationCity!,
    parcelType: sp.parcelType!,
    ...(sp.envelopeTypeId ? { envelopeTypeId: sp.envelopeTypeId } : {}),
    ...(sp.weightKg ? { weightKg: sp.weightKg } : {}),
    ...(sp.lengthCm ? { lengthCm: sp.lengthCm } : {}),
    ...(sp.widthCm ? { widthCm: sp.widthCm } : {}),
    ...(sp.heightCm ? { heightCm: sp.heightCm } : {}),
  }).toString();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">نتایج مقایسه قیمت</h1>
        <p className="mt-1 text-sm text-neutral-500">
          سرویس: {serviceType} · از {sp.originCity} به {sp.destinationCity}
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          متاسفانه در حال حاضر شرکتی برای این مسیر در دسترس نیست.
        </div>
      ) : (
        <ResultsList quotes={quotes} orderBaseParams={orderBaseParams} />
      )}
    </div>
  );
}
