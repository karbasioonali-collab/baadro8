import { headers } from "next/headers";

/**
 * Rate limiting ساده‌ی in-memory برای جلوگیری از brute-force روی لاگین
 * ادمین/شرکت‌ها و OTP مشتری — طبق تصمیم صریح کارفرما، بدون جدول جدید در
 * دیتابیس (پرهیز از migration). این دقیقاً همان الگوی معماری‌ای است که
 * بقیه‌ی کش‌های این پروژه (چاپار/تاپین/الوپست city-map) هم استفاده
 * می‌کنند — یک `Map` سطح ماژول، per-process.
 *
 * ⚠️ محدودیت شناخته‌شده (همان محدودیتی که برای بقیه‌ی کش‌های پروژه هم
 * صادق و از قبل در infobaadro.md مستند است): اگر روزی چند instance موازی
 * روی Liara اجرا شود، هر instance شمارنده‌ی خودش را جدا نگه می‌دارد —
 * یعنی عملاً سقف واقعی ۵ تلاش می‌شود «۵ تلاش به‌ازای هر instance»، نه ۵
 * تلاش مطلق. این یک محافظت ضعیف‌تر از ایده‌آل است، ولی هنوز به‌مراتب
 * بهتر از نبود هیچ محافظتی (وضعیت فعلی) است؛ اگر این محدودیت در آینده
 * مهم شد، باید به یک store مشترک (مثل Redis) منتقل شود — امضای توابع
 * زیر (`checkRateLimit`/`recordFailedAttempt`/`resetAttempts`) عمداً
 * ساده و بدون جزئیات پیاده‌سازی نوشته شده تا آن روز، فقط بدنه‌ی داخلی
 * این فایل عوض شود، نه جای فراخوانی‌ها در auth.ts.
 */

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
/** اگر تعداد کلیدهای متمایز (نام‌کاربری/موبایل/IP) خیلی زیاد شد (مثلاً یک بات در حال اسکن IPهای تصادفی)، ورودی‌های منقضی/قدیمی پاک می‌شوند تا حافظه بدون‌سقف رشد نکند. */
const SWEEP_THRESHOLD = 5000;

type Entry = { failCount: number; lockedUntil: number | null; lastFailureAt: number };

const attempts = new Map<string, Entry>();

export type RateLimitCheck =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export const RATE_LIMIT_MESSAGE = "تعداد تلاش‌های شما زیاد شده، لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید";

function sweepIfNeeded(now: number) {
  if (attempts.size < SWEEP_THRESHOLD) return;
  for (const [key, entry] of attempts) {
    const lockExpired = entry.lockedUntil !== null && entry.lockedUntil < now;
    const staleUnlocked = entry.lockedUntil === null && now - entry.lastFailureAt > LOCK_DURATION_MS;
    if (lockExpired || staleUnlocked) attempts.delete(key);
  }
}

/** قبل از هر تلاش لاگین/تایید OTP صدا زده می‌شود — فقط می‌خواند، چیزی را افزایش نمی‌دهد. */
export function checkRateLimit(key: string): RateLimitCheck {
  const entry = attempts.get(key);
  if (!entry || entry.lockedUntil === null) return { allowed: true };

  const remainingMs = entry.lockedUntil - Date.now();
  if (remainingMs <= 0) {
    // قفل منقضی شده — پاک‌سازی تا دور بعد از صفر شروع شود.
    attempts.delete(key);
    return { allowed: true };
  }
  return { allowed: false, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

/** بعد از رمز/کد اشتباه صدا زده می‌شود. */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  sweepIfNeeded(now);

  const entry = attempts.get(key) ?? { failCount: 0, lockedUntil: null, lastFailureAt: now };
  entry.failCount += 1;
  entry.lastFailureAt = now;
  if (entry.failCount >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
  }
  attempts.set(key, entry);
}

/** بعد از لاگین/تایید موفق صدا زده می‌شود تا شمارنده‌ی این کلید صفر شود. */
export function resetAttempts(key: string): void {
  attempts.delete(key);
}

/**
 * IP واقعی کلاینت از هدر `x-forwarded-for` (که پروکسی Liara ست می‌کند) —
 * اولین مقدار در این هدر نزدیک‌ترین IP به خودِ کلاینت است. اگر هدر نبود
 * (مثلاً در توسعه‌ی محلی)، یک مقدار ثابت برمی‌گرداند تا rate limiting
 * بر اساس IP بی‌اثر نشود (فقط محدودیت بر اساس username/mobile باقی می‌ماند).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return h.get("x-real-ip") ?? "unknown";
}
