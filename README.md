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
