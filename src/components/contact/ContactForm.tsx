"use client";

import { useActionState, useEffect } from "react";
import { submitContactAction, type ContactFormState } from "@/actions/contact";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const initialState: ContactFormState = { ok: false };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initialState
  );
  const toast = useToast();

  useEffect(() => {
    if (state.ok) toast.show("پیام شما با موفقیت ارسال شد", "success");
    else if (state.error) toast.show(state.error, "error");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input name="name" label="نام و نام‌خانوادگی" required placeholder="مثلا علی رضایی" />
      <Input name="mobile" label="شماره موبایل (اختیاری)" placeholder="09xxxxxxxxx" />
      <Input name="email" type="email" label="ایمیل (اختیاری)" placeholder="you@example.com" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">پیام شما</label>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-xl border border-neutral-200 bg-white p-3.5 text-sm outline-none focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100"
          placeholder="پیام خود را بنویسید..."
        />
      </div>
      <Button type="submit" loading={pending} className="self-start">
        ارسال پیام
      </Button>
    </form>
  );
}
