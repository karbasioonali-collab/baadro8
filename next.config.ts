import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma CLI (و موتورهایش) هیچ‌جای کد سرور require نمی‌شود (فقط
  // @prisma/client require می‌شود)، پس tracing خودکار standalone آن را
  // نادیده می‌گیرد و از .next/standalone/node_modules حذف می‌کند — دقیقاً
  // علت واقعی خطای ENOSPC در liara_pre_start.sh (npx مجبور شد آن را از
  // رجیستری دانلود کند). این override صریح، طبق مستندات خودِ Next.js،
  // این دو مسیر را همیشه در کپی نهایی نگه می‌دارد.
  outputFileTracingIncludes: {
    "/*": ["node_modules/prisma/**/*", "node_modules/@prisma/engines/**/*"],
  },
};

export default nextConfig;
