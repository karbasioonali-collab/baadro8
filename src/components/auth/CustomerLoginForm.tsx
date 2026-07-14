"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestCustomerOtpAction,
  verifyCustomerOtpAction,
  type OtpRequestState,
  type OtpVerifyState,
} from "@/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const requestInitial: OtpRequestState = { ok: false };
const verifyInitial: OtpVerifyState = { ok: false };

export function CustomerLoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const [requestState, requestAction, requestPending] = useActionState(
    requestCustomerOtpAction,
    requestInitial
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyCustomerOtpAction,
    verifyInitial
  );

  useEffect(() => {
    // این افکت به نتیجه یک Server Action (سیستم خارجی) واکنش نشان می‌دهد،
    // نه به تغییر props/state داخلی؛ به همین دلیل setState همزمان اینجا لازم است.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (requestState.ok && requestState.mobile) {
      setMobile(requestState.mobile);
      setStep("otp");
      setSecondsLeft(requestState.expiresInSeconds ?? 120);
    } else if (requestState.error) {
      toast.show(requestState.error, "error");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [requestState, toast]);

  useEffect(() => {
    if (verifyState.ok) {
      toast.show("ورود با موفقیت انجام شد", "success");
      router.push(redirectTo);
      router.refresh();
    } else if (verifyState.error) {
      toast.show(verifyState.error, "error");
    }
  }, [verifyState, toast, router, redirectTo]);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  if (step === "mobile") {
    return (
      <form action={requestAction} className="flex flex-col gap-4">
        <Input
          name="mobile"
          label="شماره موبایل"
          placeholder="09xxxxxxxxx"
          dir="ltr"
          inputMode="numeric"
          required
        />
        <Button type="submit" loading={requestPending} className="w-full">
          دریافت کد تایید
        </Button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-4">
      <input type="hidden" name="mobile" value={mobile} />
      <p className="text-sm text-neutral-500">
        کد تایید به شماره <b dir="ltr">{mobile}</b> ارسال شد.
      </p>
      <Input
        name="code"
        label="کد تایید"
        placeholder="کد ۵ رقمی"
        dir="ltr"
        inputMode="numeric"
        autoFocus
        required
      />
      <Button type="submit" loading={verifyPending} className="w-full">
        ورود
      </Button>
      <div className="text-center text-sm">
        {secondsLeft > 0 ? (
          <span className="text-neutral-400">
            ارسال مجدد کد تا {secondsLeft} ثانیه دیگر
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setStep("mobile")}
            className="text-brand-blue-600 hover:underline"
          >
            ارسال مجدد کد
          </button>
        )}
      </div>
    </form>
  );
}
