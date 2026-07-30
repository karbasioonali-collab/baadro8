import { z } from "zod";

/** تبدیل ارقام فارسی/عربی به انگلیسی */
export function toEnglishDigits(input: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const pIdx = persian.indexOf(ch);
    if (pIdx !== -1) return String(pIdx);
    const aIdx = arabic.indexOf(ch);
    if (aIdx !== -1) return String(aIdx);
    return ch;
  });
}

export const mobileSchema = z
  .string()
  .transform((v) => toEnglishDigits(v).trim())
  .refine((v) => /^09\d{9}$/.test(v), {
    message: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود",
  });

export const otpCodeSchema = z
  .string()
  .transform((v) => toEnglishDigits(v).trim())
  .refine((v) => /^\d{4,6}$/.test(v), { message: "کد وارد شده صحیح نیست" });

export const personNameSchema = z
  .string()
  .trim()
  .min(3, "نام باید حداقل ۳ حرف باشد")
  .refine((v) => /^[؀-ۿ\s]+$/.test(v), {
    message: "نام باید فقط شامل حروف فارسی باشد",
  });

export const postalCodeSchema = z
  .string()
  .transform((v) => toEnglishDigits(v).trim())
  .refine((v) => v === "" || /^\d{10}$/.test(v), {
    message: "کد پستی باید ۱۰ رقم باشد",
  })
  .optional();

export const addressSchema = z.object({
  province: z.string().min(1, "استان الزامی است"),
  city: z.string().min(1, "شهر الزامی است"),
  street: z.string().trim().min(3, "خیابان باید حداقل ۳ کاراکتر باشد"),
  alley: z.string().trim().optional(),
  plaque: z.string().trim().min(1, "پلاک الزامی است"),
  floor: z.string().trim().optional(),
  description: z.string().trim().max(200).optional(),
  postalCode: z
    .string()
    .transform((v) => toEnglishDigits(v ?? "").trim())
    .refine((v) => v === "" || /^\d{10}$/.test(v), {
      message: "کد پستی باید ۱۰ رقم باشد",
    })
    .optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const packageSchema = z.object({
  weightGrams: z
    .number({ message: "وزن الزامی است" })
    .min(100, "وزن باید حداقل ۱۰۰ گرم باشد")
    .max(50000, "وزن بسته نمی‌تواند بیشتر از ۵۰ کیلوگرم باشد"),
  lengthCm: z.number().int().min(1).max(200),
  widthCm: z.number().int().min(1).max(200),
  heightCm: z.number().int().min(1).max(200),
  itemNote: z.string().trim().max(200).optional(),
});

export function formatToman(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${n.toLocaleString("fa-IR")} تومان`;
}
