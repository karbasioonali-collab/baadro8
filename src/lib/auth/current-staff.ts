import "server-only";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "./session";
import type { PermissionModule } from "@/generated/prisma/enums";

export async function getCurrentEmployee() {
  const session = await getStaffSession();
  if (!session) return null;

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    include: { permissions: true },
  });
  if (!employee || !employee.active) return null;

  const permissionMap = new Map(
    employee.permissions.map((p) => [p.module, { canView: p.canView, canEdit: p.canEdit }])
  );

  function can(module: PermissionModule, action: "view" | "edit" = "view") {
    if (employee!.isFullAdmin) return true;
    const p = permissionMap.get(module);
    if (!p) return false;
    return action === "view" ? p.canView : p.canEdit;
  }

  return { employee, can };
}

export type CurrentEmployee = NonNullable<
  Awaited<ReturnType<typeof getCurrentEmployee>>
>;
