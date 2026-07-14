"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/session";

const profileSchema = z.object({
  name: z.string().trim().min(3, "نام باید حداقل ۳ حرف باشد").optional().or(z.literal("")),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
});

export type UpdateProfileState = { ok: boolean; error?: string };

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await getCustomerSession();
  if (!session) return { ok: false, error: "ابتدا وارد شوید" };

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: parsed.data.name || null,
      email: parsed.data.email || null,
    },
  });

  revalidatePath("/panel/profile");
  return { ok: true };
}
