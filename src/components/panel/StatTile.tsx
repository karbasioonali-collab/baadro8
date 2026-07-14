export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}
