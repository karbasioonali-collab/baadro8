import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بادرو | مقایسه قیمت و ثبت سفارش ارسال مرسوله",
    short_name: "بادرو",
    description:
      "بادرو، پلتفرم مقایسه قیمت پستی بین‌شهری و پیک درون‌شهری در ایران.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#a8d8f0",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
