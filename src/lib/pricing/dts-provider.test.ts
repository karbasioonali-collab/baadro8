import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDtsQuote } from "./dts-provider";
import { DTS_COMPANY_ID, findDtsZoneForCity } from "./dts-data";

test("DTS_COMPANY_ID مطابق شناسه‌ی داده‌شده است", () => {
  assert.equal(DTS_COMPANY_ID, "cmtepeku600000lo8ee5yybv9");
});

test("زون‌یابی شهرها + یکسان‌سازی نام (فاصله/ي-ی عربی/پیشوند)", () => {
  assert.equal(findDtsZoneForCity("تهران"), 1);
  assert.equal(findDtsZoneForCity("تبریز"), 2);
  assert.equal(findDtsZoneForCity("مشهد"), 3);
  assert.equal(findDtsZoneForCity("بندرعباس"), 4);
  assert.equal(findDtsZoneForCity("کیش"), 5);
  assert.equal(findDtsZoneForCity("شهرستان تبريز"), 2, "پیشوند «شهرستان» + ي عربی باید نادیده گرفته شود");
  assert.equal(findDtsZoneForCity("  تهران  "), 1, "فاصله‌های اضافه باید نادیده گرفته شود");
  assert.equal(findDtsZoneForCity("یک شهر ناموجود"), null);
});

// سناریوی (الف): تهران به تبریز، وزن ۳ کیلوگرم — یک طرف تهران، بدون افزایش
test("(الف) تهران→تبریز، ۳کیلوگرم: قیمت زون تبریز بدون افزایش", () => {
  const r = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.equal(r.available, true);
  if (r.available) {
    assert.equal(r.price, 365000); // ردیف ۳.۰kg، ستون Zone2
    assert.equal(r.breakdown["افزایش_مبدا_غیرتهران_۲۰_درصد"], undefined);
  }

  // جهت برعکس (مقصد تهران) باید همان نتیجه را بدهد — قانون ۳ به مبدا/مقصد بی‌تفاوت است
  const reversed = computeDtsQuote({
    originCity: "تبریز",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.deepEqual(reversed, r);
});

// سناریوی (ب): تبریز به اصفهان (هردو Zone2)، وزن ۵ کیلوگرم — زون مبدا + ۲۰٪
test("(ب) تبریز→اصفهان (هردو غیرتهران)، ۵کیلوگرم: زون مبدا + ۲۰٪", () => {
  const r = computeDtsQuote({
    originCity: "تبریز",
    destinationCity: "اصفهان",
    parcelType: "package",
    weightGrams: 5000,
  });
  assert.equal(r.available, true);
  if (r.available) {
    // ردیف ۵.۰kg، ستون Zone2 = ۴۵۱٬۰۰۰؛ ۲۰٪ = ۹۰٬۲۰۰؛ جمع = ۵۴۱٬۲۰۰
    assert.equal(r.breakdown["قیمت_پایه_زون"], 451000);
    assert.equal(r.breakdown["افزایش_مبدا_غیرتهران_۲۰_درصد"], 90200);
    assert.equal(r.price, 541200);
  }

  // قانون ۴ صریحاً می‌گوید زون *مبدا*، نه مقصد — با دو شهر در زون‌های متفاوت این تفاوت را تایید می‌کنیم
  const originZone2 = computeDtsQuote({
    originCity: "اصفهان", // zone2
    destinationCity: "مشهد", // zone3
    parcelType: "package",
    weightGrams: 5000,
  });
  const originZone3 = computeDtsQuote({
    originCity: "مشهد", // zone3
    destinationCity: "اصفهان", // zone2
    parcelType: "package",
    weightGrams: 5000,
  });
  assert.equal(originZone2.available, true);
  assert.equal(originZone3.available, true);
  if (originZone2.available && originZone3.available) {
    assert.equal(originZone2.price, 541200); // زون مبدا = ۲ (همان قبلی)
    assert.equal(originZone3.price, 657600); // زون مبدا = ۳ → (۵۴۸٬۰۰۰ + ۲۰٪ = ۶۵۷٬۶۰۰)
    assert.notEqual(originZone2.price, originZone3.price, "باید فقط زون مبدا اثر بگذارد، نه مقصد");
  }
});

// سناریوی (ج): وزن ۲۵ کیلوگرم — بالای ۲۰ کیلوگرم
test("(ج) وزن ۲۵ کیلوگرم (بالای ۲۰): ردیف ۲۰kg + نیم‌کیلوهای اضافه", () => {
  // تهران↔تهران (Zone1): ردیف ۲۰kg=۶۰۷٬۰۰۰، ۱۰ نیم‌کیلوی اضافه × ۱۳٬۰۰۰ = ۱۳۰٬۰۰۰ → جمع ۷۳۷٬۰۰۰
  const zone1 = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 25000,
  });
  assert.equal(zone1.available, true);
  if (zone1.available) assert.equal(zone1.price, 737000);

  // تبریز→اصفهان (Zone2 + ۲۰٪): ردیف ۲۰kg=۹۹۷٬۰۰۰ + ۱۰×۱۸٬۰۰۰=۱۸۰٬۰۰۰ → ۱٬۱۷۷٬۰۰۰؛ +۲۰٪=۲۳۵٬۴۰۰ → ۱٬۴۱۲٬۴۰۰
  const zone2 = computeDtsQuote({
    originCity: "تبریز",
    destinationCity: "اصفهان",
    parcelType: "package",
    weightGrams: 25000,
  });
  assert.equal(zone2.available, true);
  if (zone2.available) assert.equal(zone2.price, 1412400);
});

