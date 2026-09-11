import Link from "next/link";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gold text-navy hover:bg-gold-light focus-visible:outline-gold",
  secondary:
    "bg-navy text-white hover:bg-navy-light focus-visible:outline-navy",
  outline:
    "border border-navy text-navy hover:bg-navy hover:text-white focus-visible:outline-navy",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", className, children, ...rest } = props;
  const classes = clsx(BASE_CLASSES, VARIANT_CLASSES[variant], className);

  if ("href" in rest && rest.href) {
    const { href, target, rel, onClick } = rest as ButtonAsLink;
    return (
      <Link href={href} target={target} rel={rel} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
