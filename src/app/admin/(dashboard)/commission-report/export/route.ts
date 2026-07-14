import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";

export async function GET(request: NextRequest) {
  const current = await getCurrentEmployee();
  if (!current || !current.can("commission_report", "view")) {
    return new NextResponse("دسترسی غیرمجاز", { status: 403 });
  }

  const month = request.nextUrl.searchParams.get("month");
  const now = new Date();
  const [y, m] = (
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
    .split("-")
    .map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { company: { select: { name: true } } },
  });

  const byCompany = new Map<
    string,
    { count: number; totalPrice: number; totalCommission: number }
  >();

  for (const o of orders) {
    const entry = byCompany.get(o.company.name) ?? { count: 0, totalPrice: 0, totalCommission: 0 };
    entry.count += 1;
    entry.totalPrice += Number(o.calculatedPrice);
    entry.totalCommission += Number(o.commissionAmount);
    byCompany.set(o.company.name, entry);
  }

  const lines = ["شرکت,تعداد سفارش,جمع مبلغ (تومان),کمیسیون بادرو (تومان)"];
  for (const [name, e] of byCompany) {
    lines.push(`${name},${e.count},${e.totalPrice},${e.totalCommission}`);
  }

  const csv = "﻿" + lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commission-report-${y}-${m}.csv"`,
    },
  });
}
