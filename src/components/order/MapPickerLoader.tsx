"use client";

import dynamic from "next/dynamic";

export const MapPicker = dynamic(
  () => import("./MapPicker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
        در حال بارگذاری نقشه...
      </div>
    ),
  }
);
