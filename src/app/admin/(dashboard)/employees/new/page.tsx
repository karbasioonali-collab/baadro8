import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { emptyEmployeeForm } from "@/components/admin/employee-form-types";

export default async function NewEmployeePage() {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) redirect("/admin");

  return <EmployeeForm initial={emptyEmployeeForm()} />;
}
