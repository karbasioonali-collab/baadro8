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

echo "==> در حال بالا آوردن Next.js ..."
exec npx next start
