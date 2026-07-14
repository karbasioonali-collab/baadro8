"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { toggleEmployeeActiveAction } from "@/actions/admin/employees";
import { useToast } from "@/components/ui/Toast";

export function EmployeeActiveToggle({ employeeId, active }: { employeeId: string; active: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleEmployeeActiveAction(employeeId);
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
