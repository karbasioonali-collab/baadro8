"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export type Slide = {
  id: string;
  imageUrl: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
};

export function HomeSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl"
      dir="ltr"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide) => {
          // اسلایدها طرح کامل و آماده‌اند (عنوان/توضیح داخل خودِ تصویر پخته
          // شده)، پس دیگر رنگ‌آمیزی/اسکریم تیره/متن جدا روی تصویر گذاشته
          // نمی‌شود — فقط خودِ تصویر تمیز نمایش داده می‌شود. عنوان همچنان
          // به‌عنوان aria-label برای screen reader نگه داشته شده.
          //
          // backgroundSize عمداً «contain» است، نه «cover»: اسلایدها همیشه
          // نسبت تصویر یکسان ندارند (مثلاً یکی ۲.۷۶:۱ در برابر ۴:۱ بقیه)،
          // و «cover» هر تصویری را برای پر کردن کل کادر می‌برد. «contain»
          // تضمین می‌کند هیچ‌وقت چیزی از تصویر بریده نشود، صرف‌نظر از نسبتش؛
          // فضای خالی احتمالی (letterbox) با رنگ روشن هم‌خانواده‌ی پس‌زمینه‌ی
          // خودِ اسلایدها (آبی خیلی روشن) پر می‌شود تا محسوس نباشد.
          const content = (
            <div
              className="relative h-44 sm:h-64 w-full shrink-0 bg-brand-blue-50"
              role="img"
              aria-label={slide.title}
              style={{
                backgroundImage: `url(${slide.imageUrl})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          );

          return (
            <div key={slide.id} className="w-full shrink-0" style={{ minWidth: "100%" }}>
              {slide.linkUrl ? <Link href={slide.linkUrl}>{content}</Link> : content}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`اسلاید ${i + 1}`}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
