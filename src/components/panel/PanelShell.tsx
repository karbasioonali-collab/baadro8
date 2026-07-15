"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

// توجه: icon باید یک عنصر رندرشده (JSX) باشد، نه ارجاع به خودِ کامپوننت —
// چون PanelShell کلاینت‌کامپوننت است و ارجاع تابع/کامپوننت را نمی‌توان از
// سرورکامپوننت‌های والد (لایوت‌های admin/panel/company) به آن پاس داد.
export type PanelNavItem = { href: string; label: string; icon?: React.ReactNode };

export function PanelShell({
  navItems,
  title,
  children,
  logoutAction,
}: {
  navItems: PanelNavItem[];
  title: string;
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" &&
            item.href !== "/panel" &&
            item.href !== "/company" &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-blue-500 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      <form action={logoutAction}>
        <button
          type="submit"
          className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
        >
          خروج
        </button>
      </form>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="hidden md:flex md:w-64 md:flex-col border-l border-neutral-200 bg-white shrink-0">
        <div className="p-4 border-b border-neutral-100">
          <Logo size="sm" />
        </div>
        {nav}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 h-14 md:hidden">
          <Logo size="sm" />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {mobileOpen && (
          <div className="md:hidden border-b border-neutral-200 bg-white">{nav}</div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          <h1 className="text-xl font-bold text-neutral-900 mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
