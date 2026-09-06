import { test } from "node:test";
import assert from "node:assert/strict";
import { computePostPishtazQuote } from "./post-pishtaz-provider";
import { POST_PISHTAZ_COMPANY_ID, findPostPishtazZoneForCity } from "./post-pishtaz-data";

test("POST_PISHTAZ_COMPANY_ID مطابق شناسه‌ی داده‌شده است", () => {
  assert.equal(POST_PISHTAZ_COMPANY_ID, "cmtq4bieq00000ml3fvmtuv3");
});

test("زون‌یابی شهرها + یکسان‌سازی نام (فاصله/ي-ی عربی/پیشوند)", () => {
  assert.equal(findPostPishtazZoneForCity("تهران"), 1);
  assert.equal(findPostPishtazZoneForCity("تبریز"), 2);
  assert.equal(findPostPishtazZoneForCity("مشهد"), 3);
  assert.equal(findPostPishtazZoneForCity("بندرعباس"), 4);
  assert.equal(findPostPishtazZoneForCity("کیش"), 5);
  assert.equal(
    findPostPishtazZoneForCity("شهرستان تبريز"),
    2,
    "پیشوند «شهرستان» + ي عربی باید نادیده گرفته شود"
  );
  assert.equal(findPostPishtazZoneForCity("  تهران  "), 1, "فاصله‌های اضافه باید نادیده گرفته شود");
  assert.equal(findPostPishtazZoneForCity("یک شهر ناموجود"), null);
});

// سناریوی ۱: تهران↔غیرتهران — بدون افزایش
test("تهران→تبریز، ۳کیلوگرم: قیمت زون تبریز بدون افزایش", () => {
  const r = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.equal(r.available, true);
  if (r.available) {
    assert.equal(r.price, 215000); // ردیف ۳.۰kg، ستون Zone2
    assert.equal(r.breakdown["افزایش_مبدا_غیرتهران_۲۰_درصد"], undefined);
  }

  // جهت برعکس (مقصد تهران) باید همان نتیجه را بدهد — قانون به مبدا/مقصد بی‌تفاوت است
  const reversed = computePostPishtazQuote({
    originCity: "تبریز",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.deepEqual(reversed, r);
});

// سناریوی ۲: غیرتهران↔غیرتهران — زون مبدا + ۲۰٪
test("تبریز→اصفهان (هردو غیرتهران)، ۵کیلوگرم: زون مبدا + ۲۰٪", () => {
  const r = computePostPishtazQuote({
    originCity: "تبریز",
    destinationCity: "اصفهان",
    parcelType: "package",
    weightGrams: 5000,
  });
  assert.equal(r.available, true);
  if (r.available) {
    // ردیف ۵.۰kg، ستون Zone2 = ۳۱۵٬۰۰۰؛ ۲۰٪ = ۶۳٬۰۰۰؛ جمع = ۳۷۸٬۰۰۰
    assert.equal(r.breakdown["قیمت_پایه_زون"], 315000);
    assert.equal(r.breakdown["افزایش_مبدا_غیرتهران_۲۰_درصد"], 63000);
    assert.equal(r.price, 378000);
  }

  // باید فقط زون *مبدا* اثر بگذارد، نه مقصد
  const originZone2 = computePostPishtazQuote({
    originCity: "اصفهان", // zone2
    destinationCity: "مشهد", // zone3
    parcelType: "package",
    weightGrams: 5000,
  });
  const originZone3 = computePostPishtazQuote({
    originCity: "مشهد", // zone3
    destinationCity: "اصفهان", // zone2
    parcelType: "package",
    weightGrams: 5000,
  });
  assert.equal(originZone2.available, true);
  assert.equal(originZone3.available, true);
  if (originZone2.available && originZone3.available) {
    assert.equal(originZone2.price, 378000);
    assert.notEqual(originZone2.price, originZone3.price, "باید فقط زون مبدا اثر بگذارد، نه مقصد");
  }
});

// سناریوی ۳: وزن بالای ۲۰ کیلوگرم
test("وزن ۲۵ کیلوگرم (بالای ۲۰): ردیف ۲۰kg + نیم‌کیلوهای اضافه", () => {
  // تهران↔تهران (Zone1): ردیف ۲۰kg=۵۴۹٬۰۰۰، ۱۰ نیم‌کیلوی اضافه × ۱۰٬۴۰۰ = ۱۰۴٬۰۰۰ → جمع ۶۵۳٬۰۰۰
  const zone1 = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 25000,
  });
  assert.equal(zone1.available, true);
  if (zone1.available) assert.equal(zone1.price, 653000);

  // تبریز→اصفهان (Zone2 + ۲۰٪): ردیف ۲۰kg=۱٬۰۶۵٬۰۰۰ + ۱۰×۱۴٬۴۰۰=۱۴۴٬۰۰۰ → ۱٬۲۰۹٬۰۰۰؛ +۲۰٪=۲۴۱٬۸۰۰ → ۱٬۴۵۰٬۸۰۰
  const zone2 = computePostPishtazQuote({
    originCity: "تبریز",
    destinationCity: "اصفهان",
    parcelType: "package",
    weightGrams: 25000,
  });
  assert.equal(zone2.available, true);
  if (zone2.available) assert.equal(zone2.price, 1450800);
});

