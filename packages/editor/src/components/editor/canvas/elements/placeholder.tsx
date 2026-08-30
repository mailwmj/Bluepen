import { cn } from "@outlin/editor/lib/utils";
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
  title: "bg-neutral-300",
  heading: "bg-neutral-300",
  body: "bg-neutral-200",
  caption: "bg-neutral-200",
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
  return <div className={cn("h-px w-full bg-neutral-200", className)} />;
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
          "flex h-7 shrink-0 items-center justify-center rounded-md bg-neutral-900 px-3 text-[10px] font-semibold tracking-wide text-white",
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
          "flex h-7 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-[10px] font-semibold tracking-wide text-neutral-600",
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
        "flex h-7 shrink-0 items-center justify-center px-2 text-[10px] font-semibold text-neutral-500",
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
        "flex h-8 w-full shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[10px] text-neutral-400",
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
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgb(0,0,0,0.025)_6px,rgb(0,0,0,0.025)_12px)]" />
      <ImageIcon aria-hidden="true" className="relative size-4 text-neutral-300" />
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
        "flex shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 font-semibold text-neutral-500",
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
      className={cn("size-3.5 shrink-0 text-neutral-400", className)}
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
    neutral: "bg-neutral-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  }[tone];
  const text = {
    neutral: "text-neutral-500",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  }[tone];
  return (
    <div
      className={cn(
        "flex h-4 shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-1.5 text-[8px] font-semibold",
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
          className="w-full rounded-sm bg-neutral-200 first:bg-neutral-300 last:bg-neutral-300"
          style={{ height: `${v}%` }}
        />
      ))}
    </div>
  );
}