// سناریوی (د): شهری که در هیچ زونی نیست — باید غایب شود، نه خطا بدهد
test("(د) شهر پوشش‌داده‌نشده: available:false (بدون throw)، در هر سه حالت", () => {
  assert.doesNotThrow(() => {
    const r1 = computeDtsQuote({
      originCity: "یک‌شهر‌خیالی",
      destinationCity: "اصفهان",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r1.available, false, "مبدا ناشناخته در قانون ۴");

    const r2 = computeDtsQuote({
      originCity: "تهران",
      destinationCity: "شهر ناموجود",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r2.available, false, "مقصد ناشناخته وقتی مبدا تهران است (قانون ۳)");

    const r3 = computeDtsQuote({
      originCity: "الف",
      destinationCity: "ب",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r3.available, false, "هردو شهر ناشناخته");
  });
});

test("گرد کردن وزن به بالاترین پله‌ی نیم‌کیلویی", () => {
  // ۱.۲kg باید به ۱.۵kg گرد شود (نه ۱.۰kg)
  const r = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 1200,
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 175000);

  // درست روی مرز ۳.۰kg نباید به پله‌ی بعدی گرد شود
  const exact = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.equal(exact.available, true);
  if (exact.available) assert.equal(exact.price, 214000);
});

test("وزن کمتر از حداقل ردیف جدول (۱kg) با نرخ همان حداقل محاسبه می‌شود", () => {
  const r = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 100,
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 164000);
});

test("وزن نامعتبر/ناقص (پیش‌نمایش زنده) → available:false، بدون crash", () => {
  const tooLight = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
    weightGrams: 50,
  });
  assert.equal(tooLight.available, false);

  const missing = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
  });
  assert.equal(missing.available, false);
});

test("پاکت (envelope) با وزن ثابت ۵۰۰ گرم روی حداقل ردیف ۱kg قیمت می‌گیرد", () => {
  const r = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "envelope",
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 164000);
});

test("وزن بالای ۱۰۰ کیلوگرم (خارج از محدوده‌ی پشتیبانی‌شده) → available:false", () => {
  const overCap = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 150000,
  });
  assert.equal(overCap.available, false);

  // دقیقاً ۱۰۰ کیلوگرم باید هنوز پشتیبانی شود (مرز شامل است)
  const exactly100kg = computeDtsQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 100000,
  });
  assert.equal(exactly100kg.available, true);
  if (exactly100kg.available) assert.equal(exactly100kg.price, 2687000); // ۶۰۷٬۰۰۰ + ۱۶۰×۱۳٬۰۰۰
});
