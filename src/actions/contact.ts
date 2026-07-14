"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mobileSchema } from "@/lib/validation";

const contactSchema = z.object({
  name: z.string().trim().min(3, "نام باید حداقل ۳ حرف باشد"),
  mobile: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  message: z.string().trim().min(10, "پیام باید حداقل ۱۰ حرف باشد"),
});

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

export async function submitContactAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }

  if (parsed.data.mobile) {
    const mobileCheck = mobileSchema.safeParse(parsed.data.mobile);
    if (!mobileCheck.success) {
      return { ok: false, error: mobileCheck.error.issues[0]?.message };
    }
  }

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      mobile: parsed.data.mobile || null,
      email: parsed.data.email || null,
      message: parsed.data.message,
    },
  });

  return { ok: true };
}
