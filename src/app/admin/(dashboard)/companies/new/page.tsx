import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { emptyCompanyForm } from "@/components/admin/company-form-types";

export default async function NewCompanyPage() {
  const current = await getCurrentEmployee();
  if (!current) redirect("/admin/login");
  if (!current.can("companies", "edit") && !current.can("pricing", "edit")) {
    redirect("/admin/companies");
  }

  return <CompanyForm initial={emptyCompanyForm()} />;
}
