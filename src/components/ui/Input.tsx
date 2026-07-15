import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "h-11 rounded-xl border bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors",
            "focus:border-brand-blue-400 focus:ring-2 focus:ring-brand-blue-100",
            error ? "border-danger" : "border-brand-green-300",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
        {!error && hint && <span className="text-xs text-neutral-400">{hint}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
