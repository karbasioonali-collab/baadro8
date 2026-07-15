import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { getCustomerSession } from "@/lib/auth/session";
import { HeaderMobileMenu } from "./HeaderMobileMenu";

const navItems = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/tracking", label: "پیگیری مرسوله" },
  { href: "/rules", label: "قوانین و مقررات" },
];

export async function Header() {
  const session = await getCustomerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href="/panel"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-brand-blue-50 px-4 py-2 text-sm font-medium text-brand-blue-800 hover:bg-brand-blue-100 transition-colors"
            >
              پنل کاربری
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-brand-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-600 transition-colors"
            >
              ورود / ثبت‌نام
            </Link>
          )}
          <HeaderMobileMenu items={navItems} isLoggedIn={!!session} />
        </div>
      </div>
    </header>
  );
}
