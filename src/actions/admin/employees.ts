"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { hashPassword } from "@/lib/auth/password";
import { mobileSchema } from "@/lib/validation";
import { PermissionModule } from "@/generated/prisma/enums";

const permissionInput = z.object({
  module: z.nativeEnum(PermissionModule),
  canView: z.boolean(),
  canEdit: z.boolean(),
});

const employeeInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3, "نام باید حداقل ۳ حرف باشد"),
  mobile: z.string(),
  username: z.string().trim().min(3, "نام کاربری باید حداقل ۳ حرف باشد"),
  password: z.string().optional(),
  isFullAdmin: z.boolean(),
  active: z.boolean(),
  permissions: z.array(permissionInput),
});

export type EmployeeFormInput = z.infer<typeof employeeInputSchema>;
export type SaveEmployeeResult = { ok: boolean; error?: string; id?: string };

export async function saveEmployeeAction(
  input: EmployeeFormInput
): Promise<SaveEmployeeResult> {
  const current = await getCurrentEmployee();
  if (!current || !current.employee.isFullAdmin) {
    return { ok: false, error: "فقط ادمین کامل می‌تواند کارمندان را مدیریت کند" };
  }

  const parsed = employeeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }
  const data = parsed.data;

  const mobileParsed = mobileSchema.safeParse(data.mobile);
  if (!mobileParsed.success) {
    return { ok: false, error: mobileParsed.error.issues[0]?.message };
  }

  if (!data.id && (!data.password || data.password.length < 4)) {
    return { ok: false, error: "رمز عبور باید حداقل ۴ کاراکتر باشد" };
  }

  const employee = await prisma.$transaction(async (tx) => {
    const saved = data.id
      ? await tx.employee.update({
          where: { id: data.id },
          data: {
            name: data.name,
            mobile: mobileParsed.data,
            username: data.username,
            isFullAdmin: data.isFullAdmin,
            active: data.active,
            ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
          },
        })
      : await tx.employee.create({
          data: {
            name: data.name,
            mobile: mobileParsed.data,
            username: data.username,
            isFullAdmin: data.isFullAdmin,
            active: data.active,
            passwordHash: await hashPassword(data.password!),
            createdById: current.employee.id,
          },
        });

    await tx.employeePermission.deleteMany({ where: { employeeId: saved.id } });
    if (!data.isFullAdmin) {
      await tx.employeePermission.createMany({
        data: data.permissions
          .filter((p) => p.canView || p.canEdit)
          .map((p) => ({
            employeeId: saved.id,
            module: p.module,
            canView: p.canView || p.canEdit,
            canEdit: p.canEdit,
          })),
      });
    }

    return saved;
  });

  revalidatePath("/admin/employees");
  return { ok: true, id: employee.id };
}

export async function toggleEmployeeActiveAction(id: string): Promise<SaveEmployeeResult> {
  const current = await getCurrentEmployee();
  if (!current || !current.employee.isFullAdmin) {
    return { ok: false, error: "دسترسی غیرمجاز" };
  }
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return { ok: false, error: "کارمند یافت نشد" };

  await prisma.employee.update({ where: { id }, data: { active: !employee.active } });
  revalidatePath("/admin/employees");
  return { ok: true };
}
