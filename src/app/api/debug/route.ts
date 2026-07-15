import { NextResponse } from "next/server";
import { Client } from "pg";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * صفحه تشخیصی موقت برای عیب‌یابی مشکلات اتصال به دیتابیس در دیپلوی.
 * هیچ رمز عبور یا اطلاعات محرمانه‌ای برنمی‌گرداند — فقط ساختار مقدار
 * DATABASE_URL، نتیجه یک تلاش واقعی برای اتصال خام، و نتیجه اجرای همان
 * کوئری‌های Prisma که صفحه اصلی استفاده می‌کند را نشان می‌دهد (تا مشخص شود
 * migrate/seed واقعاً کامل شده‌اند یا نه). بعد از حل مشکل دیپلوی، این فایل
 * باید حذف شود.
 */
export async function GET() {
  const raw = process.env.DATABASE_URL;

  const trimmed = raw?.trim().replace(/^['"]|['"]$/g, "");

  const shape = raw
    ? {
        present: true,
        length: raw.length,
        trimmedLength: trimmed?.length ?? 0,
        hasLeadingOrTrailingWhitespace: raw !== raw.trim(),
        hasWrappingQuotes: /^['"]|['"]$/.test(raw),
        startsWithPostgres: /^postgres(ql)?:\/\//.test(trimmed ?? ""),
        hasSslmodeParam: (trimmed ?? "").includes("sslmode="),
        hostRedacted: safeExtractHost(trimmed),
      }
    : { present: false };

  let connectionTest: Record<string, unknown> = { attempted: false };

  if (trimmed) {
    connectionTest = { attempted: true };
    const client = new Client({
      connectionString: trimmed,
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      const result = await client.query("select 1 as ok");
      connectionTest = { attempted: true, ok: true, result: result.rows[0] };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      connectionTest = {
        attempted: true,
        ok: false,
        errorCode: e.code ?? null,
        errorMessage: e.message ?? String(err),
      };
    } finally {
      await client.end().catch(() => {});
    }
  }

  let prismaSchemaTest: Record<string, unknown> = { attempted: false };
  if (trimmed) {
    prismaSchemaTest = { attempted: true };
    try {
      const [slideCount, envelopeTypeCount, companyCount, coveredCityCount] =
        await Promise.all([
          prisma.homepageSlide.count(),
          prisma.envelopeType.count(),
          prisma.company.count(),
          prisma.coveredCity.count(),
        ]);
      prismaSchemaTest = {
        attempted: true,
        ok: true,
        counts: { slideCount, envelopeTypeCount, companyCount, coveredCityCount },
      };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      prismaSchemaTest = {
        attempted: true,
        ok: false,
        errorCode: e.code ?? null,
        errorMessage: e.message ?? String(err),
      };
    }
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: shape,
    connectionTest,
    prismaSchemaTest,
  });
}

function safeExtractHost(connectionString: string | undefined): string | null {
  if (!connectionString) return null;
  try {
    const url = new URL(connectionString);
    return url.hostname || null;
  } catch {
    return "unparseable";
  }
}
