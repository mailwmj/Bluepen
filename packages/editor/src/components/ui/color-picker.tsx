"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@bluepen/editor/lib/utils";
import { Popover, PopoverTrigger, PopoverPopup, PopoverClose } from "./popover";
import { Input } from "./input";
import { Button } from "./button";
import { Pipette, ChevronDown, Ban, X } from "lucide-react";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "./menu";

/* =========================================================================
   Color Math & Utility Helpers
   ========================================================================= */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number; // 0..1
}

export interface HSVA {
  h: number; // 0..360
  s: number; // 0..100
  v: number; // 0..100
  a: number; // 0..1
}

export interface HSLA {
  h: number; // 0..360
  s: number; // 0..100
  l: number; // 0..100
  a: number; // 0..1
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function rgbaToHsva({ r, g, b, a }: RGBA): HSVA {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (max !== min) {
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v), a };
}

export function hsvaToRgba({ h, s, v, a }: HSVA): RGBA {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (h >= 0 && h < 60) {
    rn = c;
    gn = x;
    bn = 0;
  } else if (h >= 60 && h < 120) {
    rn = x;
    gn = c;
    bn = 0;
  } else if (h >= 120 && h < 180) {
    rn = 0;
    gn = c;
    bn = x;
  } else if (h >= 180 && h < 240) {
    rn = 0;
    gn = x;
    bn = c;
  } else if (h >= 240 && h < 300) {
    rn = x;
    gn = 0;
    bn = c;
  } else {
    rn = c;
    gn = 0;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
    a,
  };
}

export function rgbaToHex({ r, g, b, a }: RGBA, includeAlpha = false): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (includeAlpha && a < 1) {
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, "0").toUpperCase();
    return `${hex}${alphaHex}`;
  }
  return hex;
}

export function parseColor(colorStr: string, defaultOpacity = 100): RGBA & { isTransparent: boolean } {
  if (!colorStr) {
    return { r: 255, g: 255, b: 255, a: defaultOpacity / 100, isTransparent: false };
  }

  const str = colorStr.trim().toLowerCase();
  if (str === "transparent" || str === "none") {
    return { r: 255, g: 255, b: 255, a: 0, isTransparent: true };
  }

  // Hex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: defaultOpacity / 100, isTransparent: false };
    }
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = parseInt(hex[3] + hex[3], 16) / 255;
      return { r, g, b, a, isTransparent: a === 0 };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: defaultOpacity / 100, isTransparent: false };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a, isTransparent: a === 0 };
    }
  }

  // rgb / rgba format
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : defaultOpacity / 100;
    return { r, g, b, a, isTransparent: a === 0 };
  }

  return { r: 24, g: 24, b: 27, a: defaultOpacity / 100, isTransparent: false };
}

export function rgbaToHsla({ r, g, b, a }: RGBA): HSLA {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  };
}

export function hslaToRgba({ h, s, l, a }: HSLA): RGBA {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0;
  let gn = 0;
  let bn = 0;

  if (h >= 0 && h < 60) {
    rn = c;
    gn = x;
    bn = 0;
  } else if (h >= 60 && h < 120) {
    rn = x;
    gn = c;
    bn = 0;
  } else if (h >= 120 && h < 180) {
    rn = 0;
    gn = c;
    bn = x;
  } else if (h >= 180 && h < 240) {
    rn = 0;
    gn = x;
    bn = c;
  } else if (h >= 240 && h < 300) {
    rn = x;
    gn = 0;
    bn = c;
  } else {
    rn = c;
    gn = 0;
    bn = x;
  }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
    a,
  };
}

/* =========================================================================
   Recent Colors Storage
   ========================================================================= */

const RECENT_COLORS_STORAGE_KEY = "bluepen_recent_colors";
const DEFAULT_RECENT_COLORS = [
  "#FFFFFF", "#F4F4F5", "#E4E4E7", "#D4D4D8",
  "#A1A1AA", "#71717A", "#3F3F46", "#18181B",
  "transparent", "#EF4444", "#F59E0B", "#10B981",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
];

function getRecentColors(): string[] {
  if (typeof window === "undefined") return DEFAULT_RECENT_COLORS;
  try {
    const raw = localStorage.getItem(RECENT_COLORS_STORAGE_KEY);
    if (!raw) return DEFAULT_RECENT_COLORS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RECENT_COLORS;
  } catch {
    return DEFAULT_RECENT_COLORS;
  }
}

