"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";

async function requireFullAdmin() {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) throw new Error("دسترسی غیرمجاز");
}

export async function createSlideAction(formData: FormData) {
  await requireFullAdmin();
  await prisma.homepageSlide.create({
    data: {
      imageUrl: String(formData.get("imageUrl") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      linkUrl: String(formData.get("linkUrl") ?? "") || null,
      orderIndex: Number(formData.get("orderIndex") ?? 0),
    },
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function toggleSlideActiveAction(id: string) {
  await requireFullAdmin();
  const slide = await prisma.homepageSlide.findUnique({ where: { id } });
  if (!slide) return;
  await prisma.homepageSlide.update({ where: { id }, data: { active: !slide.active } });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteSlideAction(id: string) {
  await requireFullAdmin();
  await prisma.homepageSlide.delete({ where: { id } });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function createEnvelopeTypeAction(formData: FormData) {
  await requireFullAdmin();
  await prisma.envelopeType.create({
    data: {
      name: String(formData.get("name") ?? ""),
      priceModifier: Number(formData.get("priceModifier") ?? 0),
      maxWeightKg: formData.get("maxWeightKg") ? Number(formData.get("maxWeightKg")) : null,
      orderIndex: Number(formData.get("orderIndex") ?? 0),
    },
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function toggleEnvelopeTypeActiveAction(id: string) {
  await requireFullAdmin();
  const item = await prisma.envelopeType.findUnique({ where: { id } });
  if (!item) return;
  await prisma.envelopeType.update({ where: { id }, data: { active: !item.active } });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function deleteEnvelopeTypeAction(id: string) {
  await requireFullAdmin();
  await prisma.envelopeType.delete({ where: { id } });
  revalidatePath("/admin/content");
  revalidatePath("/");
}

export async function upsertCityDistanceAction(formData: FormData) {
  await requireFullAdmin();
  const cityName = String(formData.get("cityName") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const distanceFromCenterKm = Number(formData.get("distanceFromCenterKm") ?? 0);

  if (!cityName) return;

  await prisma.cityDistanceIndex.upsert({
    where: { cityName },
    update: { province, distanceFromCenterKm },
    create: { cityName, province, distanceFromCenterKm },
  });
  revalidatePath("/admin/content");
}

export async function deleteCityDistanceAction(id: string) {
  await requireFullAdmin();
  await prisma.cityDistanceIndex.delete({ where: { id } });
  revalidatePath("/admin/content");
}
