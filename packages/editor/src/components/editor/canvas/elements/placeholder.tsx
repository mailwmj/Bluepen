import { cn } from "@bluepen/editor/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";

type TextVariant = "title" | "heading" | "body" | "caption";

const TEXT_HEIGHT: Record<TextVariant, string> = {
  title: "h-3.5",
  heading: "h-3",
  body: "h-2",
  caption: "h-1.5",
};

const TEXT_COLOR: Record<TextVariant, string> = {
  title: "bg-muted-foreground/40",
  heading: "bg-muted-foreground/30",
  body: "bg-muted-foreground/20",
  caption: "bg-muted-foreground/20",
};

export function SkeletonText({
  variant = "body",
  width = "60%",
  className,
}: {
  variant?: TextVariant;
  width?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-full", TEXT_HEIGHT[variant], TEXT_COLOR[variant], className)}
      style={{ width, maxWidth: "100%" }}
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

export function SkeletonButton({
  label = "Button",
  variant = "primary",
  className,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  if (variant === "primary") {
    return (
      <div
        className={cn(
          "flex h-7 shrink-0 items-center justify-center rounded-md bg-foreground px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-background",
          className,
        )}
      >
        {label}
      </div>
    );
  }
  if (variant === "secondary") {
    return (
      <div
        className={cn(
          "flex h-7 shrink-0 items-center justify-center rounded-md border border-border-visible bg-surface px-3 text-[10px] font-mono font-medium tracking-wider uppercase text-foreground",
          className,
        )}
      >
        {label}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-7 shrink-0 items-center justify-center px-2 text-[10px] font-mono font-medium uppercase text-muted-foreground",
        className,
      )}
    >
      {label}
    </div>
  );
}

export function SkeletonInput({
  icon,
  placeholder = "Type here…",
  className,
}: {
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-full shrink-0 items-center gap-1.5 rounded-md border border-border-visible bg-background px-2.5 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {icon}
      <span className="truncate">{placeholder}</span>
    </div>
  );
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border-visible bg-surface-raised",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,currentColor_6px,currentColor_7px)] text-muted-foreground/10" />
      <ImageIcon aria-hidden="true" className="relative size-4 text-muted-foreground" />
    </div>
  );
}

export function SkeletonAvatar({
  initials = "AV",
  size = "sm",
  className,
}: {
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const s = {
    xs: "size-5 text-[7px]",
    sm: "size-7 text-[9px]",
    md: "size-9 text-[10px]",
    lg: "size-12 text-xs",
  }[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border-visible bg-surface-raised font-mono font-bold text-foreground",
        s,
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function SkeletonIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Icon
      aria-hidden="true"
      className={cn("size-3.5 shrink-0 text-muted-foreground", className)}
    />
  );
}

export function SkeletonChip({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  className?: string;
}) {
  const dot = {
    neutral: "bg-muted-foreground",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  }[tone];
  const text = {
    neutral: "text-muted-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
  }[tone];
  return (
    <div
      className={cn(
        "flex h-4 shrink-0 items-center gap-1 rounded-full border border-border-visible bg-surface-raised px-1.5 text-[8px] font-mono font-semibold",
        text,
        className,
      )}
    >
      <span className={cn("size-1 rounded-full", dot)} />
      {label}
    </div>
  );
}

export function SkeletonBars({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  return (
    <div className={cn("flex h-full w-full items-end justify-between gap-1", className)}>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-full rounded-xs bg-muted-foreground/30 first:bg-foreground last:bg-foreground"
          style={{ height: `${v}%` }}
        />
      ))}
    </div>
  );
}
