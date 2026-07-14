import { prisma } from "@/lib/prisma";
import { HomeSlider } from "@/components/home/HomeSlider";
import { PriceCalculatorForm } from "@/components/home/PriceCalculatorForm";

export default async function HomePage() {
  const [slides, envelopeTypes] = await Promise.all([
    prisma.homepageSlide.findMany({
      where: { active: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.envelopeType.findMany({
      where: { active: true },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
      {slides.length > 0 && (
        <div className="mb-8">
          <HomeSlider
            slides={slides.map((s) => ({
              id: s.id,
              imageUrl: s.imageUrl,
              title: s.title,
              description: s.description,
              linkUrl: s.linkUrl,
            }))}
          />
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900">
          ارزان‌ترین راه ارسال مرسوله را پیدا کنید
        </h1>
        <p className="mt-3 text-neutral-500 text-sm sm:text-base">
          مبدا، مقصد و مشخصات مرسوله را وارد کنید تا قیمت چند شرکت پستی و پیک را
          با هم مقایسه کنید.
        </p>
      </div>

      <PriceCalculatorForm
        envelopeTypes={envelopeTypes.map((e) => ({ id: e.id, name: e.name }))}
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <FeatureCard
          icon="⚡"
          title="مقایسه سریع"
          desc="در چند ثانیه قیمت چندین شرکت پستی و پیک را مقایسه کنید."
        />
        <FeatureCard
          icon="✓"
          title="بدون پرداخت آنلاین"
          desc="سفارش را ثبت کنید و تسویه را مستقیم با شرکت انجام دهید."
        />
        <FeatureCard
          icon="⌖"
          title="پیگیری آسان"
          desc="وضعیت مرسوله خود را در هر لحظه با کد رهگیری پیگیری کنید."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-blue-50 text-lg text-brand-blue-600">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-800">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-500 leading-6">{desc}</p>
    </div>
  );
}
