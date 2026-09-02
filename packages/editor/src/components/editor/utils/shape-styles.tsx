import React from "react";

type Props = Record<string, string | number | boolean>;
const val = (props: Props, key: string, fallback: string | number | boolean) =>
  props[key] ?? fallback;

export function hexToRgba(hexOrColor: string, opacityPercent = 100): string {
  if (!hexOrColor || hexOrColor === "transparent" || hexOrColor === "none") return "transparent";
  if (hexOrColor.startsWith("rgba") || hexOrColor.startsWith("hsla") || hexOrColor.startsWith("var(")) return hexOrColor;
  if (hexOrColor.startsWith("rgb")) {
    const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
    return hexOrColor.replace("rgb", "rgba").replace(")", `, ${alpha})`);
  }
  const cleanHex = hexOrColor.replace("#", "").trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexOrColor;
}

export function computeShapeStyle(
  props: Props,
  defaults: {
    fill?: string;
    stroke?: string;
    borderWidth?: number;
    radius?: number;
    isCircle?: boolean;
  } = {},
): React.CSSProperties {
  const style: React.CSSProperties = {};

  // 1. Fill / Background (P0 + P1)
  const fillEnabled = props.fillEnabled !== false && props.fillEnabled !== "false";
  if (!fillEnabled) {
    style.background = "transparent";
  } else if (Boolean(props.gradientEnabled)) {
    const gradientType = String(props.gradientType || "linear");
    const angle = Number(props.gradientAngle || 90);
    const start = hexToRgba(String(props.gradientStart || "#3B82F6"), Number(props.fillOpacity ?? 100));
    const end = hexToRgba(String(props.gradientEnd || "#9333EA"), Number(props.fillOpacity ?? 100));
    if (gradientType === "radial") {
      style.background = `radial-gradient(circle, ${start}, ${end})`;
    } else {
      style.background = `linear-gradient(${angle}deg, ${start}, ${end})`;
    }
  } else {
    const rawFill = props.fill !== undefined ? String(props.fill) : defaults.fill;
    if (rawFill !== undefined) {
      if (rawFill === "transparent" || rawFill === "none") {
        style.background = "transparent";
      } else {
        const fillOpacity = Number(props.fillOpacity ?? 100);
        style.background = hexToRgba(rawFill, fillOpacity);
      }
    }
  }

  // 2. Stroke / Border (P0 + P1)
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const strokeSides = String(props.strokeSides || "all");
  const strokeStyle = String(props.strokeStyle || "solid");
  const strokePosition = String(props.strokePosition || "inside"); // "inside" | "center" | "outside"
  const rawBorderWidth = props.borderWidth !== undefined ? Number(props.borderWidth) : defaults.borderWidth;
  const rawStroke = props.stroke !== undefined ? String(props.stroke) : defaults.stroke;

  const shadowParts: string[] = [];

  if (rawStroke !== undefined || rawBorderWidth !== undefined) {
    const borderWidth = Number(rawBorderWidth ?? 1);
    const stroke = String(rawStroke ?? "var(--border-visible)");
    const strokeOpacity = Number(props.strokeOpacity ?? 100);
    const strokeColor = hexToRgba(stroke, strokeOpacity);

    if (strokeEnabled && borderWidth > 0 && stroke !== "transparent") {
      if (strokePosition === "inside" && strokeSides === "all" && strokeStyle === "solid") {
        shadowParts.push(`inset 0 0 0 ${borderWidth}px ${strokeColor}`);
        style.border = "none";
      } else {
        const borderValue = `${borderWidth}px ${strokeStyle} ${strokeColor}`;
        if (strokeSides === "top") {
          style.borderTop = borderValue;
          style.borderRight = "none";
          style.borderBottom = "none";
          style.borderLeft = "none";
        } else if (strokeSides === "bottom") {
          style.borderBottom = borderValue;
          style.borderTop = "none";
          style.borderRight = "none";
          style.borderLeft = "none";
        } else if (strokeSides === "left") {
          style.borderLeft = borderValue;
          style.borderTop = "none";
          style.borderRight = "none";
          style.borderBottom = "none";
        } else if (strokeSides === "right") {
          style.borderRight = borderValue;
          style.borderTop = "none";
          style.borderBottom = "none";
          style.borderLeft = "none";
        } else {
          style.border = borderValue;
        }
      }
    } else {
      style.border = "none";
    }
  }

  // 3. Radius (P0 + P1)
  if (defaults.isCircle) {
    style.borderRadius = "50%";
  } else {
    const radiusEnabled = props.radiusEnabled !== false && props.radiusEnabled !== "false";
    if (!radiusEnabled) {
      style.borderRadius = 0;
    } else if (Boolean(props.radiusIndependent)) {
      const tl = Number(props.radiusTopLeft || 0);
      const tr = Number(props.radiusTopRight || 0);
      const br = Number(props.radiusBottomRight || 0);
      const bl = Number(props.radiusBottomLeft || 0);
      style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    } else {
      const rawRadius = props.radius !== undefined ? Number(props.radius) : defaults.radius;
      if (rawRadius !== undefined) {
        style.borderRadius = Number(rawRadius);
      }
    }
  }

  // 4. Shadow (Drop Shadow & Inner Shadow - P1)
  const shadowEnabled = Boolean(props.shadowEnabled);
  if (shadowEnabled) {
    const sx = Number(props.shadowX ?? 0);
    const sy = Number(props.shadowY ?? 4);
    const sblur = Number(props.shadowBlur ?? 12);
    const sspread = Number(props.shadowSpread ?? 0);
    const rawSColor = String(props.shadowColor || "#000000");
    const sOpacity = Number(props.shadowOpacity ?? 25);
    const sColor = hexToRgba(rawSColor, sOpacity);
    const isInset = Boolean(props.shadowInset);
    shadowParts.push(`${isInset ? "inset " : ""}${sx}px ${sy}px ${sblur}px ${sspread}px ${sColor}`);
  }

  if (shadowParts.length > 0) {
    style.boxShadow = shadowParts.join(", ");
  }

  // 5. Blur (Backdrop Blur & Layer Blur - P2)
  const blurEnabled = Boolean(props.blurEnabled);
  if (blurEnabled) {
    const backdropBlur = Number(props.backdropBlur || 0);
    const layerBlur = Number(props.layerBlur || 0);
    if (backdropBlur > 0) {
      style.backdropFilter = `blur(${backdropBlur}px)`;
      style.WebkitBackdropFilter = `blur(${backdropBlur}px)`;
    }
    if (layerBlur > 0) {
      style.filter = `blur(${layerBlur}px)`;
    }
  }

  return style;
}

