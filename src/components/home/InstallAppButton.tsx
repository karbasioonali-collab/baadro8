"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const MESSAGE_ALREADY_INSTALLED = "قبلاً نصب شده";
const MESSAGE_UNSUPPORTED_BROWSER =
  "برای نصب از Safari گزینه اشتراک‌گذاری و افزودن به صفحه اصلی را بزنید";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true
    );
  });
  const [message, setMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  function showMessage(text: string) {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setMessage(text);
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 4000);
  }

  async function handleClick() {
    if (isInstalled) {
      showMessage(MESSAGE_ALREADY_INSTALLED);
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") setIsInstalled(true);
      return;
    }
    showMessage(MESSAGE_UNSUPPORTED_BROWSER);
  }

  return (
    <div className="my-6 text-center">
      <button
        type="button"
        onClick={handleClick}
        className="w-full sm:w-auto sm:min-w-[280px] rounded-2xl bg-brand-green-400 px-8 py-4 text-base font-bold text-white text-center hover:bg-brand-green-500 transition-colors shadow-sm shadow-brand-green-400/20 cursor-pointer"
      >
        نصب اپلیکیشن
      </button>
      <p
        className={clsx(
          "mt-2 min-h-[1rem] text-xs text-danger transition-opacity",
          message ? "opacity-100" : "opacity-0"
        )}
        aria-live="polite"
      >
        {message || " "}
      </p>
    </div>
  );
}
