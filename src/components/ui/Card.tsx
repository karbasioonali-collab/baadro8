import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-neutral-200 bg-white shadow-sm shadow-neutral-900/[0.03]",
        className
      )}
      {...props}
    />
  );
}
