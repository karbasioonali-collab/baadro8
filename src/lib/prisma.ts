import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// توجه: اگر DATABASE_URL تنظیم نشده باشد، درایور پستگرس به‌طور پیش‌فرض سعی
// می‌کند به localhost وصل شود و با خطای ECONNREFUSED مواجه می‌شوید. این مقدار
// را در متغیرهای محیطی سرویس دیپلوی (نه در زمان build، بلکه runtime) تنظیم کنید.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
