import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { type EmployeeFormValue, emptyEmployeeForm } from "@/components/admin/employee-form-types";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) redirect("/admin");

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { permissions: true },
  });
  if (!employee) notFound();

  const base = emptyEmployeeForm();
  const value: EmployeeFormValue = {
    id: employee.id,
    name: employee.name,
    mobile: employee.mobile,
    username: employee.username,
    password: "",
    isFullAdmin: employee.isFullAdmin,
    active: employee.active,
    permissions: {
      ...base.permissions,
      ...Object.fromEntries(
        employee.permissions.map((p) => [p.module, { canView: p.canView, canEdit: p.canEdit }])
      ),
    },
  };

  return <EmployeeForm initial={value} />;
}
