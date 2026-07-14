"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { toggleCompanyActiveAction } from "@/actions/admin/companies";
import { useToast } from "@/components/ui/Toast";

export function CompanyActiveToggle({
  companyId,
  active,
}: {
  companyId: string;
  active: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleCompanyActiveAction(companyId);
      if (!result.ok) {
        toast.show(result.error ?? "خطا", "error");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-brand-green-100 text-brand-green-700" : "bg-neutral-100 text-neutral-500"
      )}
    >
      {active ? "فعال" : "غیرفعال"}
    </button>
  );
}
