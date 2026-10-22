import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * فقط یک لاگ ساده‌ی نصب موفق PWA — بدون هیچ ورودی از کلاینت و بدون ذخیره‌ی
 * هیچ داده‌ی شخصی/قابل‌ردیابی (نه IP، نه user agent). فقط برای شمارش کل در
 * پنل ادمین (بخش «آمار نصب اپلیکیشن»).
 */
export async function POST() {
  await prisma.pwaInstall.create({ data: {} });
  return NextResponse.json({ ok: true });
}
