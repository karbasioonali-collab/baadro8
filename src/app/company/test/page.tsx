export const dynamic = "force-dynamic";

/**
 * صفحه‌ی تشخیصی موقت — فقط برای بررسی اینکه آیا کل route group /company اصلاً
 * لود می‌شود یا مشکل مخصوص company/login است. بدون هیچ import، DB call یا
 * client component. بعد از رفع مشکل company/login باید حذف شود (و ارجاع آن
 * در src/proxy.ts هم برداشته شود).
 */
export default function CompanyTestPage() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", direction: "ltr" }}>
      company route group OK — {new Date().toISOString()}
    </div>
  );
}
