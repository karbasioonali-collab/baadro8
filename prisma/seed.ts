import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { IRAN_PROVINCES } from "../src/lib/iran-locations";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL?.trim().replace(/^['"]|['"]$/g, "");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedCityDistanceIndex() {
  console.log("در حال ثبت شاخص فاصله شهرها...");
  for (const province of IRAN_PROVINCES) {
    for (const city of province.cities) {
      await prisma.cityDistanceIndex.upsert({
        where: { cityName: city.name },
        update: { province: province.name, distanceFromCenterKm: city.distanceFromTehranKm },
        create: {
          cityName: city.name,
          province: province.name,
          distanceFromCenterKm: city.distanceFromTehranKm,
        },
      });
    }
  }
}

async function seedEnvelopeTypes() {
  console.log("در حال ثبت انواع پاکت...");
  const items = [
    { name: "پاکت نامه", priceModifier: 0, maxWeightKg: 0.2, orderIndex: 0 },
    { name: "پاکت اسناد A4", priceModifier: 5000, maxWeightKg: 0.5, orderIndex: 1 },
    { name: "پاکت بزرگ", priceModifier: 10000, maxWeightKg: 1, orderIndex: 2 },
  ];
  for (const item of items) {
    const existing = await prisma.envelopeType.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.envelopeType.create({ data: item });
  }
}

async function seedHomepageSlides() {
  console.log("در حال ثبت/به‌روزرسانی اسلایدهای صفحه اصلی...");

  // توجه: upsert بر اساس orderIndex انجام می‌شود (نه عنوان، چون عنوان هم ممکن
  // است در همین فایل عوض شود) تا با هر تغییر تصویر/متن یک اسلاید، همان ردیف
  // موجود در دیتابیس‌های از قبل seed‌شده (مثل production) روی هر دیپلوی جدید
  // به‌روز شود، نه اینکه به‌خاطر خالی نبودن جدول کلاً نادیده گرفته شود.
  const slides = [
    {
      imageUrl: "/slides/slide-1-intro.png",
      title: "ارسال مرسوله، ساده و مطمئن",
      description: "قیمت چند شرکت پستی و پیک را در چند ثانیه مقایسه کنید",
      orderIndex: 0,
    },
    {
      imageUrl: "/slides/slide-2-price.png",
      title: "مقایسه قیمت در چند ثانیه",
      description: "ارزان‌ترین گزینه بین چندین شرکت پستی و پیک را پیدا کنید",
      orderIndex: 1,
    },
    {
      imageUrl: "/slides/slide-3-postal-flight.png",
      title: "ارسال بین‌شهری به سراسر ایران",
      description: "با شبکه‌ای از شرکت‌های پستی و باربری معتبر، مرسوله شما به هر نقطه از ایران می‌رسد",
      orderIndex: 2,
    },
  ];

  for (const slide of slides) {
    const existing = await prisma.homepageSlide.findFirst({ where: { orderIndex: slide.orderIndex } });
    if (existing) {
      await prisma.homepageSlide.update({ where: { id: existing.id }, data: slide });
    } else {
      await prisma.homepageSlide.create({ data: slide });
    }
  }
}

async function seedCompanies() {
  console.log("در حال ثبت شرکت‌های نمونه...");

  const intercityCompanies = [
    {
      name: "آزما پست",
      commissionValue: 12,
      formula: { basePrice: 50000, pricePerKg: 8000, pricePerKm: 150 },
    },
    {
      name: "پیک تیز پرواز",
      commissionValue: 10,
      formula: { basePrice: 45000, pricePerKg: 7000, pricePerKm: 130 },
    },
    {
      name: "پست ایرانیان",
      commissionValue: 8,
      formula: { basePrice: 40000, pricePerKg: 6500, pricePerKm: 110 },
    },
    {
      name: "باربری سبزان",
      commissionValue: 15,
      formula: { basePrice: 55000, pricePerKg: 9000, pricePerKm: 170 },
    },
  ];

  for (const c of intercityCompanies) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    const company =
      existing ??
      (await prisma.company.create({
        data: {
          name: c.name,
          type: "intercity",
          active: true,
          pricingSourceType: "internal_formula",
          commissionType: "percent",
          commissionValue: c.commissionValue,
          trackingMethod: "internal",
        },
      }));

    const existingRule = await prisma.pricingRule.findFirst({
      where: { companyId: company.id, sourceType: "internal_formula" },
    });
    if (!existingRule) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          sourceType: "internal_formula",
          ruleType: "formula",
          formulaParams: c.formula,
        },
      });
    }
  }

  // شرکت نمونه با جدول پله‌ای (طبق مثال ۲ سند نیازمندی)
  const tieredCompanyName = "تندرو باربری";
  let tieredCompany = await prisma.company.findFirst({ where: { name: tieredCompanyName } });
  if (!tieredCompany) {
    tieredCompany = await prisma.company.create({
      data: {
        name: tieredCompanyName,
        type: "intercity",
        active: true,
        pricingSourceType: "internal_formula",
        commissionType: "percent",
        commissionValue: 11,
        trackingMethod: "internal",
      },
    });
  }
  const existingTieredRule = await prisma.pricingRule.findFirst({
    where: { companyId: tieredCompany.id, sourceType: "internal_formula" },
  });
  if (!existingTieredRule) {
    await prisma.pricingRule.create({
      data: {
        companyId: tieredCompany.id,
        sourceType: "internal_formula",
        ruleType: "tiered",
        tiers: {
          weightTiers: [
            { minWeight: 0, maxWeight: 5, price: 60000 },
            { minWeight: 5, maxWeight: 10, price: 90000 },
            { minWeight: 10, maxWeight: 20, price: 130000 },
            { minWeight: 20, maxWeight: 50, price: 200000 },
          ],
          distanceFactors: [
            { minDistance: 0, maxDistance: 500, factor: 1.0 },
            { minDistance: 500, maxDistance: 1000, factor: 1.3 },
            { minDistance: 1000, maxDistance: 100000, factor: 1.6 },
          ],
        },
      },
    });
  }

  // شرکت‌های پیک درون‌شهری
  const intracityCities = ["تهران", "مشهد", "اصفهان", "شیراز", "تبریز"];
  const intracityCompanies = [
    { name: "پیک شهر", commissionValue: 15, formula: { basePrice: 25000, pricePerKg: 3000, pricePerKm: 0 } },
    { name: "پیک برق‌آسا", commissionValue: 12, formula: { basePrice: 22000, pricePerKg: 2500, pricePerKm: 0 } },
    { name: "پیک سریع شهری", commissionValue: 13, formula: { basePrice: 28000, pricePerKg: 3500, pricePerKm: 0 } },
  ];

  for (const c of intracityCompanies) {
    let company = await prisma.company.findFirst({ where: { name: c.name } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: c.name,
          type: "intracity",
          active: true,
          pricingSourceType: "internal_formula",
          commissionType: "percent",
          commissionValue: c.commissionValue,
          trackingMethod: "internal",
        },
      });
    }

    await prisma.coveredCity.deleteMany({ where: { companyId: company.id } });
    await prisma.coveredCity.createMany({
      data: intracityCities.map((cityName) => ({ companyId: company!.id, cityName })),
    });

    const existingRule = await prisma.pricingRule.findFirst({
      where: { companyId: company.id, sourceType: "internal_formula" },
    });
    if (!existingRule) {
      await prisma.pricingRule.create({
        data: {
          companyId: company.id,
          sourceType: "internal_formula",
          ruleType: "formula",
          formulaParams: c.formula,
        },
      });
    }
  }

  return { intercityCompanies, tieredCompany, intracityCompanies };
}

