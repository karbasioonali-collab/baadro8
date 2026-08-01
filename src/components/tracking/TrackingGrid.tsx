"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { trackOrderAction, type TrackResult } from "@/actions/tracking";
import { Button } from "@/components/ui/Button";

type CompanyItem = { id: string; name: string; logoUrl: string | null };

export function TrackingGrid({ companies }: { companies: CompanyItem[] }) {
  const [selected, setSelected] = useState<CompanyItem | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSelect(company: CompanyItem) {
    setSelected(company);
    setResult(null);
    setCode("");
  }

  function handleSubmit() {
    if (!selected || !code.trim()) return;
    startTransition(async () => {
      const res = await trackOrderAction(selected.id, code.trim());
      setResult(res);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {companies.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c)}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors",
              selected?.id === c.id
                ? "border-brand-blue-400 bg-brand-blue-50"
                : "border-brand-green-300 bg-white hover:border-brand-green-400"
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-neutral-100 font-bold text-neutral-500 overflow-hidden">
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logoUrl} alt={c.name} className="size-full object-cover" />
              ) : (
                c.name.slice(0, 2)
              )}
            </div>
            <span className="text-xs text-center text-neutral-600 line-clamp-1">
              {c.name}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 animate-in fade-in slide-in-from-top-1">
          <div className="text-sm text-neutral-600 mb-3">
            کد رهگیری مرسوله خود نزد <b>{selected.name}</b> را وارد کنید:
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="کد رهگیری"
              dir="ltr"
              className="h-11 flex-1 rounded-xl border border-brand-green-300 bg-white px-3.5 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
            />
            <Button onClick={handleSubmit} loading={pending}>
              پیگیری
            </Button>
          </div>

          {result && <TrackingResultView result={result} />}
        </div>
      )}
    </div>
  );
}

function TrackingResultView({ result }: { result: TrackResult }) {
  if (result.kind === "not_found") {
    return (
      <div className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
        مرسوله‌ای با این کد رهگیری یافت نشد.
      </div>
    );
  }

  if (result.kind === "not_implemented") {
    return (
      <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
        استعلام مستقیم برای این شرکت هنوز در بادرو فعال نشده است. به‌زودی این
        بخش تکمیل می‌شود.
      </div>
    );
  }

  if (result.kind === "external_link") {
    return (
      <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
        برای این شرکت، پیگیری از طریق سامانه خودشان انجام می‌شود:{" "}
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue-600 underline"
        >
          مشاهده وضعیت مرسوله
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-brand-blue-50 p-4">
      <div className="text-sm text-neutral-600">
        وضعیت فعلی: <b className="text-brand-blue-800">{result.currentStatusLabel}</b>
      </div>
      <ol className="mt-3 flex flex-col gap-2">
        {result.history.map((h, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="size-2 rounded-full bg-brand-blue-500" />
            {h.statusLabel}
            <span className="text-xs text-neutral-400" dir="ltr">
              {new Date(h.changedAt).toLocaleString("fa-IR")}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
