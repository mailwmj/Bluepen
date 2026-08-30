"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@bluepen/editor/lib/utils";
import { Spinner } from "@bluepen/editor/components/ui/spinner";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border font-medium text-xs outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 data-loading:select-none data-loading:text-transparent [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-8 px-3.5",
        icon: "size-8",
        "icon-lg": "size-9",
        "icon-sm": "size-7",
        "icon-xl": "size-10 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-6 rounded-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 px-4 text-sm",
        sm: "h-7 gap-1.5 px-2.5 text-xs",
        xl: "h-10 px-5 text-sm [&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-6 gap-1 rounded-xs px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        pill: "h-8 px-4 rounded-full font-mono text-xs tracking-wider uppercase",
        "pill-sm": "h-7 px-3 rounded-full font-mono text-[11px] tracking-wider uppercase",
      },
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:opacity-90 font-medium",
        destructive:
          "border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-white active:opacity-90",
        "destructive-outline":
          "border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 active:opacity-90",
        ghost:
          "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent",
        link: "border-transparent text-interactive underline-offset-4 hover:underline",
        outline:
          "border-border-visible bg-transparent text-foreground hover:border-foreground/40 hover:bg-muted/40 active:bg-muted/70",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-90",
        pill:
          "rounded-full border-primary bg-primary text-primary-foreground font-mono hover:opacity-90 active:scale-[0.98]",
        "pill-outline":
          "rounded-full border-border-visible bg-transparent text-foreground font-mono hover:border-foreground hover:bg-muted/30 active:scale-[0.98]",
      },
    },
  },
);

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled: boolean = Boolean(loading || disabledProp);
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner
            className="pointer-events-none absolute"
            data-slot="button-loading-indicator"
          />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