// سناریوی ۴: شهری که در هیچ زونی نیست
test("شهر پوشش‌داده‌نشده: available:false (بدون throw)، در هر سه حالت", () => {
  assert.doesNotThrow(() => {
    const r1 = computePostPishtazQuote({
      originCity: "یک‌شهر‌خیالی",
      destinationCity: "اصفهان",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r1.available, false, "مبدا ناشناخته در قانون ۴");

    const r2 = computePostPishtazQuote({
      originCity: "تهران",
      destinationCity: "شهر ناموجود",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r2.available, false, "مقصد ناشناخته وقتی مبدا تهران است (قانون ۳)");

    const r3 = computePostPishtazQuote({
      originCity: "الف",
      destinationCity: "ب",
      parcelType: "package",
      weightGrams: 3000,
    });
    assert.equal(r3.available, false, "هردو شهر ناشناخته");
  });
});

test("گرد کردن وزن به بالاترین پله‌ی نیم‌کیلویی", () => {
  const r = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 1200,
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 94200); // ۱.۲kg → ۱.۵kg

  const exact = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 3000,
  });
  assert.equal(exact.available, true);
  if (exact.available) assert.equal(exact.price, 141000);
});

test("وزن کمتر از حداقل ردیف جدول (۱kg) با نرخ همان حداقل محاسبه می‌شود", () => {
  const r = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 100,
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 93000);
});

test("وزن نامعتبر/ناقص (پیش‌نمایش زنده) → available:false، بدون crash", () => {
  const tooLight = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
    weightGrams: 50,
  });
  assert.equal(tooLight.available, false);

  const missing = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تبریز",
    parcelType: "package",
  });
  assert.equal(missing.available, false);
});

test("پاکت (envelope) با وزن ثابت ۵۰۰ گرم روی حداقل ردیف ۱kg قیمت می‌گیرد", () => {
  const r = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "envelope",
  });
  assert.equal(r.available, true);
  if (r.available) assert.equal(r.price, 93000);
});

test("وزن بالای ۱۰۰ کیلوگرم (خارج از محدوده‌ی پشتیبانی‌شده) → available:false", () => {
  const overCap = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 150000,
  });
  assert.equal(overCap.available, false);

  const exactly100kg = computePostPishtazQuote({
    originCity: "تهران",
    destinationCity: "تهران",
    parcelType: "package",
    weightGrams: 100000,
  });
  assert.equal(exactly100kg.available, true);
  if (exactly100kg.available) assert.equal(exactly100kg.price, 2213000); // ۵۴۹٬۰۰۰ + ۱۶۰×۱۰٬۴۰۰
});
