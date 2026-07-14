"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { formatToman } from "@/lib/validation";
import type { CompanyQuote } from "@/lib/pricing/engine";

type AvailableQuote = CompanyQuote & {
  quote: Extract<CompanyQuote["quote"], { available: true }>;
};

export function ResultsList({
  quotes,
  orderBaseParams,
}: {
  quotes: CompanyQuote[];
  orderBaseParams: string;
}) {
  const [sortBy, setSortBy] = useState<"price" | "speed">("price");

  const available = quotes.filter(
    (q): q is AvailableQuote => q.quote.available
  );

  const sorted = useMemo(() => {
    const list = [...available];
    if (sortBy === "price") {
      list.sort((a, b) => a.quote.price - b.quote.price);
    } else {
      list.sort(
        (a, b) => a.quote.estimatedDeliveryDays[0] - b.quote.estimatedDeliveryDays[0]
      );
    }
    return list;
  }, [available, sortBy]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-neutral-500">مرتب‌سازی:</span>
        <button
          onClick={() => setSortBy("price")}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            sortBy === "price"
              ? "bg-brand-blue-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          ارزان‌ترین
        </button>
        <button
          onClick={() => setSortBy("speed")}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            sortBy === "speed"
              ? "bg-brand-blue-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          سریع‌ترین
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((q) => (
          <div
            key={q.companyId}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 font-bold overflow-hidden">
                {q.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.logoUrl} alt={q.companyName} className="size-full object-cover" />
                ) : (
                  q.companyName.slice(0, 2)
                )}
              </div>
              <div>
                <div className="font-semibold text-neutral-900">{q.companyName}</div>
                <div className="text-sm text-neutral-500 mt-0.5">
                  {formatToman(q.quote.price)}
                </div>
              </div>
            </div>

            <div className="text-sm text-neutral-500 sm:text-center sm:w-40">
              زمان تحویل: {q.quote.estimatedDeliveryDays[0]} تا{" "}
              {q.quote.estimatedDeliveryDays[1]} روز کاری
            </div>

            <Link
              href={`/order?${orderBaseParams}&companyId=${q.companyId}`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-green-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-green-500 transition-colors"
            >
              انتخاب
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
