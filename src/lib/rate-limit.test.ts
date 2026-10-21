import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "./rate-limit";

test("checkRateLimit — کلید جدید همیشه اجازه می‌دهد", () => {
  const result = checkRateLimit("test:fresh-key-" + Math.random());
  assert.deepEqual(result, { allowed: true });
});

test("۴ تلاش ناموفق هنوز قفل نمی‌کند، تلاش پنجم قفل می‌کند", () => {
  const key = "test:threshold-" + Math.random();
  for (let i = 0; i < 4; i++) {
    recordFailedAttempt(key);
    assert.equal(checkRateLimit(key).allowed, true, `بعد از ${i + 1} تلاش هنوز نباید قفل باشد`);
  }
  recordFailedAttempt(key); // تلاش پنجم
  const result = checkRateLimit(key);
  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.ok(result.retryAfterSeconds > 0 && result.retryAfterSeconds <= 15 * 60);
  }
});

test("resetAttempts شمارنده را کاملاً صفر می‌کند", () => {
  const key = "test:reset-" + Math.random();
  for (let i = 0; i < 4; i++) recordFailedAttempt(key);
  assert.equal(checkRateLimit(key).allowed, true);

  resetAttempts(key);

  // بعد از reset، باید دوباره ۴ تلاش دیگر لازم باشد تا قفل شود (نه فقط ۱ تلاش باقی‌مانده)
  for (let i = 0; i < 4; i++) {
    recordFailedAttempt(key);
    assert.equal(checkRateLimit(key).allowed, true);
  }
  recordFailedAttempt(key);
  assert.equal(checkRateLimit(key).allowed, false);
});

test("دو کلید مستقل، تداخل ندارند (مثلاً username یکسان ولی IP متفاوت)", () => {
  const keyA = "test:independent-a-" + Math.random();
  const keyB = "test:independent-b-" + Math.random();

  for (let i = 0; i < 5; i++) recordFailedAttempt(keyA);
  assert.equal(checkRateLimit(keyA).allowed, false, "کلید A باید قفل باشد");
  assert.equal(checkRateLimit(keyB).allowed, true, "کلید B نباید تحت تاثیر قفل کلید A قرار بگیرد");
});

test("بعد از گذشت ۱۵ دقیقه، قفل خودکار برداشته می‌شود", () => {
  const key = "test:expiry-" + Math.random();
  mock.timers.enable({ apis: ["Date"] });
  try {
    for (let i = 0; i < 5; i++) recordFailedAttempt(key);
    assert.equal(checkRateLimit(key).allowed, false, "باید تازه قفل شده باشد");

    mock.timers.tick(14 * 60 * 1000); // ۱۴ دقیقه — هنوز قفل است
    assert.equal(checkRateLimit(key).allowed, false, "بعد از ۱۴ دقیقه هنوز باید قفل باشد");

    mock.timers.tick(2 * 60 * 1000); // مجموعاً ۱۶ دقیقه — قفل باید برداشته شده باشد
    assert.equal(checkRateLimit(key).allowed, true, "بعد از ۱۵ دقیقه قفل باید برداشته شود");
  } finally {
    mock.timers.reset();
  }
});
