"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  changeCompanyPasswordAction,
  type ChangeCompanyPasswordState,
} from "@/actions/company-profile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const initial: ChangeCompanyPasswordState = { ok: false };

export function ChangePasswordForm() {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(changeCompanyPasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.show("رمز عبور با موفقیت تغییر کرد", "success");
      formRef.current?.reset();
    } else if (state.error) {
      toast.show(state.error, "error");
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 max-w-sm">
      <Input name="currentPassword" type="password" label="رمز عبور فعلی" required dir="ltr" />
      <Input name="newPassword" type="password" label="رمز عبور جدید" required dir="ltr" />
      <Input
        name="confirmPassword"
        type="password"
        label="تکرار رمز عبور جدید"
        required
        dir="ltr"
      />
      <Button type="submit" loading={pending} className="self-start">
        تغییر رمز عبور
      </Button>
    </form>
  );
}
