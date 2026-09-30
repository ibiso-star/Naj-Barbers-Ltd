import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const controlClass =
  "w-full rounded-md border border-line-strong bg-canvas px-2.5 text-[13px] text-ink placeholder:text-ink-muted " +
  "transition-colors hover:border-[#52525b] focus:border-accent focus:outline-none aria-[invalid=true]:border-critical";

export function Field({
  label, htmlFor, error, hint, children, className,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-soft">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[12px] text-[#f08a8a]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlClass, "h-8", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(controlClass, "h-8 pr-7", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(controlClass, "min-h-24 resize-y py-2 leading-5", className)} {...rest} />;
}
