import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/validation";
import { CompanyActiveToggle } from "@/components/admin/CompanyActiveToggle";
import { requireStaffView } from "@/lib/auth/require-permission";

export default async function AdminCompaniesPage() {
  const current = await requireStaffView(["companies", "pricing"]);
  const canEdit = current.can("companies", "edit") || current.can("pricing", "edit");

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, coveredCities: true } } },
  });

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/companies/new"
            className="rounded-xl bg-brand-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-600"
          >
            + افزودن شرکت جدید
          </Link>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">نام</th>
              <th className="p-3 text-right font-medium">نوع</th>
              <th className="p-3 text-right font-medium">کمیسیون</th>
              <th className="p-3 text-right font-medium">تعداد سفارش</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="p-3">
                  <Link href={`/admin/companies/${c.id}`} className="font-medium text-brand-blue-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 text-neutral-600">
                  {c.type === "intercity" ? "بین‌شهری" : "درون‌شهری"}
                </td>
                <td className="p-3 text-neutral-600">
                  {c.commissionType === "percent"
                    ? `${c.commissionValue}٪`
                    : formatToman(Number(c.commissionValue))}
                </td>
                <td className="p-3 text-neutral-600">{c._count.orders}</td>
                <td className="p-3">
                  {canEdit ? (
                    <CompanyActiveToggle companyId={c.id} active={c.active} />
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.active ? "bg-brand-green-100 text-brand-green-700" : "bg-neutral-100 text-neutral-500"}`}
                    >
                      {c.active ? "فعال" : "غیرفعال"}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {canEdit && (
                    <Link href={`/admin/companies/${c.id}`} className="text-brand-blue-600 hover:underline">
                      ویرایش
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  هنوز شرکتی ثبت نشده است
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
