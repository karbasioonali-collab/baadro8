#!/bin/sh
# اسکریپت start برای production. برخلاف حالت قبلی، اگر migrate/seed شکست
# بخورند دیگر کل سرویس را از بالا آمدن متوقف نمی‌کنند — سرور همیشه بالا
# می‌آید تا هم سایت در دسترس بماند و هم بشود از /api/debug برای عیب‌یابی
# استفاده کرد. خطای migrate/seed در لاگ کاملاً چاپ می‌شود.

echo "==> در حال اجرای prisma migrate deploy ..."
if ! npx prisma migrate deploy; then
  echo "!! prisma migrate deploy شکست خورد. سرور در ادامه بالا می‌آید تا"
  echo "!! از /api/debug برای عیب‌یابی دیتابیس استفاده شود."
fi

echo "==> در حال اجرای prisma db seed ..."
if ! npx prisma db seed; then
  echo "!! prisma db seed شکست خورد (معمولاً چون جدول‌ها هنوز ساخته نشده‌اند)."
fi

echo "==> در حال کپی فایل‌های استاتیک برای standalone build ..."
# output: standalone در next.config.ts فقط سرور و node_modules لازم را
# می‌سازد، نه public/ و .next/static را — طبق مستندات خودِ Next.js باید
# این دو را دستی کنار سرور استندالون بگذاریم، وگرنه سایت بدون CSS/JS/عکس
# بالا می‌آید. rm قبلش برای idempotent بودن (اگر start.sh دوباره روی همان
# container اجرا شود، مثلاً بعد از ری‌استارت).
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "==> در حال بالا آوردن Next.js (standalone) ..."
exec node .next/standalone/server.js
