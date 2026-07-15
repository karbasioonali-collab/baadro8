import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "قوانین و مقررات" };

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">قوانین و مقررات</h1>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <FileText className="size-10 text-brand-blue-500" strokeWidth={1.6} />
        <p className="text-neutral-500 leading-7">
          متن قوانین و مقررات استفاده از بادرو به‌زودی در این صفحه منتشر می‌شود.
        </p>
      </div>
    </div>
  );
}