async function seedStaffAndCompanyAccounts() {
  console.log("در حال ساخت حساب‌های تستی...");

  const adminExists = await prisma.employee.findUnique({ where: { username: "admin" } });
  if (!adminExists) {
    await prisma.employee.create({
      data: {
        name: "ادمین اصلی بادرو",
        mobile: "09120000000",
        username: "admin",
        passwordHash: await bcrypt.hash("badro@admin1404", 10),
        isFullAdmin: true,
        active: true,
      },
    });
    console.log("  کاربر ادمین ساخته شد → username: admin / password: badro@admin1404");
  }

  const firstCompany = await prisma.company.findFirst({ where: { name: "آزما پست" } });
  if (firstCompany) {
    const accountExists = await prisma.companyAccount.findUnique({
      where: { username: "azma-post" },
    });
    if (!accountExists) {
      await prisma.companyAccount.create({
        data: {
          companyId: firstCompany.id,
          username: "azma-post",
          passwordHash: await bcrypt.hash("azma@1404", 10),
          active: true,
        },
      });
      console.log("  حساب شرکت «آزما پست» ساخته شد → username: azma-post / password: azma@1404");
    }
  }
}

async function main() {
  await seedCityDistanceIndex();
  await seedEnvelopeTypes();
  await seedHomepageSlides();
  await seedCompanies();
  await seedStaffAndCompanyAccounts();
  console.log("seed کامل شد ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
