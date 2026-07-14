import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { EmployeeForm, emptyEmployeeForm } from "@/components/admin/EmployeeForm";

export default async function NewEmployeePage() {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) redirect("/admin");

  return <EmployeeForm initial={emptyEmployeeForm()} />;
}
