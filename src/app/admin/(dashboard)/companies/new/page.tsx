import { CompanyForm, emptyCompanyForm } from "@/components/admin/CompanyForm";

export default function NewCompanyPage() {
  return <CompanyForm initial={emptyCompanyForm()} />;
}
