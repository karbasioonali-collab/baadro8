"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import { hashPassword } from "@/lib/auth/password";

const formulaSchema = z.object({
  basePrice: z.number().min(0),
  pricePerKg: z.number().min(0),
  pricePerKm: z.number().min(0),
});

const tieredSchema = z.object({
  weightTiers: z
    .array(
      z.object({ minWeight: z.number().min(0), maxWeight: z.number().min(0), price: z.number().min(0) })
    )
    .min(1),
  distanceFactors: z
    .array(
      z.object({ minDistance: z.number().min(0), maxDistance: z.number().min(0), factor: z.number().min(0) })
    )
    .min(1),
});

// برای pricingSourceType = page_automation — با Playwright واقعاً اجرا می‌شود
// (src/lib/pricing/page-automation-provider.ts).
const automationConfigSchema = z.object({
  url: z.string().trim().optional(),
  fieldSelectors: z.object({
    origin: z.string().trim().optional(),
    destination: z.string().trim().optional(),
    weight: z.string().trim().optional(),
    declaredValue: z.string().trim().optional(),
    length: z.string().trim().optional(),
    width: z.string().trim().optional(),
    height: z.string().trim().optional(),
    contentType: z.string().trim().optional(),
  }),
  contentTypeValue: z.string().trim().optional(),
  weightUnit: z.enum(["kg", "gram"]).optional(),
  checkboxSelectors: z.array(z.string().trim()).optional(),
  extraStaticFields: z
    .array(z.object({ selector: z.string().trim(), value: z.string().trim() }))
    .optional(),
  submitSelector: z.string().trim().optional(),
  resultSelector: z.string().trim().optional(),
});

const companyInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "نام شرکت الزامی است"),
  logoUrl: z.string().trim().optional(),
  type: z.enum(["intercity", "intracity"]),
  active: z.boolean(),
  commissionType: z.enum(["percent", "fixed"]),
  commissionValue: z.number().min(0),
  contractInfo: z.string().trim().optional(),
  trackingMethod: z.enum(["internal", "external_url", "api"]),
  trackingEndpoint: z.string().trim().optional(),
  pricingSourceType: z.enum(["internal_formula", "external_api", "page_automation"]),
  coveredCities: z.array(z.string().trim()).optional(),
  ruleType: z.enum(["formula", "tiered"]),
  formulaParams: formulaSchema.optional(),
  tiers: tieredSchema.optional(),
  apiBaseUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  automationConfig: automationConfigSchema.optional(),
  username: z.string().trim().min(3, "نام کاربری باید حداقل ۳ حرف باشد"),
  password: z.string().optional(),
});

export type CompanyFormInput = z.infer<typeof companyInputSchema>;
export type SaveCompanyResult = { ok: boolean; error?: string; id?: string };

