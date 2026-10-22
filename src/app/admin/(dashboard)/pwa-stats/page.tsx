import { requireStaffView } from "@/lib/auth/require-permission";
import { PwaStatsPanel } from "@/components/admin/PwaStatsPanel";

export default async function PwaStatsPage() {
  await requireStaffView("commission_report");

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-neutral-900">آمار نصب اپلیکیشن</h1>
      <PwaStatsPanel />
    </div>
  );
}
