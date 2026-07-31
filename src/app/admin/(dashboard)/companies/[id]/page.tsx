import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { type CompanyFormValue, emptyCompanyForm } from "@/components/admin/company-form-types";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentEmployee();
  if (!current) redirect("/admin/login");
  if (!current.can("companies", "edit") && !current.can("pricing", "edit")) {
    redirect("/admin/companies");
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: { coveredCities: true, pricingRules: true, accounts: true },
  });

  if (!company) notFound();

  const rule = company.pricingRules.find((r) => r.sourceType === "internal_formula");
  const automationRule = company.pricingRules.find((r) => r.sourceType === "page_automation");
  const account = company.accounts[0];
  const base = emptyCompanyForm();

  const value: CompanyFormValue = {
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl ?? "",
    type: company.type,
    active: company.active,
    commissionType: company.commissionType,
    commissionValue: Number(company.commissionValue),
    contractInfo: company.contractInfo ?? "",
    trackingMethod: company.trackingMethod,
    trackingEndpoint: company.trackingEndpoint ?? "",
    pricingSourceType: company.pricingSourceType,
    coveredCities: company.coveredCities.map((c) => c.cityName),
    ruleType: rule?.ruleType ?? "formula",
    formulaParams: (rule?.formulaParams as CompanyFormValue["formulaParams"]) ?? base.formulaParams,
    tiers: (rule?.tiers as CompanyFormValue["tiers"]) ?? base.tiers,
    apiBaseUrl: company.apiBaseUrl ?? "",
    apiKey: company.apiKey ?? "",
    automationConfig: {
      ...base.automationConfig,
      ...((automationRule?.formulaParams as Partial<CompanyFormValue["automationConfig"]>) ?? {}),
      fieldSelectors: {
        ...base.automationConfig.fieldSelectors,
        ...((automationRule?.formulaParams as { fieldSelectors?: object } | null)?.fieldSelectors ??
          {}),
      },
    },
    username: account?.username ?? "",
    password: "",
    hasAccount: Boolean(account),
  };

  return <CompanyForm initial={value} />;
}
