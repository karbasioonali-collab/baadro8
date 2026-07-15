import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        {Icon && <Icon className="size-5 text-brand-blue-500" strokeWidth={1.8} />}
      </div>
      <div className="mt-2 text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}
