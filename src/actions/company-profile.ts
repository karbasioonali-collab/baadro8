"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCompanySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید"),
  newPassword: z.string().min(4, "رمز عبور جدید باید حداقل ۴ کاراکتر باشد"),
  confirmPassword: z.string(),
});

export type ChangeCompanyPasswordState = { ok: boolean; error?: string };

export async function changeCompanyPasswordAction(
  _prev: ChangeCompanyPasswordState,
  formData: FormData
): Promise<ChangeCompanyPasswordState> {
  const session = await getCompanySession();
  if (!session) return { ok: false, error: "ابتدا وارد شوید" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { ok: false, error: "رمز عبور جدید و تکرار آن یکسان نیستند" };
  }

  const account = await prisma.companyAccount.findUnique({
    where: { id: session.companyAccountId },
  });
  if (!account) return { ok: false, error: "حساب یافت نشد" };

  const valid = await verifyPassword(parsed.data.currentPassword, account.passwordHash);
  if (!valid) return { ok: false, error: "رمز عبور فعلی اشتباه است" };

  await prisma.companyAccount.update({
    where: { id: account.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true };
}
