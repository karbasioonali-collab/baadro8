import Script from "next/script";

/** Measurement ID واقعی GA4 بادرو — این مقدار یک شناسه‌ی عمومی است (در خودِ HTML صفحه هم دیده می‌شود)، نه یک راز، پس نیازی به متغیر محیطی ندارد. */
const GA_MEASUREMENT_ID = "G-G0BTDH4BHP";

/**
 * فقط pageview استاندارد GA4 (gtag.js) — بدون ارسال هیچ داده‌ی شخصی/حساس
 * کاربر (شماره موبایل، آدرس، مبلغ سفارش و...)؛ هیچ event دستی دیگری از
 * اینجا فرستاده نمی‌شود. فقط در production فعال است تا ترافیک توسعه/
 * پیش‌نمایش محلی آمار واقعی GA را خراب نکند (همان الگوی ServiceWorkerRegister).
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
