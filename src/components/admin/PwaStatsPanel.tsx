"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Download } from "lucide-react";
import { StatTile } from "@/components/panel/StatTile";
import { PwaInstallChart } from "@/components/admin/PwaInstallChart";
import { MAX_DAILY_RANGE_DAYS, MAX_MONTHLY_RANGE_MONTHS } from "@/lib/pwa-stats";

type Mode = "daily" | "monthly";

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** بازه‌ی پیش‌فرض هر حالت — همیشه داخل محدودیت مجاز همان حالت است. */
function defaultRangeFor(mode: Mode): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (mode === "daily") {
    start.setDate(start.getDate() - 13); // ۱۴ روز اخیر
  } else {
    start.setMonth(start.getMonth() - 5); // ۶ ماه اخیر
    start.setDate(1);
  }
  return { startDate: toDateInputValue(start), endDate: toDateInputValue(end) };
}

export function PwaStatsPanel() {
  const [mode, setMode] = useState<Mode>("daily");
  const [range, setRange] = useState(() => defaultRangeFor("daily"));
  const [totalInstalls, setTotalInstalls] = useState<number | null>(null);
  const [buckets, setBuckets] = useState<{ label: string; count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function changeMode(next: Mode) {
    setMode(next);
    setRange(defaultRangeFor(next));
  }

  useEffect(() => {
    const controller = new AbortController();
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const params = new URLSearchParams({ mode, startDate: range.startDate, endDate: range.endDate });
    fetch(`/api/admin/pwa-stats?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "خطا در دریافت آمار");
        setTotalInstalls(data.totalInstalls);
        setBuckets(data.buckets);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "خطا در دریافت آمار");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [mode, range.startDate, range.endDate]);

  const maxRangeLabel =
    mode === "daily" ? `حداکثر ${MAX_DAILY_RANGE_DAYS} روز` : `حداکثر ${MAX_MONTHLY_RANGE_MONTHS} ماه`;

  return (
    <div className="flex flex-col gap-6">
      <StatTile
        label="تعداد کل نصب‌ها (از ابتدا تا الان)"
        value={totalInstalls == null ? "…" : totalInstalls.toLocaleString("fa-IR")}
        icon={Download}
      />

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">نمایش:</span>
            <button
              type="button"
              onClick={() => changeMode("daily")}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "daily"
                  ? "bg-brand-blue-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              روزانه
            </button>
            <button
              type="button"
              onClick={() => changeMode("monthly")}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "monthly"
                  ? "bg-brand-blue-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              ماهانه
            </button>
          </div>

          <div className="flex items-center gap-2" dir="ltr">
            <input
              type="date"
              value={range.startDate}
              max={range.endDate}
              onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
              className="h-9 rounded-lg border border-neutral-200 px-2 text-sm"
            />
            <span className="text-sm text-neutral-400">تا</span>
            <input
              type="date"
              value={range.endDate}
              min={range.startDate}
              onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
              className="h-9 rounded-lg border border-neutral-200 px-2 text-sm"
            />
          </div>

          <span className="text-xs text-neutral-400">({maxRangeLabel})</span>
        </div>

        {error ? (
          <div className="flex h-64 items-center justify-center text-sm text-danger">{error}</div>
        ) : (
          <PwaInstallChart data={loading ? [] : buckets} />
        )}
      </div>
    </div>
  );
}