export async function saveCompanyAction(
  input: CompanyFormInput
): Promise<SaveCompanyResult> {
  const current = await getCurrentEmployee();
  if (!current) return { ok: false, error: "دسترسی غیرمجاز" };

  const action = input.id ? "edit" : "edit"; // ایجاد و ویرایش هر دو نیاز به دسترسی edit دارند
  if (!current.can("companies", "edit") && !current.can("pricing", "edit")) {
    return { ok: false, error: "شما دسترسی ویرایش این بخش را ندارید" };
  }
  void action;

  const parsed = companyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است" };
  }
  const data = parsed.data;

  // شرکت جدید، یا شرکتی که هنوز هیچ CompanyAccount ای ندارد (مثلاً از قبل seed/دستی
  // ساخته شده) — در هر دو حالت رمز عبور اجباری است چون رمز قبلی‌ای برای نگه‌داشتن نیست.
  const existingAccount = data.id
    ? await prisma.companyAccount.findFirst({ where: { companyId: data.id } })
    : null;

  if (!existingAccount && (!data.password || data.password.length < 4)) {
    return { ok: false, error: "رمز عبور باید حداقل ۴ کاراکتر باشد" };
  }

  const usernameTaken = await prisma.companyAccount.findFirst({
    where: {
      username: data.username,
      ...(existingAccount ? { id: { not: existingAccount.id } } : {}),
    },
  });
  if (usernameTaken) {
    return { ok: false, error: "این نام کاربری قبلاً استفاده شده است" };
  }

  const company = await prisma.$transaction(async (tx) => {
    const saved = data.id
      ? await tx.company.update({
          where: { id: data.id },
          data: {
            name: data.name,
            logoUrl: data.logoUrl || null,
            type: data.type,
            active: data.active,
            commissionType: data.commissionType,
            commissionValue: data.commissionValue,
            contractInfo: data.contractInfo || null,
            trackingMethod: data.trackingMethod,
            trackingEndpoint: data.trackingEndpoint || null,
            pricingSourceType: data.pricingSourceType,
            apiBaseUrl: data.apiBaseUrl || null,
            apiKey: data.apiKey || null,
          },
        })
      : await tx.company.create({
          data: {
            name: data.name,
            logoUrl: data.logoUrl || null,
            type: data.type,
            active: data.active,
            commissionType: data.commissionType,
            commissionValue: data.commissionValue,
            contractInfo: data.contractInfo || null,
            trackingMethod: data.trackingMethod,
            trackingEndpoint: data.trackingEndpoint || null,
            pricingSourceType: data.pricingSourceType,
            apiBaseUrl: data.apiBaseUrl || null,
            apiKey: data.apiKey || null,
          },
        });

    await tx.coveredCity.deleteMany({ where: { companyId: saved.id } });
    if (data.type === "intracity" && data.coveredCities?.length) {
      await tx.coveredCity.createMany({
        data: data.coveredCities
          .filter(Boolean)
          .map((cityName) => ({ companyId: saved.id, cityName })),
        skipDuplicates: true,
      });
    }

    if (data.pricingSourceType === "internal_formula") {
      const existingRule = await tx.pricingRule.findFirst({
        where: { companyId: saved.id, sourceType: "internal_formula" },
      });

      const ruleData = {
        ruleType: data.ruleType,
        formulaParams: data.ruleType === "formula" ? (data.formulaParams as object) : undefined,
        tiers: data.ruleType === "tiered" ? (data.tiers as object) : undefined,
      };

      if (existingRule) {
        await tx.pricingRule.update({
          where: { id: existingRule.id },
          data: ruleData,
        });
      } else {
        await tx.pricingRule.create({
          data: { companyId: saved.id, sourceType: "internal_formula", ...ruleData },
        });
      }
    }

    if (data.pricingSourceType === "page_automation") {
      const existingAutomationRule = await tx.pricingRule.findFirst({
        where: { companyId: saved.id, sourceType: "page_automation" },
      });

      const automationRuleData = {
        // ruleType برای این نوع رول معنا ندارد (نه فرمول ریاضیه نه پله‌ای)؛ فقط
        // چون ستون NOT NULL است یک مقدار پیش‌فرض بی‌اثر می‌گذاریم.
        ruleType: "formula" as const,
        formulaParams: (data.automationConfig ?? {
          url: "",
          fieldSelectors: {
            origin: "",
            destination: "",
            weight: "",
            declaredValue: "",
            length: "",
            width: "",
            height: "",
            contentType: "",
          },
          contentTypeValue: "",
          weightUnit: "kg",
          checkboxSelectors: [],
          extraStaticFields: [],
          submitSelector: "",
          resultSelector: "",
        }) as object,
      };

      if (existingAutomationRule) {
        await tx.pricingRule.update({
          where: { id: existingAutomationRule.id },
          data: automationRuleData,
        });
      } else {
        await tx.pricingRule.create({
          data: { companyId: saved.id, sourceType: "page_automation", ...automationRuleData },
        });
      }
    }

    if (existingAccount) {
      await tx.companyAccount.update({
        where: { id: existingAccount.id },
        data: {
          username: data.username,
          ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
        },
      });
    } else {
      await tx.companyAccount.create({
        data: {
          companyId: saved.id,
          username: data.username,
          passwordHash: await hashPassword(data.password!),
        },
      });
    }

    return saved;
  });

  revalidatePath("/admin/companies");
  return { ok: true, id: company.id };
}

export async function toggleCompanyActiveAction(id: string): Promise<SaveCompanyResult> {
  const current = await getCurrentEmployee();
  if (!current || !current.can("companies", "edit")) {
    return { ok: false, error: "دسترسی غیرمجاز" };
  }

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return { ok: false, error: "شرکت یافت نشد" };

  await prisma.company.update({ where: { id }, data: { active: !company.active } });
  revalidatePath("/admin/companies");
  return { ok: true };
}
