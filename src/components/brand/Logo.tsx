import Image from "next/image";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

// نسبت ابعاد فایل اصلی لوگو: 438×249
const LOGO_ASPECT_RATIO = 438 / 249;

const sizeMap = {
  sm: 28,
  md: 40,
  lg: 56,
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  const height = sizeMap[size];
  const width = Math.round(height * LOGO_ASPECT_RATIO);

  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/brand/logo.webp"
        alt="بادرو"
        width={width}
        height={height}
        style={{ height, width: "auto" }}
        priority
      />
    </span>
  );
}
