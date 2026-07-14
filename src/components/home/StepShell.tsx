"use client";

import { Button } from "@/components/ui/Button";

export function StepShell({
  title,
  stepIndex,
  totalSteps,
  onBack,
  children,
}: {
  title: string;
  stepIndex: number;
  totalSteps: number;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-brand-blue-500" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="بازگشت"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      </div>

      {children}
    </div>
  );
}

export function NextButton({
  onClick,
  disabled,
  children = "بعدی",
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Button size="lg" onClick={onClick} disabled={disabled} className="mt-6 w-full sm:w-auto">
      {children}
    </Button>
  );
}
