type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-2xl" },
  lg: { icon: 44, text: "text-4xl" },
};

/**
 * لوگوی متنی موقت بادرو — یک Wordmark ساده با نماد باد/سرعت.
 * تا زمان طراحی لوگوی نهایی (SVG/PNG)، این کامپوننت جایگزین می‌شود.
 */
export function Logo({ className = "", size = "md" }: LogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center gap-2 select-none ${className}`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="20" fill="url(#badro-logo-gradient)" />
        <path
          d="M9 17.5C9 17.5 14 14 20 14C26 14 27.5 18.5 24 19.5C21.5 20.2 20 18 22 16.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 23C9 23 16 20 23.5 22C27 22.9 25.5 26.5 22.5 25.8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id="badro-logo-gradient"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#A8D8F0" />
            <stop offset="1" stopColor="#A8C86A" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`font-bold tracking-tight text-brand-blue-800 ${text}`}
      >
        بادرو
      </span>
    </span>
  );
}