function saveRecentColor(color: string) {
  if (typeof window === "undefined" || !color) return;
  try {
    const current = getRecentColors();
    const normalized = color.toLowerCase() === "transparent" || color === "none" ? "transparent" : color.toUpperCase();
    const updated = [normalized, ...current.filter((c) => c.toUpperCase() !== normalized.toUpperCase())].slice(0, 16);
    localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/* =========================================================================
   2D Saturation / Value Canvas Area (Nothing Reticle Pointer)
   ========================================================================= */

interface SaturationCanvasProps {
  hsva: HSVA;
  onChange: (hsva: HSVA) => void;
  onPointerUp?: () => void;
}

function SaturationCanvas({ hsva, onChange, onPointerUp }: SaturationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handlePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const y = clamp(e.clientY - rect.top, 0, rect.height);

      const s = Math.round((x / rect.width) * 100);
      const v = Math.round((1 - y / rect.height) * 100);

      const nextAlpha = hsva.a === 0 ? 1 : hsva.a;
      onChange({ ...hsva, s, v, a: nextAlpha });
    },
    [hsva, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      handlePointer(e);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe catch
      }
      onPointerUp?.();
    }
  };

  const pureHueRgb = hsvaToRgba({ h: hsva.h, s: 100, v: 100, a: 1 });
  const pureHueHex = rgbaToHex(pureHueRgb);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="relative h-36 w-full cursor-crosshair overflow-hidden rounded-lg select-none touch-none border border-border-visible/80 shadow-xs"
      style={{
        backgroundColor: pureHueHex,
        backgroundImage: `
          linear-gradient(to top, #000000 0%, transparent 100%),
          linear-gradient(to right, #FFFFFF 0%, transparent 100%)
        `,
      }}
    >
      {/* Nothing Reticle Cursor Handle */}
      <div
        className="pointer-events-none absolute size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"
        style={{
          left: `${hsva.s}%`,
          top: `${100 - hsva.v}%`,
          backgroundColor: rgbaToHex(hsvaToRgba(hsva)),
        }}
      >
        <div className="absolute inset-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>
    </div>
  );
}

/* =========================================================================
   Hue Slider Bar
   ========================================================================= */

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
  onPointerUp?: () => void;
}

function HueSlider({ hue, onChange, onPointerUp }: HueSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handlePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const h = Math.round((x / rect.width) * 360) % 360;
      onChange(h);
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      handlePointer(e);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe catch
      }
      onPointerUp?.();
    }
  };

  const thumbColor = rgbaToHex(hsvaToRgba({ h: hue, s: 100, v: 100, a: 1 }));

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="relative h-3 w-full cursor-pointer rounded-full border border-border-visible/40 select-none touch-none shadow-2xs"
      style={{
        backgroundImage: `linear-gradient(to right,
          #FF0000 0%,
          #FFFF00 17%,
          #00FF00 33%,
          #00FFFF 50%,
          #0000FF 67%,
          #FF00FF 83%,
          #FF0000 100%
        )`,
      }}
    >
      <div
        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: thumbColor,
        }}
      />
    </div>
  );
}

/* =========================================================================
   Alpha / Opacity Slider Bar
   ========================================================================= */

interface AlphaSliderProps {
  hsva: HSVA;
  onChange: (alpha: number) => void;
  onPointerUp?: () => void;
}

