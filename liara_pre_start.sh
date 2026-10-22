#!/bin/sh
# طبق راهنمایی پشتیبانی Liara: این فایل در مسیر اصلی پروژه باید باشد و Liara
# آن را خودکار، قبل از هر اجرای برنامه، صدا می‌زند.
#
# ⚠️ فعلاً عمداً فقط یک تست بی‌خطر و تشخیصی است — هیچ migration واقعی اجرا
# نمی‌شود. هدف: تایید اینکه (۱) این مکانیزم واقعاً روی Liara صدا زده می‌شود،
# و (۲) آیا در همین مرحله به Prisma CLI و DATABASE_URL دسترسی هست یا نه —
# طبق نگرانی قبلی مستند در infobaadro.md درباره‌ی build با output:standalone
# (که Prisma CLI را از node_modules نسخه‌ی اجراشده‌ی production حذف می‌کند).
#
# عمداً هیچ `set -e` ندارد و همیشه با exit 0 تمام می‌شود — حتی اگر یکی از
# چک‌های تشخیصی زیر شکست بخورد، این اسکریپت نباید باعث شکست کل دیپلوی شود.

echo "=== liara_pre_start.sh: pre-start check ok ==="
echo "pwd: $(pwd)"
echo "node version: $(node --version 2>&1)"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo yes || echo no)"

if [ -d node_modules/prisma ]; then
  echo "node_modules/prisma package: FOUND"
else
  echo "node_modules/prisma package: NOT FOUND"
fi

if [ -f node_modules/.bin/prisma ]; then
  echo "node_modules/.bin/prisma: FOUND"
else
  echo "node_modules/.bin/prisma: NOT FOUND"
fi

echo "--- npx prisma --version output: ---"
npx prisma --version 2>&1
echo "--- end of npx prisma --version output ---"

echo "=== liara_pre_start.sh: done ==="
exit 0
