"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dispatchHomeWizardReset } from "@/lib/home-wizard-reset";

/**
 * لینک «صفحه اصلی» در هدر. وقتی کاربر از قبل روی "/" است (مثلاً وسط ویزارد
 * پیک موتوری/ارسال پستی)، Link به همان صفحه ناوبری واقعی انجام نمی‌دهد،
 * پس به‌جای تکیه بر آن، دستی state ویزارد را ریست و صفحه را اسکرول بالا می‌کنیم.
 */
export function HomeNavLink({
  className,
  onNavigate,
  children,
}: {
  className?: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      dispatchHomeWizardReset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onNavigate?.();
  }

  return (
    <Link href="/" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