function AlphaSlider({ hsva, onChange, onPointerUp }: AlphaSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handlePointer = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, rect.width);
      const a = Math.round((x / rect.width) * 100) / 100;
      onChange(a);
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      handlePointer(e);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe catch
      }
      onPointerUp?.();
    }
  };

  const rgb = hsvaToRgba({ ...hsva, a: 1 });
  const solidColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="relative h-3 w-full cursor-pointer overflow-hidden rounded-full border border-border-visible/40 select-none touch-none shadow-2xs"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #333333 25%, transparent 25%),
          linear-gradient(-45deg, #333333 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #333333 75%),
          linear-gradient(-45deg, transparent 75%, #333333 75%)
        `,
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
      }}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 size-full"
        style={{
          background: `linear-gradient(to right, transparent, ${solidColor})`,
        }}
      />

      {/* Thumb Handle */}
      <div
        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
        style={{
          left: `${hsva.a * 100}%`,
          backgroundColor: rgbaToHex(hsvaToRgba(hsva)),
        }}
      />
    </div>
  );
}

/* =========================================================================
   Checkerboard / Transparent Swatch Badge
   ========================================================================= */

export function ColorSwatchBadge({
  color,
  opacity = 100,
  className,
}: {
  color: string;
  opacity?: number;
  className?: string;
}) {
  const isTransparent = color === "transparent" || color === "none" || opacity <= 0;
  const parsed = parseColor(color, opacity);
  const hex = isTransparent ? "transparent" : rgbaToHex(parsed);

  return (
    <div
      className={cn(
        "relative size-6.5 shrink-0 overflow-hidden rounded-md border border-border-visible/80 shadow-2xs select-none",
        className
      )}
      style={{
        backgroundImage: `
          linear-gradient(45deg, #333333 25%, transparent 25%),
          linear-gradient(-45deg, #333333 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #333333 75%),
          linear-gradient(-45deg, transparent 75%, #333333 75%)
        `,
        backgroundSize: "6px 6px",
        backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
      }}
    >
      {isTransparent ? (
        <div className="flex size-full items-center justify-center bg-popover/90 text-accent">
          <Ban className="size-3.5 stroke-[2.5]" />
        </div>
      ) : (
        <div
          className="size-full"
          style={{
            backgroundColor: hex,
            opacity: parsed.a,
          }}
        />
      )}
    </div>
  );
}

/* =========================================================================
   Main ColorPicker Popover Content Panel
   ========================================================================= */

export interface ColorPickerPanelProps {
  color: string;
  opacity?: number;
  title?: string;
  onChange: (hexOrTransparent: string, opacity?: number) => void;
  onClose?: () => void;
  className?: string;
}

export function ColorPickerPanel({
  color,
  opacity = 100,
  title = "选择颜色",
  onChange,
  onClose,
  className,
}: ColorPickerPanelProps) {
  const parsed = useMemo(() => parseColor(color, opacity), [color, opacity]);
  const [hsva, setHsva] = useState<HSVA>(() => rgbaToHsva(parsed));
  const [format, setFormat] = useState<"HEX" | "RGB" | "HSL">("HEX");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);

  // Sync internal state when external color/opacity changes
  useEffect(() => {
    const nextRgba = parseColor(color, opacity);
    setHsva(rgbaToHsva(nextRgba));
  }, [color, opacity]);

  // Load recent colors and detect EyeDropper API on mount
  useEffect(() => {
    setRecentColors(getRecentColors());
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      setSupportsEyeDropper(true);
    }
  }, []);

  const handleHsvaChange = (newHsva: HSVA) => {
    setHsva(newHsva);
    const rgba = hsvaToRgba(newHsva);
    const hex = rgbaToHex(rgba);
    const newOpacity = Math.round(newHsva.a * 100);
    onChange(hex, newOpacity);
  };

  const handlePointerUpSave = () => {
    const rgba = hsvaToRgba(hsva);
    const hex = rgbaToHex(rgba);
    saveRecentColor(hex);
    setRecentColors(getRecentColors());
  };

  const handleSetTransparent = () => {
    const nextHsva = { ...hsva, a: 0 };
    setHsva(nextHsva);
    onChange("transparent", 0);
    saveRecentColor("transparent");
    setRecentColors(getRecentColors());
  };

  const handleEyeDropper = async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        const pickedRgba = parseColor(result.sRGBHex, hsva.a * 100);
        const nextHsva = rgbaToHsva(pickedRgba);
        setHsva(nextHsva);
        onChange(result.sRGBHex.toUpperCase(), Math.round(nextHsva.a * 100));
        saveRecentColor(result.sRGBHex.toUpperCase());
        setRecentColors(getRecentColors());
      }
    } catch {
      // User cancelled eye dropper, no action needed
    }
  };

  const currentRgba = hsvaToRgba(hsva);
  const currentHsla = rgbaToHsla(currentRgba);
  const currentHex = rgbaToHex(currentRgba).replace("#", "").toUpperCase();
  const currentOpacityPercent = Math.round(hsva.a * 100);

  return (
    <div className={cn("flex w-72 flex-col gap-3 p-4 text-xs font-sans bg-popover text-popover-foreground rounded-xl border border-border-visible shadow-2xl select-none", className)}>
      {/* 0. Header with Title and Close Button */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="font-mono text-xs font-bold tracking-wider text-foreground uppercase">
          {title}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex size-5.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
            title="关闭面板"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <PopoverClose
            render={
              <button
                type="button"
                className="flex size-5.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
                title="关闭面板"
              >
                <X className="size-3.5" />
              </button>
            }
          />
        )}
      </div>

      {/* 1. 2D Saturation / Value Canvas */}
      <SaturationCanvas
        hsva={hsva}
        onChange={handleHsvaChange}
        onPointerUp={handlePointerUpSave}
      />

      {/* 2. Hue & Alpha Controls + Eyedropper */}
      <div className="flex items-center gap-2.5">
        {/* Eyedropper / Pipette Button */}
        {supportsEyeDropper && (
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            title="吸管取色"
            onClick={handleEyeDropper}
            className="size-8 shrink-0 cursor-pointer rounded-lg border-border-visible/80 bg-surface text-foreground hover:bg-surface-raised hover:border-primary/50 transition-colors"
          >
            <Pipette className="size-3.5" />
          </Button>
        )}

        {/* Sliders Column */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <HueSlider
            hue={hsva.h}
            onChange={(h) => {
              const nextAlpha = hsva.a === 0 ? 1 : hsva.a;
              handleHsvaChange({ ...hsva, h, a: nextAlpha });
            }}
            onPointerUp={handlePointerUpSave}
          />
          <AlphaSlider
            hsva={hsva}
            onChange={(a) => handleHsvaChange({ ...hsva, a })}
            onPointerUp={handlePointerUpSave}
          />
        </div>
      </div>

      {/* 3. Value Inputs & Format Dropdown */}
      <div className="flex items-center gap-2 pt-0.5 font-mono">
        {/* Format Select Menu */}
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7.5 px-2.5 text-[11px] font-mono font-medium tracking-wider text-foreground bg-surface border-border-visible/80 gap-1 rounded-md hover:bg-surface-raised transition-colors"
              >
                <span>{format}</span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            }
          />
          <MenuPopup align="start" className="min-w-[80px] font-mono text-xs border-border-visible">
            <MenuItem onClick={() => setFormat("HEX")} className="flex items-center justify-between font-mono">
              <span>HEX</span>
              {format === "HEX" && <div className="size-1.5 rounded-full bg-accent" />}
            </MenuItem>
            <MenuItem onClick={() => setFormat("RGB")} className="flex items-center justify-between font-mono">
              <span>RGB</span>
              {format === "RGB" && <div className="size-1.5 rounded-full bg-accent" />}
            </MenuItem>
            <MenuItem onClick={() => setFormat("HSL")} className="flex items-center justify-between font-mono">
              <span>HSL</span>
              {format === "HSL" && <div className="size-1.5 rounded-full bg-accent" />}
            </MenuItem>
          </MenuPopup>
        </Menu>

        {/* Dynamic Format Inputs */}
        {format === "HEX" && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 font-mono">
            <Input
              size="sm"
              value={currentHex}
              prefix="#"
              onChange={(e) => {
                const val = e.target.value.trim().replace(/^#/, "");
                if (/^[0-9a-fA-F]{0,8}$/.test(val)) {
                  if (val.length === 6 || val.length === 3 || val.length === 8) {
                    const newRgba = parseColor(`#${val}`, currentOpacityPercent);
                    setHsva(rgbaToHsva(newRgba));
                    onChange(`#${val.toUpperCase()}`, Math.round(newRgba.a * 100));
                    saveRecentColor(`#${val.toUpperCase()}`);
                    setRecentColors(getRecentColors());
                  }
                }
              }}
              className="h-7.5 min-w-0 flex-1 font-mono text-xs uppercase border-border-visible/80 bg-surface rounded-md focus-within:border-foreground"
              inputClassName="font-mono text-xs uppercase tracking-wider"
              placeholder="FFFFFF"
            />
            <div className="w-16 shrink-0">
              <Input
                size="sm"
                type="number"
                min={0}
                max={100}
                value={currentOpacityPercent}
                suffix="%"
                onChange={(e) => {
                  const o = clamp(Number(e.target.value) || 0, 0, 100);
                  handleHsvaChange({ ...hsva, a: o / 100 });
                }}
                className="h-7.5 w-full font-mono text-xs border-border-visible/80 bg-surface rounded-md focus-within:border-foreground"
                inputClassName="text-center font-mono text-xs"
              />
            </div>
          </div>
        )}

        {format === "RGB" && (
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 font-mono">
            <Input
              size="sm"
              type="number"
              min={0}
              max={255}
              value={currentRgba.r}
              onChange={(e) => {
                const r = clamp(Number(e.target.value) || 0, 0, 255);
                const nextRgba = { ...currentRgba, r };
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Red (0-255)"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={255}
              value={currentRgba.g}
              onChange={(e) => {
                const g = clamp(Number(e.target.value) || 0, 0, 255);
                const nextRgba = { ...currentRgba, g };
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Green (0-255)"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={255}
              value={currentRgba.b}
              onChange={(e) => {
                const b = clamp(Number(e.target.value) || 0, 0, 255);
                const nextRgba = { ...currentRgba, b };
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Blue (0-255)"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              value={currentOpacityPercent}
              suffix="%"
              onChange={(e) => {
                const o = clamp(Number(e.target.value) || 0, 0, 100);
                handleHsvaChange({ ...hsva, a: o / 100 });
              }}
              title="Opacity %"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px]"
            />
          </div>
        )}

        {format === "HSL" && (
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 font-mono">
            <Input
              size="sm"
              type="number"
              min={0}
              max={360}
              value={currentHsla.h}
              onChange={(e) => {
                const h = clamp(Number(e.target.value) || 0, 0, 360);
                const nextRgba = hslaToRgba({ ...currentHsla, h });
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Hue (0-360)"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              value={currentHsla.s}
              onChange={(e) => {
                const s = clamp(Number(e.target.value) || 0, 0, 100);
                const nextRgba = hslaToRgba({ ...currentHsla, s });
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Saturation %"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              value={currentHsla.l}
              onChange={(e) => {
                const l = clamp(Number(e.target.value) || 0, 0, 100);
                const nextRgba = hslaToRgba({ ...currentHsla, l });
                setHsva(rgbaToHsva(nextRgba));
                onChange(rgbaToHex(nextRgba), Math.round(nextRgba.a * 100));
              }}
              title="Lightness %"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px] px-0.5"
            />
            <Input
              size="sm"
              type="number"
              min={0}
              max={100}
              value={currentOpacityPercent}
              suffix="%"
              onChange={(e) => {
                const o = clamp(Number(e.target.value) || 0, 0, 100);
                handleHsvaChange({ ...hsva, a: o / 100 });
              }}
              title="Opacity %"
              className="h-7.5 border-border-visible/80 bg-surface rounded-md"
              inputClassName="text-center font-mono text-[10px]"
            />
          </div>
        )}
      </div>

      {/* 4. Quick Transparent / No Fill Button */}
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={handleSetTransparent}
        className={cn(
          "h-7.5 w-full justify-center gap-1.5 font-mono text-[11px] tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-border-visible/80 bg-surface hover:bg-surface-raised",
          (color === "transparent" || color === "none" || currentOpacityPercent === 0) &&
            "border-accent/80 bg-accent-subtle text-accent font-semibold"
        )}
      >
        <Ban className="size-3 text-accent" />
        <span>设为透明 / NO FILL</span>
      </Button>

      {/* 5. Recently Used Swatches */}
      <div className="flex flex-col gap-2 border-t border-border pt-2.5">
        <div className="flex items-center justify-between">
          <span className="nd-label text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            最近使用
          </span>
          <span className="nd-num text-[10px] font-mono text-muted-foreground/70">
            {recentColors.length} 个
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {recentColors.slice(0, 16).map((c, idx) => {
            const isItemTransparent = c === "transparent" || c === "none";
            const isCurrent =
              isItemTransparent
                ? color === "transparent" || color === "none" || currentOpacityPercent === 0
                : c.toLowerCase() === rgbaToHex(currentRgba).toLowerCase();

            return (
              <button
                key={`${c}-${idx}`}
                type="button"
                title={isItemTransparent ? "透明 / 无填充" : c}
                onClick={() => {
                  if (isItemTransparent) {
                    handleSetTransparent();
                  } else {
                    const picked = parseColor(c, 100);
                    setHsva(rgbaToHsva(picked));
                    onChange(c, 100);
                    saveRecentColor(c);
                    setRecentColors(getRecentColors());
                  }
                }}
                className={cn(
                  "group relative size-6.5 cursor-pointer rounded-md overflow-hidden border border-border-visible/70 transition-all duration-150 hover:scale-110 active:scale-95",
                  isCurrent && "ring-2 ring-accent ring-offset-2 ring-offset-popover shadow-xs"
                )}
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #333333 25%, transparent 25%),
                    linear-gradient(-45deg, #333333 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #333333 75%),
                    linear-gradient(-45deg, transparent 75%, #333333 75%)
                  `,
                  backgroundSize: "6px 6px",
                  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                }}
              >
                {isItemTransparent ? (
                  <div className="flex size-full items-center justify-center bg-popover/90 text-accent">
                    <Ban className="size-3" />
                  </div>
                ) : (
                  <div className="size-full" style={{ backgroundColor: c }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Row Component (Trigger Swatch + Hex Input + Opacity Input + Popover)
   ========================================================================= */

export interface ColorPickerRowProps {
  color: string;
  opacity: number;
  title?: string;
  onChange?: (color: string, opacity: number) => void;
  onColorChange?: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  className?: string;
}

export function ColorPickerRow({
  color,
  opacity,
  title = "选择颜色",
  onChange,
  onColorChange,
  onOpacityChange,
  className,
}: ColorPickerRowProps) {
  const [open, setOpen] = useState(false);
  const isTransparent = color === "transparent" || color === "none" || opacity <= 0;
  const parsed = useMemo(() => parseColor(color, opacity), [color, opacity]);
  const hexValue = isTransparent ? "TRANSPARENT" : rgbaToHex(parsed).replace("#", "").toUpperCase();

  const handleColorPicked = (newColor: string, newOpacity?: number) => {
    const finalOpacity = newOpacity !== undefined ? newOpacity : opacity;
    if (onChange) {
      onChange(newColor, finalOpacity);
    } else {
      onColorChange?.(newColor);
      if (newOpacity !== undefined) {
        onOpacityChange?.(newOpacity);
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-2 font-mono", className)}>
      {/* Color Swatch Trigger (Base UI Popover with backdrop to isolate outside click) */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md transition-transform active:scale-95"
              title="点击打开选色面板"
            >
              <ColorSwatchBadge color={color} opacity={opacity} className="transition-transform group-hover:scale-105" />
            </button>
          }
        />
        <PopoverPopup
          backdrop={true}
          align="start"
          sideOffset={6}
          className="border-none bg-transparent shadow-none p-0 before:hidden [&>[data-slot=popover-viewport]]:p-0"
        >
          <ColorPickerPanel
            color={color}
            opacity={opacity}
            title={title}
            onChange={handleColorPicked}
            onClose={() => setOpen(false)}
          />
        </PopoverPopup>
      </Popover>

      {/* Hex / Color Text Input */}
      <Input
        size="sm"
        value={hexValue}
        prefix="#"
        onChange={(e) => {
          const v = e.target.value.trim().replace(/^#/, "");
          if (v.toLowerCase() === "transparent" || v === "none") {
            handleColorPicked("transparent", 0);
          } else {
            handleColorPicked(`#${v}`, opacity);
          }
        }}
        className="h-7.5 min-w-0 flex-1 font-mono text-xs uppercase border-border-visible/80 bg-surface rounded-md focus-within:border-foreground"
        inputClassName="font-mono text-xs uppercase tracking-wider"
      />

      {/* Opacity % */}
      <div className="w-16 shrink-0 font-mono">
        <Input
          size="sm"
          type="number"
          min={0}
          max={100}
          value={isTransparent ? 0 : opacity}
          suffix="%"
          onChange={(e) => {
            const v = clamp(Number(e.target.value) || 0, 0, 100);
            handleColorPicked(color, v);
          }}
          className="h-7.5 w-full font-mono text-xs border-border-visible/80 bg-surface rounded-md focus-within:border-foreground"
          inputClassName="text-center font-mono text-xs"
        />
      </div>
    </div>
  );
}

export { ColorPickerRow as ColorPicker };
