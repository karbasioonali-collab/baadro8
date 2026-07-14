import { prisma } from "@/lib/prisma";
import { getSmsProvider } from "@/lib/sms/provider";

const OTP_LENGTH = 5;
const OTP_TTL_MINUTES = 2;

function generateCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export async function requestOtp(mobile: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.otpCode.create({
    data: { mobile, code, purpose: "login", expiresAt },
  });

  await getSmsProvider().send(
    mobile,
    `کد ورود شما به بادرو: ${code}\nاعتبار: ${OTP_TTL_MINUTES} دقیقه`
  );

  return { expiresInSeconds: OTP_TTL_MINUTES * 60 };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" };

export async function verifyOtp(
  mobile: string,
  code: string
): Promise<VerifyOtpResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { mobile, code, purpose: "login", consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "not_found" };

  if (otp.expiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  return { ok: true };
}

/** اعلان تغییر وضعیت سفارش از همان سرویس مشترک ارسال پیامک استفاده می‌کند */
export async function sendOrderStatusSms(
  mobile: string,
  trackingCode: string,
  statusLabel: string
) {
  await getSmsProvider().send(
    mobile,
    `سفارش با کد رهگیری ${trackingCode} وارد مرحله «${statusLabel}» شد — بادرو`
  );
}
