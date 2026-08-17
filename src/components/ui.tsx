import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  type,
  disabled,
  onClick,
  ariaLabel,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-display font-medium uppercase tracking-[0.14em] transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none",
    size === "sm" && "h-9 px-4 text-[11px]",
    size === "md" && "h-12 px-7 text-xs",
    size === "lg" && "h-14 px-9 text-sm",
    variant === "primary" && "bg-ink text-paper hover:bg-accent",
    variant === "outline" &&
      "border border-ink text-ink hover:bg-ink hover:text-paper",
    variant === "ghost" && "text-ink underline-offset-4 hover:underline",
    variant === "inverse" && "bg-paper text-ink hover:bg-cream",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "sold" | "sale";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        tone === "neutral" && "border-line bg-paper text-ink-soft",
        tone === "accent" && "border-accent bg-accent-deep text-white",
        tone === "sold" && "border-ink bg-ink text-paper",
        tone === "sale" && "border-red-200 bg-red-50 text-red-800",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  link,
  linkLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex items-end justify-between gap-6 sm:mb-10",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent-deep">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-semibold uppercase tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link}
          className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft underline underline-offset-4 transition-colors hover:text-accent-deep"
        >
          {linkLabel ?? "View all"} →
        </Link>
      )}
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono", className)}>{children}</span>;
}