export function ShapeTextRenderer({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  if (isEditing) return null;
  const text = String(props.text || "");
  if (!text) return null;

  const textColor = String(props.textColor || "#18181B");
  const textOpacity = Number(props.textOpacity ?? 100);
  const color = hexToRgba(textColor, textOpacity);
  const fontSize = Number(props.fontSize || 14);
  const fontWeight = Number(props.fontWeight || 400);
  const fontFamily = props.fontFamily ? String(props.fontFamily) : undefined;
  const textAlign = String(props.textAlign || props.align || "center") as "left" | "center" | "right" | "justify";
  const textVerticalAlign = String(props.textVerticalAlign || "middle");
  const lineHeight = props.lineHeight ? `${props.lineHeight}px` : undefined;
  const letterSpacing = props.letterSpacing ? `${props.letterSpacing}px` : undefined;
  const fontStyle = props.italic ? "italic" : undefined;
  const isUnderline = Boolean(props.underline);
  const isStrikethrough = Boolean(props.strikethrough);
  const textDecoration =
    isUnderline && isStrikethrough
      ? "underline line-through"
      : isUnderline
      ? "underline"
      : isStrikethrough
      ? "line-through"
      : undefined;

  const justifyClass =
    textAlign === "left" ? "justify-start" : textAlign === "right" ? "justify-end" : "justify-center";
  const itemsClass =
    textVerticalAlign === "top" ? "items-start" : textVerticalAlign === "bottom" ? "items-end" : "items-center";

  return (
    <div className={`pointer-events-none absolute inset-0 flex p-2 overflow-hidden ${justifyClass} ${itemsClass}`}>
      <span
        style={{
          color,
          fontSize,
          fontWeight,
          fontFamily,
          textAlign,
          lineHeight,
          letterSpacing,
          fontStyle,
          textDecoration,
          wordBreak: "break-word",
        }}
        className="max-h-full max-w-full overflow-hidden"
      >
        {text}
      </span>
    </div>
  );
}
