import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaffView } from "@/lib/auth/require-permission";

export default async function AdminUsersPage() {
  await requireStaffView("users");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="p-3 text-right font-medium">نام</th>
            <th className="p-3 text-right font-medium">موبایل</th>
            <th className="p-3 text-right font-medium">تعداد سفارش</th>
            <th className="p-3 text-right font-medium">تاریخ عضویت</th>
            <th className="p-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
              <td className="p-3 text-neutral-800">{u.name ?? "بدون نام"}</td>
              <td className="p-3 text-neutral-600" dir="ltr">
                {u.mobile}
              </td>
              <td className="p-3 text-neutral-600">{u._count.orders}</td>
              <td className="p-3 text-neutral-400 text-xs" dir="ltr">
                {u.createdAt.toLocaleDateString("fa-IR")}
              </td>
              <td className="p-3">
                <Link href={`/admin/users/${u.id}`} className="text-brand-blue-600 hover:underline">
                  مشاهده سفارش‌ها
                </Link>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-neutral-400">
                کاربری ثبت نشده است
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
