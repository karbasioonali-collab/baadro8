import { prisma } from "@/lib/prisma";
import type { PermissionModule } from "@/generated/prisma/enums";

export async function hasPermission(
  employeeId: string,
  isFullAdmin: boolean,
  module: PermissionModule,
  action: "view" | "edit" = "view"
): Promise<boolean> {
  if (isFullAdmin) return true;

  const permission = await prisma.employeePermission.findUnique({
    where: { employeeId_module: { employeeId, module } },
  });

  if (!permission) return false;
  return action === "view" ? permission.canView : permission.canEdit;
}
