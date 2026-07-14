import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { CompanyForm, emptyCompanyForm } from "@/components/admin/CompanyForm";

export default async function NewCompanyPage() {
  const current = await getCurrentEmployee();
  if (!current) redirect("/admin/login");
  if (!current.can("companies", "edit") && !current.can("pricing", "edit")) {
    redirect("/admin/companies");
  }

  return <CompanyForm initial={emptyCompanyForm()} />;
}
