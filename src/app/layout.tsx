import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "بادرو | مقایسه قیمت و ثبت سفارش ارسال مرسوله",
    template: "%s | بادرو",
  },
  description:
    "بادرو، پلتفرم مقایسه قیمت پستی بین‌شهری و پیک درون‌شهری در ایران. ارزان‌ترین و سریع‌ترین روش ارسال مرسوله را پیدا کنید.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بادرو",
  },
};

export const viewport: Viewport = {
  themeColor: "#a8d8f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-foreground">
        <ServiceWorkerRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
