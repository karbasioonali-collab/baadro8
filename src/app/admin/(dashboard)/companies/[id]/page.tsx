import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompanyForm, type CompanyFormValue, emptyCompanyForm } from "@/components/admin/CompanyForm";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: { coveredCities: true, pricingRules: true },
  });

  if (!company) notFound();

  const rule = company.pricingRules.find((r) => r.sourceType === "internal_formula");
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
  };

  return <CompanyForm initial={value} />;
}
