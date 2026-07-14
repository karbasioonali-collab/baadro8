# بادرو

پلتفرم مقایسه قیمت و ثبت سفارش ارسال مرسوله (پستی بین‌شهری + پیک درون‌شهری) در ایران.

## استک فنی

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- PostgreSQL + Prisma ORM 7 (با driver adapter `@prisma/adapter-pg`)
- احراز هویت: OTP موبایل برای مشتری، یوزر/پسورد برای کارمند و شرکت (JWT با `jose`)
- نقشه: Leaflet / OpenStreetMap برای انتخاب موقعیت آدرس مبدا
- نمودار: Recharts
- PWA: manifest + service worker سفارشی (بدون کتابخانه ثالث)

## راه‌اندازی محیط توسعه

```bash
cp .env.example .env   # مقادیر DATABASE_URL و AUTH_SECRET را تنظیم کنید
npm install
npx prisma migrate dev # ساخت جداول
npx prisma db seed     # داده اولیه: شهرها، شرکت‌های نمونه، حساب تستی
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید.

### حساب‌های تستی (بعد از seed)

| پنل | آدرس | یوزرنیم | پسورد |
|---|---|---|---|
| ادمین | `/admin/login` | `admin` | `badro@admin1404` |
| شرکت (آزما پست) | `/company/login` | `azma-post` | `azma@1404` |
| کاربر | `/login` | فقط شماره موبایل (OTP در کنسول سرور چاپ می‌شود، provider = mock) |

## دیپلوی (Render / Vercel و مشابه)

- `postinstall` به‌صورت خودکار `prisma generate` را اجرا می‌کند (لازم چون خروجی کلاینت پریسما در گیت commit نمی‌شود).
- `npm start` قبل از بالا آمدن سرور، خودش `prisma migrate deploy` و `prisma db seed` را اجرا می‌کند — یعنی نیازی به اجرای دستی این دستورها از طریق Shell نیست (مناسب پلن‌های رایگان Render که Shell ندارند). هر دو دستور idempotent هستند و اجرای مکرر آن‌ها (مثلاً بعد از هر restart) بی‌خطر است.
- **نکته Neon:** برای `DATABASE_URL` از کانکشن استرینگ **مستقیم** (بدون `-pooler` در هاست) استفاده کنید، نه نسخه Pooled. چون `prisma migrate deploy` از قفل‌های advisory استفاده می‌کند که PgBouncer (پشت کانکشن Pooled نئون) به‌طور کامل پشتیبانی نمی‌کند و ممکن است migrate را با خطا مواجه کند. برای یک سرویس همیشه-روشن مثل Render (برخلاف serverless) کانکشن مستقیم کاملاً کافی و ساده‌تر است.

## ساختار پروژه

- `src/app/(public)` — صفحات عمومی: صفحه اصلی، نتایج، ثبت سفارش، پیگیری، درباره/تماس
- `src/app/admin`, `src/app/panel`, `src/app/company` — سه پنل مجزا با Authentication/Authorization جدا
- `src/lib/pricing` — موتور قیمت‌گذاری (`internal_formula` فعال؛ `external_api` و `page_automation` به‌صورت Interface آماده برای فاز بعد)
- `src/lib/auth` — session (JWT جدا برای هر نقش)، OTP، RBAC کارمندان
- `src/actions` — Server Actionها (معادل API برای تمام عملیات نوشتنی)
- `prisma/schema.prisma` — مدل داده کامل
- `prisma/seed.ts` — داده اولیه نمونه

## نکات فاز بعد (خارج از محدوده فعلی)

طبق سند نیازمندی، موارد زیر در فاز بعد اضافه می‌شوند: نام و فرمول دقیق شرکت‌های واقعی، اتصال `external_api`/`page_automation`، درگاه پرداخت آنلاین، حساب کسب‌وکار، آپلود گروهی سفارش، اپلیکیشن موبایل نیتیو، و اتصال به سرویس پیامک واقعی (کاوه‌نگار/ملی‌پیامک — فقط جایگزینی کلاس `SmsProvider` لازم است).
