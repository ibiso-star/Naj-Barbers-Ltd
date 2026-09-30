import { clsx } from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-accent-strong text-white hover:bg-[#256abf] border border-transparent",
  secondary: "bg-raised text-ink border border-line-strong hover:bg-hover",
  ghost: "text-ink-soft hover:text-ink hover:bg-hover border border-transparent",
  danger: "bg-transparent text-[#f08a8a] border border-line-strong hover:bg-[#2a1414] hover:border-critical",
};
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12.5px] gap-1.5",
  md: "h-8 px-3 text-[13px] gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Disables the button and shows a spinner while a request is in flight (PROD-028). */
  pending?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary", size = "md", pending = false, icon, className, children, disabled, type = "button", ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {pending ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
