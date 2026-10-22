import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDayBuckets,
  getMonthBuckets,
  daysBetween,
  monthsBetween,
  MAX_DAILY_RANGE_DAYS,
  MAX_MONTHLY_RANGE_MONTHS,
} from "./pwa-stats";

test("daysBetween — شامل هر دو سر بازه است", () => {
  assert.equal(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 1)), 1, "یک روز یکسان = ۱ روز");
  assert.equal(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 10)), 10);
});

test("monthsBetween — شامل هر دو سر بازه است", () => {
  assert.equal(monthsBetween(new Date(2026, 0, 15), new Date(2026, 0, 20)), 1, "یک ماه یکسان = ۱ ماه");
  assert.equal(monthsBetween(new Date(2026, 0, 1), new Date(2026, 11, 1)), 12, "فروردین تا اسفند = ۱۲ ماه");
  assert.equal(monthsBetween(new Date(2025, 11, 1), new Date(2026, 0, 1)), 2, "عبور از سال میلادی");
});

test("getDayBuckets — تعداد سطل‌ها دقیقاً برابر تعداد روزهای بازه است", () => {
  const buckets = getDayBuckets(new Date(2026, 0, 1), new Date(2026, 0, 5));
  assert.equal(buckets.length, 5);
  assert.equal(buckets[0].key, "2026-01-01");
  assert.equal(buckets[4].key, "2026-01-05");
  // هر سطل باید دقیقاً یک روز پوشش دهد
  assert.equal(buckets[0].end.getTime() - buckets[0].start.getTime(), 24 * 60 * 60 * 1000);
});

test("getMonthBuckets — تعداد سطل‌ها دقیقاً برابر تعداد ماه‌های بازه است", () => {
  const buckets = getMonthBuckets(new Date(2026, 0, 15), new Date(2026, 2, 3));
  assert.equal(buckets.length, 3, "بهمن/اسفند/فروردین میلادی یعنی ژانویه-مارس => ۳ ماه");
  assert.equal(buckets[0].key, "2026-01");
  assert.equal(buckets[2].key, "2026-03");
});

test("getDayBuckets/getMonthBuckets — بازه‌ی تک‌روزه/تک‌ماهه هم یک سطل می‌دهد", () => {
  assert.equal(getDayBuckets(new Date(2026, 0, 1), new Date(2026, 0, 1)).length, 1);
  assert.equal(getMonthBuckets(new Date(2026, 0, 1), new Date(2026, 0, 1)).length, 1);
});

test("محدودیت‌های بازه دقیقاً مطابق مقادیر اعلام‌شده هستند", () => {
  assert.equal(MAX_DAILY_RANGE_DAYS, 31);
  assert.equal(MAX_MONTHLY_RANGE_MONTHS, 12);
});
