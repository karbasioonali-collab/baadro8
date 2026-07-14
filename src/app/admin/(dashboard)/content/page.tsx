import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployee } from "@/lib/auth/current-staff";
import {
  createSlideAction,
  toggleSlideActiveAction,
  deleteSlideAction,
  createEnvelopeTypeAction,
  toggleEnvelopeTypeActiveAction,
  deleteEnvelopeTypeAction,
  upsertCityDistanceAction,
  deleteCityDistanceAction,
} from "@/actions/admin/content";

export default async function AdminContentPage() {
  const current = await getCurrentEmployee();
  if (!current?.employee.isFullAdmin) redirect("/admin");

  const [slides, envelopeTypes, distanceIndex] = await Promise.all([
    prisma.homepageSlide.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.envelopeType.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.cityDistanceIndex.findMany({ orderBy: { cityName: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">اسلایدهای صفحه اصلی</h3>
        <form action={createSlideAction} className="grid gap-2 sm:grid-cols-5 mb-4">
          <input name="imageUrl" placeholder="آدرس تصویر" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm sm:col-span-2" dir="ltr" />
          <input name="title" placeholder="عنوان" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
          <input name="linkUrl" placeholder="لینک (اختیاری)" className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" dir="ltr" />
          <input name="orderIndex" type="number" placeholder="ترتیب" defaultValue={slides.length} className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
          <button className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white sm:col-span-5">
            + افزودن اسلاید
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {slides.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 text-sm">
              <span className="text-neutral-700">{s.title}</span>
              <div className="flex items-center gap-3">
                <form action={toggleSlideActiveAction.bind(null, s.id)}>
                  <button className={`rounded-full px-2.5 py-1 text-xs ${s.active ? "bg-brand-green-100 text-brand-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {s.active ? "فعال" : "غیرفعال"}
                  </button>
                </form>
                <form action={deleteSlideAction.bind(null, s.id)}>
                  <button className="text-danger text-xs">حذف</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-4">انواع پاکت</h3>
        <form action={createEnvelopeTypeAction} className="grid gap-2 sm:grid-cols-5 mb-4">
          <input name="name" placeholder="نام (مثلا پاکت نامه)" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm sm:col-span-2" />
          <input name="priceModifier" type="number" placeholder="افزوده قیمت (تومان)" defaultValue={0} className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" dir="ltr" />
          <input name="maxWeightKg" type="number" step="0.1" placeholder="حداکثر وزن (اختیاری)" className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" dir="ltr" />
          <input name="orderIndex" type="number" placeholder="ترتیب" defaultValue={envelopeTypes.length} className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
          <button className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white sm:col-span-5">
            + افزودن نوع پاکت
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {envelopeTypes.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-neutral-100 p-3 text-sm">
              <span className="text-neutral-700">{e.name}</span>
              <div className="flex items-center gap-3">
                <form action={toggleEnvelopeTypeActiveAction.bind(null, e.id)}>
                  <button className={`rounded-full px-2.5 py-1 text-xs ${e.active ? "bg-brand-green-100 text-brand-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {e.active ? "فعال" : "غیرفعال"}
                  </button>
                </form>
                <form action={deleteEnvelopeTypeAction.bind(null, e.id)}>
                  <button className="text-danger text-xs">حذف</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="font-semibold text-neutral-800 mb-1">شاخص فاصله شهرها</h3>
        <p className="text-xs text-neutral-400 mb-4">
          برای اضافه یا اصلاح فاصله تقریبی هر شهرستان از تهران (کیلومتر) استفاده می‌شود.
        </p>
        <form action={upsertCityDistanceAction} className="grid gap-2 sm:grid-cols-4 mb-4">
          <input name="cityName" placeholder="نام شهرستان" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
          <input name="province" placeholder="استان" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" />
          <input name="distanceFromCenterKm" type="number" placeholder="فاصله (کیلومتر)" required className="h-10 rounded-lg border border-neutral-200 px-3 text-sm" dir="ltr" />
          <button className="h-10 rounded-lg bg-brand-blue-500 px-4 text-sm font-medium text-white">
            ثبت / به‌روزرسانی
          </button>
        </form>
        <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
          {distanceIndex.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm">
              <span className="text-neutral-700">
                {d.cityName} ({d.province}) — {d.distanceFromCenterKm} کیلومتر
              </span>
              <form action={deleteCityDistanceAction.bind(null, d.id)}>
                <button className="text-danger text-xs">حذف</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
