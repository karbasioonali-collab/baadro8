"use client";

import { useActionState, useEffect } from "react";
import { updateProfileAction, type UpdateProfileState } from "@/actions/profile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const initial: UpdateProfileState = { ok: false };

export function ProfileForm({
  mobile,
  name,
  email,
}: {
  mobile: string;
  name: string;
  email: string;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  useEffect(() => {
    if (state.ok) toast.show("پروفایل با موفقیت به‌روزرسانی شد", "success");
    else if (state.error) toast.show(state.error, "error");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <Input label="شماره موبایل" value={mobile} disabled dir="ltr" />
      <Input name="name" label="نام و نام‌خانوادگی" defaultValue={name} />
      <Input name="email" type="email" label="ایمیل (اختیاری)" defaultValue={email} dir="ltr" />
      <Button type="submit" loading={pending} className="self-start">
        ذخیره تغییرات
      </Button>
    </form>
  );
}
