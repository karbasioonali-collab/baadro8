import Link from "next/link";
import { ShieldCheck, BadgeCheck, Award } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

// نمادها/مجوزهای رسمی سایت — لینک هرکدام بعداً که مجوز واقعی صادر شد تکمیل می‌شود
const licenseBadges = [
  { label: "نماد اعتماد الکترونیکی", href: "", Icon: ShieldCheck },
  { label: "ساماندهی رسانه‌ها و کسب‌وکارهای دیجیتال", href: "", Icon: BadgeCheck },
  { label: "مجوز فعالیت", href: "", Icon: Award },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <Logo size="sm" />
          <p className="mt-3 text-sm text-neutral-500 leading-6">
            بادرو، پلتفرم مقایسه قیمت و ثبت سفارش ارسال مرسوله در سراسر ایران.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-3">
            دسترسی سریع
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/about" className="hover:text-brand-blue-600">
                درباره ما
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand-blue-600">
                تماس با ما
              </Link>
            </li>
            <li>
              <Link href="/tracking" className="hover:text-brand-blue-600">
                پیگیری مرسوله
              </Link>
            </li>
            <li>
              <Link href="/rules" className="hover:text-brand-blue-600">
                قوانین و مقررات
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-3">
            پنل‌ها
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/panel" className="hover:text-brand-blue-600">
                پنل کاربری
              </Link>
            </li>
            <li>
              <Link href="/company/login" className="hover:text-brand-blue-600">
                ورود شرکت‌های طرف قرارداد
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-brand-blue-600">
                ورود ادمین
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-4">
          {licenseBadges.map(({ label, href, Icon }) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="flex size-16 flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:border-brand-blue-300 hover:text-brand-blue-600 transition-colors"
              >
                <Icon className="size-6" strokeWidth={1.6} />
              </a>
            ) : (
              <span
                key={label}
                title={`${label} — به‌زودی`}
                className="flex size-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-neutral-300"
              >
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
            )
          )}
        </div>
      </div>

      <div className="border-t border-neutral-100 py-4 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} تمام حقوق برای بادرو محفوظ است.
      </div>
    </footer>
  );
}
