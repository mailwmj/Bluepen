"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";
import { cn } from "@bluepen/editor/lib/utils";

export type InputProps = Omit<
  InputPrimitive.Props & React.RefAttributes<HTMLInputElement>,
  "size" | "prefix"
> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
  nativeInput?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  inputClassName?: string;
};

export function Input({
  className,
  size = "default",
  unstyled = false,
  nativeInput = false,
  prefix,
  suffix,
  inputClassName: customInputClassName,
  style,
  ...props
}: InputProps): React.ReactElement {
  const inputClassName = cn(
    "h-8.5 w-full min-w-0 rounded-[inherit] px-2.5 leading-8.5 outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-muted-foreground/72 sm:h-7.5 sm:leading-7.5 text-inherit font-[inherit]",
    size === "sm" &&
      "h-7 px-2 text-xs leading-7 sm:h-6.5 sm:leading-6.5 sm:text-xs",
    size === "lg" && "h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5",
    props.type === "number" &&
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
    props.type === "file" &&
      "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
    prefix && "pl-5",
    suffix && "pr-5",
    customInputClassName,
  );

  return (
    <span
      className={
        cn(
          !unstyled &&
            "relative inline-flex items-center w-full rounded-md border border-border-visible bg-surface text-xs text-foreground transition-colors duration-150 has-focus-visible:border-foreground has-focus-visible:ring-1 has-focus-visible:ring-ring has-aria-invalid:border-destructive has-disabled:opacity-40",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
    >
      {prefix && (
        <span className="pointer-events-none absolute left-2 select-none text-[11px] text-muted-foreground">
          {prefix}
        </span>
      )}
      {nativeInput ? (
        <input
          className={inputClassName}
          data-slot="input"
          size={typeof size === "number" ? size : undefined}
          style={typeof style === "function" ? undefined : style}
          {...props}
        />
      ) : (
        <InputPrimitive
          className={inputClassName}
          data-slot="input"
          size={typeof size === "number" ? size : undefined}
          style={style}
          {...props}
        />
      )}
      {suffix && (
        <span className="pointer-events-none absolute right-1.5 select-none text-[10px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

export { InputPrimitive };
