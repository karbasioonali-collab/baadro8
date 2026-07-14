"use client";

import { useState } from "react";
import Link from "next/link";

export function HeaderMobileMenu({
  items,
  isLoggedIn,
}: {
  items: { href: string; label: string }[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="منو"
        className="flex size-10 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-neutral-200 bg-white p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/panel" : "/login"}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-brand-blue-500 px-3.5 py-2.5 text-center text-sm font-medium text-white"
            >
              {isLoggedIn ? "پنل کاربری" : "ورود / ثبت‌نام"}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
