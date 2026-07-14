"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { companyLoginAction, type CompanyLoginState } from "@/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const initial: CompanyLoginState = { ok: false };

export function CompanyLoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(companyLoginAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.push("/company");
      router.refresh();
    } else if (state.error) {
      toast.show(state.error, "error");
    }
  }, [state, router, toast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input name="username" label="نام کاربری" required dir="ltr" />
      <Input name="password" type="password" label="رمز عبور" required dir="ltr" />
      <Button type="submit" loading={pending} className="w-full">
        ورود
      </Button>
    </form>
  );
}
