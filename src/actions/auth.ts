"use server";

import { prisma } from "@/lib/prisma";
import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { mobileSchema, otpCodeSchema } from "@/lib/validation";
import {
  createCustomerSession,
  createStaffSession,
  createCompanySession,
  destroySession,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export type OtpRequestState = {
  ok: boolean;
  error?: string;
  mobile?: string;
  expiresInSeconds?: number;
};

export async function requestCustomerOtpAction(
  _prev: OtpRequestState,
  formData: FormData
): Promise<OtpRequestState> {
  const parsed = mobileSchema.safeParse(String(formData.get("mobile") ?? ""));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const { expiresInSeconds } = await requestOtp(parsed.data);
  return { ok: true, mobile: parsed.data, expiresInSeconds };
}

export type OtpVerifyState = {
  ok: boolean;
  error?: string;
};

export async function verifyCustomerOtpAction(
  _prev: OtpVerifyState,
  formData: FormData
): Promise<OtpVerifyState> {
  const mobileParsed = mobileSchema.safeParse(String(formData.get("mobile") ?? ""));
  const codeParsed = otpCodeSchema.safeParse(String(formData.get("code") ?? ""));

  if (!mobileParsed.success) return { ok: false, error: mobileParsed.error.issues[0]?.message };
  if (!codeParsed.success) return { ok: false, error: codeParsed.error.issues[0]?.message };

  const result = await verifyOtp(mobileParsed.data, codeParsed.data);
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.reason === "expired"
          ? "کد منقضی شده، دوباره درخواست دهید"
          : "کد وارد شده صحیح نیست",
    };
  }

  const user = await prisma.user.upsert({
    where: { mobile: mobileParsed.data },
    update: {},
    create: { mobile: mobileParsed.data },
  });

  await createCustomerSession({ userId: user.id, mobile: user.mobile });

  return { ok: true };
}

export async function logoutCustomerAction() {
  await destroySession("customer");
}

export type StaffLoginState = { ok: boolean; error?: string };

export async function staffLoginAction(
  _prev: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const employee = await prisma.employee.findUnique({ where: { username } });
  if (!employee || !employee.active) {
    return { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" };
  }

  const valid = await verifyPassword(password, employee.passwordHash);
  if (!valid) {
    return { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" };
  }

  await createStaffSession({
    employeeId: employee.id,
    isFullAdmin: employee.isFullAdmin,
  });

  return { ok: true };
}

export async function logoutStaffAction() {
  await destroySession("staff");
}

export type CompanyLoginState = { ok: boolean; error?: string };

export async function companyLoginAction(
  _prev: CompanyLoginState,
  formData: FormData
): Promise<CompanyLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const account = await prisma.companyAccount.findUnique({ where: { username } });
  if (!account || !account.active) {
    return { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" };
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" };
  }

  await createCompanySession({
    companyAccountId: account.id,
    companyId: account.companyId,
  });

  return { ok: true };
}

export async function logoutCompanyAction() {
  await destroySession("company");
}
