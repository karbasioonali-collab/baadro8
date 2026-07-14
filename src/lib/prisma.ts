import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// توجه: اگر DATABASE_URL تنظیم نشده باشد، درایور پستگرس به‌طور پیش‌فرض سعی
// می‌کند به localhost وصل شود و با خطای ECONNREFUSED مواجه می‌شوید. این مقدار
// را در متغیرهای محیطی سرویس دیپلوی (نه در زمان build، بلکه runtime) تنظیم کنید.
// trim می‌شود چون کپی‌پیست در فرم‌های وب گاهی فاصله/کوتیشن اضافه باقی می‌گذارد.
const connectionString = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, "");
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
