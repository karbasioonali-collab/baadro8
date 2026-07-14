import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { EmployeeActiveToggle } from "@/components/admin/EmployeeActiveToggle";

export default async function AdminEmployeesPage() {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) redirect("/admin");

  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/employees/new"
          className="rounded-xl bg-brand-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-600"
        >
          + افزودن کارمند جدید
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="p-3 text-right font-medium">نام</th>
              <th className="p-3 text-right font-medium">نام کاربری</th>
              <th className="p-3 text-right font-medium">نقش</th>
              <th className="p-3 text-right font-medium">وضعیت</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="p-3 text-neutral-800">{e.name}</td>
                <td className="p-3 text-neutral-600" dir="ltr">
                  {e.username}
                </td>
                <td className="p-3 text-neutral-600">{e.isFullAdmin ? "ادمین کامل" : "کارمند"}</td>
                <td className="p-3">
                  <EmployeeActiveToggle employeeId={e.id} active={e.active} />
                </td>
                <td className="p-3">
                  <Link href={`/admin/employees/${e.id}`} className="text-brand-blue-600 hover:underline">
                    ویرایش
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
