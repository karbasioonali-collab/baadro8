import "dotenv/config";
import { defineConfig } from "prisma/config";

// trim می‌کنیم چون کپی‌پیست مقدار در فرم Render گاهی یک فاصله/newline اضافه یا
// دو کوتیشن اضافه در ابتدا/انتهای رشته باقی می‌گذارد که باعث می‌شود این مقدار
// به‌عنوان یک connection string معتبر خوانده نشود.
const databaseUrl = process.env["DATABASE_URL"]
  ?.trim()
  .replace(/^['"]|['"]$/g, "");

// «prisma generate» فقط اسکیما را می‌خواند و به دیتابیس وصل نمی‌شود، پس نباید
// اگر DATABASE_URL هنوز تنظیم نشده (مثلاً در مرحله build قبل از تنظیم env var
// روی پلتفرم دیپلوی) fail کند. فرمان‌های دیگر (migrate, db seed, studio) واقعاً
// به این مقدار نیاز دارند و در نبودش با پیام روشن fail می‌کنند.
const command = process.argv[2];
if (!databaseUrl && command !== "generate") {
  throw new Error(
    "DATABASE_URL خوانده نشد. یعنی متغیر محیطی DATABASE_URL در پلتفرم دیپلوی " +
      "(Render/Vercel/...) برای این سرویس تنظیم نشده یا بعد از تنظیم، سرویس " +
      "دوباره دیپلوی نشده است. آن را در تب Environment سرویس بررسی و یک " +
      "Deploy جدید بزنید — این خطا از کد نیست، نبود مقدار DATABASE_URL در " +
      "runtime است."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
