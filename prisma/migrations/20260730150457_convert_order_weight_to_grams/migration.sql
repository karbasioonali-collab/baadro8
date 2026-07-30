-- وزن مرسوله از کیلوگرم (Decimal) به گرم (Integer) تغییر می‌کند.
-- مقادیر موجود با ضرب در ۱۰۰۰ به گرم تبدیل می‌شوند تا داده‌ی سفارش‌های قبلی از بین نرود.
ALTER TABLE "orders"
  ALTER COLUMN "weightKg" TYPE INTEGER USING ROUND("weightKg" * 1000)::INTEGER;

ALTER TABLE "orders" RENAME COLUMN "weightKg" TO "weightGrams";
