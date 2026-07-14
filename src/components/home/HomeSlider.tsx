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
          const content = (
            <div
              className="relative h-44 sm:h-64 w-full shrink-0 flex items-center px-6 sm:px-12"
              style={{
                backgroundImage: `linear-gradient(120deg, var(--color-brand-blue-300), var(--color-brand-green-300)), url(${slide.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: "overlay",
              }}
            >
              <div className="max-w-lg text-white" dir="rtl">
                <h2 className="text-xl sm:text-3xl font-bold drop-shadow-sm">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="mt-2 text-sm sm:text-base opacity-95 drop-shadow-sm">
                    {slide.description}
                  </p>
                )}
              </div>
            </div>
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
