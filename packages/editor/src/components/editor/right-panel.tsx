"use client";

import { useState, useMemo } from "react";
import { cn } from "@bluepen/editor/lib/utils";
import { Button } from "@bluepen/editor/components/ui/button";
import { Input } from "@bluepen/editor/components/ui/input";
import { Checkbox } from "@bluepen/editor/components/ui/checkbox";
import { Separator } from "@bluepen/editor/components/ui/separator";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@bluepen/editor/components/ui/menu";
import { Slider } from "@bluepen/editor/components/ui/slider";
import { Popover, PopoverTrigger, PopoverPopup } from "@bluepen/editor/components/ui/popover";
import { ColorPickerRow, ColorSwatchBadge, ColorPickerPanel } from "@bluepen/editor/components/ui/color-picker";
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
  Link2,
  Unlink2,
  FlipHorizontal,
  FlipVertical,
  Square,
  Maximize2,
  Ban,
  Layers,
  Plus,
  Minus,
  GripVertical,
} from "lucide-react";
import type { EditorElement, Page } from "./types";
import { showToast } from "./hooks/use-toast";
import {
  calculateAlign,
  calculateDistribute,
  getSelectionBounds,
  type AlignType,
  type DistributeType,
} from "./utils/alignment";

interface RightPanelProps {
  element: EditorElement | null;
  selectedElements?: EditorElement[];
  parent?: EditorElement | null;
  pages?: Page[];
  onUpdate: (id: string, patch: Partial<EditorElement>) => void;
  onBatchUpdate?: (patches: Array<{ id: string; patch: Partial<EditorElement> }>) => void;
  onDelete: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onDuplicate?: () => void;
}


const FONT_FAMILIES = [
  { label: "PingFang SC", value: "PingFang SC, sans-serif" },
  { label: "Microsoft YaHei", value: "'Microsoft YaHei', sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "System UI", value: "system-ui, -apple-system, sans-serif" },
  { label: "Monospace", value: "monospace" },
];

const WEIGHT_OPTIONS = [
  { label: "Light (300)", value: 300 },
  { label: "Regular (400)", value: 400 },
  { label: "Medium (500)", value: 500 },
  { label: "Semibold (600)", value: 600 },
  { label: "Bold (700)", value: 700 },
  { label: "Black (900)", value: 900 },
];

const FLOWCHART_TYPES = [
  "flow-process", "flow-decision", "flow-start-end", "flow-document", "flow-data",
  "flow-subprocess", "flow-external-data", "flow-internal-storage", "flow-queue",
  "flow-database", "flow-manual-input", "flow-card", "flow-tape",
  "flow-display", "flow-manual-op", "flow-preparation", "flow-loop-limit",
];

const TEXT_TYPES = new Set([
  "text", "button", "button-primary", "badge", "chip", "link", "sticky-note", "connector",
  ...FLOWCHART_TYPES,
]);

const SHAPE_TYPES_WITH_TEXT = new Set([
  "rectangle", "circle", "card", "placeholder", "button", "button-primary",
  "modal-dialog", "alert", "badge", "chip", "hotspot", "connector",
  ...FLOWCHART_TYPES,
]);

const STROKE_SUPPORTED_TYPES = new Set([
  "rectangle", "circle", "line", "arrow", "connector",
  "button", "button-primary", "icon-button",
  "card", "mobile-frame", "browser-frame", "placeholder", "hotspot", "image", "scroll-panel", "modal-dialog",
  "badge", "chip", "avatar", "alert", "sticky-note", "code-block", "ai-component",
  "input", "textarea", "select", "date-picker", "search",
  ...FLOWCHART_TYPES,
]);

const FILL_SUPPORTED_TYPES = new Set([
  "rectangle", "circle", "button", "button-primary", "icon-button",
  "card", "mobile-frame", "browser-frame", "placeholder", "hotspot", "image", "scroll-panel", "modal-dialog",
  "badge", "chip", "avatar", "alert", "sticky-note", "code-block", "ai-component",
  "input", "textarea", "select", "date-picker", "search",
  ...FLOWCHART_TYPES,
]);

const RADIUS_SUPPORTED_TYPES = new Set([
  "rectangle", "button", "button-primary", "icon-button",
  "card", "mobile-frame", "browser-frame", "placeholder", "image", "scroll-panel", "modal-dialog",
  "code-block", "ai-component", "badge", "alert", "connector",
  "input", "textarea", "select", "date-picker", "search",
]);

function Section({
  title,
  action,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div
          className={cn("flex items-center gap-1.5", collapsible && "cursor-pointer select-none")}
          onClick={collapsible ? () => setOpen(!open) : undefined}
        >
          {collapsible && (
            <span className="text-muted-foreground">
              {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            </span>
          )}
          <span className="text-[11px] font-semibold tracking-wide text-foreground/80">{title}</span>
        </div>
        {action && <div>{action}</div>}
      </div>
      {open && <div className="mt-2.5 flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  className,
}: {
  label?: string | React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      {label && <span className="w-3.5 shrink-0 text-[10px] text-muted-foreground">{label}</span>}
      <Input
        size="sm"
        type="number"
        value={Number.isNaN(value) ? 0 : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="h-7 min-w-0 flex-1 px-1.5 text-xs"
      />
      {suffix && <span className="shrink-0 text-[10px] text-muted-foreground">{suffix}</span>}
    </label>
  );
}


function OptionsListEditor({
  title = "选项",
  value,
  onChange,
  selectedIndex,
  onSelectIndex,
  selectedIndices,
  onToggleIndex,
  mode = "single",
  placeholder = "输入选项内容...",
}: {
  title?: string;
  value: string;
  onChange: (val: string) => void;
  selectedIndex?: number;
  onSelectIndex?: (idx: number) => void;
  selectedIndices?: number[];
  onToggleIndex?: (idx: number) => void;
  mode?: "single" | "multiple" | "none";
  placeholder?: string;
}) {
  const items = useMemo(() => {
    if (!value) return ["选项1", "选项2"];
    const raw = value.split(value.includes("\n") ? "\n" : ",");
    return raw.map((s) => s.trim()).filter((s, idx) => s.length > 0 || idx === 0);
  }, [value]);

  const updateItems = (newItems: string[]) => {
    const sep = value?.includes("\n") ? "\n" : ",";
    onChange(newItems.join(sep));
  };

  const handleItemChange = (index: number, newText: string) => {
    const copy = [...items];
    copy[index] = newText;
    updateItems(copy);
  };

  const handleAddItem = () => {
    const newItemName = `选项${items.length + 1}`;
    const copy = [...items, newItemName];
    updateItems(copy);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) return;
    const copy = items.filter((_, i) => i !== index);
    updateItems(copy);
    if (mode === "single" && onSelectIndex && selectedIndex !== undefined) {
      if (selectedIndex === index) {
        onSelectIndex(Math.max(0, index - 1));
      } else if (selectedIndex > index) {
        onSelectIndex(selectedIndex - 1);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/80">{title}</span>
        <button
          type="button"
          onClick={handleAddItem}
          title="添加选项"
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* Item Rows */}
      <div className="flex flex-col gap-1.5">
        {items.map((item, index) => {
          const isSelected =
            mode === "single"
              ? selectedIndex === index
              : mode === "multiple"
              ? (selectedIndices || []).includes(index)
              : false;

          return (
            <div
              key={index}
              className="group relative flex items-center gap-1.5"
            >
              {/* Drag Handle Icon on hover */}
              <div className="flex size-4 shrink-0 items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing">
                <GripVertical className="size-3.5" />
              </div>

              {/* Input with Selection Indicator */}
              <div className="relative flex min-w-0 flex-1 items-center">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "h-8 w-full rounded-md bg-muted/50 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors",
                    "border border-transparent focus:border-input focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring",
                    mode !== "none" ? "pr-7" : "pr-2"
                  )}
                />

                {/* Default/Selected Indicator (Blue ring or Grey ring on hover) */}
                {mode !== "none" && (
                  <button
                    type="button"
                    title={isSelected ? "当前默认值 (已选中)" : "设为默认值"}
                    onClick={() => {
                      if (mode === "single" && onSelectIndex) {
                        onSelectIndex(index);
                      } else if (mode === "multiple" && onToggleIndex) {
                        onToggleIndex(index);
                      }
                    }}
                    className="absolute right-2 flex size-4 items-center justify-center cursor-pointer select-none"
                  >
                    {isSelected ? (
                      /* Blue active ring */
                      <div className="size-2.5 rounded-full border-2 border-blue-500 bg-white shadow-2xs transition-transform hover:scale-110" />
                    ) : (
                      /* Grey ring only visible on hover */
                      <div className="size-2.5 rounded-full border-2 border-neutral-400 opacity-0 group-hover:opacity-100 hover:!border-blue-500 hover:!scale-125 transition-all" />
                    )}
                  </button>
                )}
              </div>

              {/* Delete / Minus Button */}
              <button
                type="button"
                onClick={() => handleDeleteItem(index)}
                disabled={items.length <= 1}
                title="删除此项"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer",
                  items.length <= 1 && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground"
                )}
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RightPanel({
  element: rawElement,
  selectedElements,
  parent,
  pages,
  onUpdate,
  onBatchUpdate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onDuplicate,
}: RightPanelProps) {
  const [showIndependentRadius, setShowIndependentRadius] = useState(false);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "inspect">("design");

  const effectiveSelectedElements: EditorElement[] = useMemo(() => {
    if (selectedElements && selectedElements.length > 0) return selectedElements;
    if (rawElement) return [rawElement];
    return [];
  }, [selectedElements, rawElement]);

  const isMulti = effectiveSelectedElements.length > 1;
  const element: EditorElement | null = rawElement ?? effectiveSelectedElements[effectiveSelectedElements.length - 1] ?? null;

  const selectionBounds = useMemo(() => {
    return getSelectionBounds(effectiveSelectedElements);
  }, [effectiveSelectedElements]);

  const allVisible = effectiveSelectedElements.length > 0 && effectiveSelectedElements.every((el: EditorElement) => el.visible);
  const allLocked = effectiveSelectedElements.length > 0 && effectiveSelectedElements.every((el: EditorElement) => el.locked);

  if (effectiveSelectedElements.length === 0 || !element) {
    return (
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l bg-background/80 backdrop-blur-xl">
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <Square className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-medium text-foreground/70">未选中任何组件</p>
          <p className="mt-1 text-[11px] text-muted-foreground">在画布中点击或框选组件进行编辑</p>
        </div>
      </aside>
    );
  }

  // Alignment & Distribution Handlers
  const handleAlign = (type: AlignType) => {
    const patches = calculateAlign(effectiveSelectedElements, type, parent);
    if (patches.length === 0) return;
    if (patches.length === 1 && patches[0]) {
      onUpdate(patches[0].id, patches[0].patch);
    } else if (onBatchUpdate) {
      onBatchUpdate(patches);
    } else {
      patches.forEach((p: { id: string; patch: Partial<EditorElement> }) => onUpdate(p.id, p.patch));
    }
  };

  const handleDistribute = (type: DistributeType) => {
    const patches = calculateDistribute(effectiveSelectedElements, type);
    if (patches.length === 0) return;
    if (onBatchUpdate) {
      onBatchUpdate(patches);
    } else {
      patches.forEach((p: { id: string; patch: Partial<EditorElement> }) => onUpdate(p.id, p.patch));
    }
  };

  const handleToggleVisible = () => {
    if (isMulti) {
      const next = !allVisible;
      const patches = effectiveSelectedElements.map((el: EditorElement) => ({ id: el.id, patch: { visible: next } }));
      if (onBatchUpdate) onBatchUpdate(patches);
      else patches.forEach((p: { id: string; patch: Partial<EditorElement> }) => onUpdate(p.id, p.patch));
    } else if (element) {
      onUpdate(element.id, { visible: !element.visible });
    }
  };

  const handleToggleLocked = () => {
    if (isMulti) {
      const next = !allLocked;
      const patches = effectiveSelectedElements.map((el: EditorElement) => ({ id: el.id, patch: { locked: next } }));
      if (onBatchUpdate) onBatchUpdate(patches);
      else patches.forEach((p: { id: string; patch: Partial<EditorElement> }) => onUpdate(p.id, p.patch));
    } else if (element) {
      onUpdate(element.id, { locked: !element.locked });
    }
  };

  // Multi-Selection Geometry Handlers
  const handleMultiMoveX = (newX: number) => {
    if (!selectionBounds) return;
    const dx = newX - selectionBounds.minX;
    if (dx === 0) return;
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: { x: el.x + dx },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const handleMultiMoveY = (newY: number) => {
    if (!selectionBounds) return;
    const dy = newY - selectionBounds.minY;
    if (dy === 0) return;
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: { y: el.y + dy },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const handleMultiResizeW = (newW: number) => {
    if (!selectionBounds || selectionBounds.width <= 0) return;
    const targetW = Math.max(1, newW);
    const ratio = targetW / selectionBounds.width;
    const minX = selectionBounds.minX;
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: {
        x: Math.round(minX + (el.x - minX) * ratio),
        width: Math.max(1, Math.round(el.width * ratio)),
      },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const handleMultiResizeH = (newH: number) => {
    if (!selectionBounds || selectionBounds.height <= 0) return;
    const targetH = Math.max(1, newH);
    const ratio = targetH / selectionBounds.height;
    const minY = selectionBounds.minY;
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: {
        y: Math.round(minY + (el.y - minY) * ratio),
        height: Math.max(1, Math.round(el.height * ratio)),
      },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const handleMultiFlipH = () => {
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: { props: { ...el.props, flipH: !Boolean(el.props.flipH) } },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const handleMultiFlipV = () => {
    const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
      id: el.id,
      patch: { props: { ...el.props, flipV: !Boolean(el.props.flipV) } },
    }));
    if (onBatchUpdate) onBatchUpdate(patches);
  };

  const setProp = (key: string, value: string | number | boolean) => {
    if (isMulti) {
      const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
        id: el.id,
        patch: { props: { ...el.props, [key]: value } },
      }));
      if (onBatchUpdate) onBatchUpdate(patches);
    } else {
      onUpdate(element.id, { props: { ...element.props, [key]: value } });
    }
  };

  const setProps = (patch: Record<string, string | number | boolean>) => {
    if (isMulti) {
      const patches = effectiveSelectedElements.filter((el: EditorElement) => !el.locked).map((el: EditorElement) => ({
        id: el.id,
        patch: { props: { ...el.props, ...patch } },
      }));
      if (onBatchUpdate) onBatchUpdate(patches);
    } else {
      onUpdate(element.id, { props: { ...element.props, ...patch } });
    }
  };

  const prop = (key: string, fallback: string | number | boolean) => element.props[key] ?? fallback;

  // Geometry & Transforms
  const isLineLike = element.type === "line" || element.type === "arrow";
  const isTextLike = TEXT_TYPES.has(element.type);
  const isShapeWithText = SHAPE_TYPES_WITH_TEXT.has(element.type);

  const isStrokeSupported = isMulti
    ? effectiveSelectedElements.some((el) => STROKE_SUPPORTED_TYPES.has(el.type))
    : STROKE_SUPPORTED_TYPES.has(element.type);

  const isFillSupported = isMulti
    ? effectiveSelectedElements.some((el) => FILL_SUPPORTED_TYPES.has(el.type))
    : FILL_SUPPORTED_TYPES.has(element.type);

  const isRadiusSupported = isMulti
    ? effectiveSelectedElements.some((el) => RADIUS_SUPPORTED_TYPES.has(el.type))
    : RADIUS_SUPPORTED_TYPES.has(element.type);

  // Appearance Properties
  const fillEnabled = element.props.fillEnabled !== false && element.props.fillEnabled !== "false";
  const fill = String(prop("fill", "#FFFFFF"));
  const fillOpacity = Number(prop("fillOpacity", 100));
  const gradientEnabled = Boolean(prop("gradientEnabled", false));
  const gradientType = String(prop("gradientType", "linear"));
  const gradientAngle = Number(prop("gradientAngle", 90));
  const gradientStart = String(prop("gradientStart", "#3B82F6"));
  const gradientEnd = String(prop("gradientEnd", "#9333EA"));

  const strokeEnabled = element.props.strokeEnabled !== false && element.props.strokeEnabled !== "false";
  const stroke = String(prop("stroke", "#D4D4D8"));
  const strokeOpacity = Number(prop("strokeOpacity", 100));
  const borderWidth = Number(prop("borderWidth", 1));
  const strokeStyle = String(prop("strokeStyle", "solid"));
  const strokePosition = String(prop("strokePosition", "inside"));
  const strokeSides = String(prop("strokeSides", "all"));

  const radiusEnabled = element.props.radiusEnabled !== false && element.props.radiusEnabled !== "false";
  const radius = Number(prop("radius", 8));
  const radiusIndependent = Boolean(prop("radiusIndependent", false)) || showIndependentRadius;
  const radiusTopLeft = Number(prop("radiusTopLeft", radius));
  const radiusTopRight = Number(prop("radiusTopRight", radius));
  const radiusBottomRight = Number(prop("radiusBottomRight", radius));
  const radiusBottomLeft = Number(prop("radiusBottomLeft", radius));

  // Text Properties
  const textContent = String(prop("text", isTextLike ? "请输入文字" : ""));
  const hasText = isTextLike || Boolean(element.props.hasText) || textContent.length > 0;
  const fontSize = Number(prop("fontSize", 14));
  const fontWeight = Number(prop("fontWeight", 400));
  const fontFamily = String(prop("fontFamily", "PingFang SC, sans-serif"));
  const textColor = String(prop("textColor", "#18181B"));
  const textOpacity = Number(prop("textOpacity", 100));
  const textAlign = String(prop("textAlign", prop("align", "center")));
  const lineHeight = Number(prop("lineHeight", 20));
  const letterSpacing = Number(prop("letterSpacing", 0));
  const isBold = fontWeight >= 600 || Boolean(prop("bold", false));
  const isItalic = Boolean(prop("italic", false));
  const isUnderline = Boolean(prop("underline", false));
  const isStrikethrough = Boolean(prop("strikethrough", false));

  // Handle Dimension Ratio
  const handleWidthChange = (newW: number) => {
    const w = Math.max(1, newW);
    if (aspectLocked && element.width > 0) {
      const ratio = element.height / element.width;
      onUpdate(element.id, { width: w, height: Math.round(w * ratio) });
    } else {
      onUpdate(element.id, { width: w });
    }
  };

  const handleHeightChange = (newH: number) => {
    const h = Math.max(1, newH);
    if (aspectLocked && element.height > 0) {
      const ratio = element.width / element.height;
      onUpdate(element.id, { height: h, width: Math.round(h * ratio) });
    } else {
      onUpdate(element.id, { height: h });
    }
  };

  // Generate CSS Code for Inspect Tab
  const generateCSS = () => {
    if (isMulti) {
      const lines: string[] = [];
      lines.push(`/* 多选组: ${effectiveSelectedElements.length} 项组件 */`);
      if (selectionBounds) {
        lines.push(`/* 选区外接包围盒尺寸 */`);
        lines.push(`/* left: ${Math.round(selectionBounds.minX)}px; top: ${Math.round(selectionBounds.minY)}px; width: ${Math.round(selectionBounds.width)}px; height: ${Math.round(selectionBounds.height)}px; */`);
      }
      lines.push("");
      effectiveSelectedElements.forEach((el: EditorElement, i: number) => {
        lines.push(`/* [${i + 1}] ${el.name} (${el.type}) */`);
        lines.push(`.${el.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} {`);
        lines.push(`  width: ${Math.round(el.width)}px;`);
        lines.push(`  height: ${Math.round(el.height)}px;`);
        lines.push(`  left: ${Math.round(el.x)}px;`);
        lines.push(`  top: ${Math.round(el.y)}px;`);
        if (el.opacity < 1) lines.push(`  opacity: ${Math.round(el.opacity * 100)}%;`);
        lines.push(`}`);
        lines.push("");
      });
      return lines.join("\n");
    }

    const lines: string[] = [];
    lines.push(`/* ${element.name} (${element.type}) */`);
    lines.push(`width: ${Math.round(element.width)}px;`);
    lines.push(`height: ${Math.round(element.height)}px;`);
    if (element.rotation) lines.push(`transform: rotate(${Math.round(element.rotation)}deg);`);
    if (element.opacity < 1) lines.push(`opacity: ${Math.round(element.opacity * 100)}%;`);

    if (!fillEnabled) {
      lines.push(`background: transparent;`);
    } else if (gradientEnabled) {
      lines.push(`background: linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd});`);
    } else if (fill) {
      lines.push(`background-color: ${fill};`);
    }

    if (strokeEnabled && borderWidth > 0) {
      lines.push(`border: ${borderWidth}px ${strokeStyle} ${stroke};`);
    }

    if (radiusEnabled) {
      if (radiusIndependent) {
        lines.push(`border-radius: ${radiusTopLeft}px ${radiusTopRight}px ${radiusBottomRight}px ${radiusBottomLeft}px;`);
      } else if (radius > 0) {
        lines.push(`border-radius: ${radius}px;`);
      }
    }

    if (hasText && textContent) {
      lines.push(`color: ${textColor};`);
      lines.push(`font-size: ${fontSize}px;`);
      lines.push(`font-weight: ${fontWeight};`);
      lines.push(`text-align: ${textAlign};`);
      if (lineHeight) lines.push(`line-height: ${lineHeight}px;`);
    }

    return lines.join("\n");
  };

  const copyCSS = () => {
    void navigator.clipboard.writeText(generateCSS());
    showToast({
      type: "success",
      title: "CSS 已复制",
      description: "样式代码已复制到剪贴板",
      id: "copy-css",
    });
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l bg-background/80 backdrop-blur-xl">
      {/* Header & Tabs */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex gap-1 rounded-md bg-muted/60 p-0.5 text-xs">
            <button
              type="button"
              className={cn("rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors", activeTab === "design" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setActiveTab("design")}
            >
              设计
            </button>
            <button
              type="button"
              className={cn("rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors", activeTab === "inspect" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setActiveTab("inspect")}
            >
              代码 / Inspect
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              title={allVisible ? "隐藏" : "显示"}
              onClick={handleToggleVisible}
            >
              {allVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title={allLocked ? "解锁" : "锁定"}
              onClick={handleToggleLocked}
            >
              {allLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              title="删除"
              className="text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Name input or multi-selection badge */}
        {isMulti ? (
          <div className="flex items-center justify-between gap-1.5 rounded-md bg-blue-50/70 border border-blue-200/60 px-2 py-1 dark:bg-blue-950/30 dark:border-blue-800/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">
                已选中 {effectiveSelectedElements.length} 个组件
              </span>
            </div>
            <span className="shrink-0 rounded bg-blue-100 dark:bg-blue-900 px-1 py-0.2 text-[9px] font-mono font-medium text-blue-700 dark:text-blue-300">
              MULTI
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              size="sm"
              value={element.name}
              onChange={(e) => onUpdate(element.id, { name: e.target.value })}
              className="h-7 min-w-0 flex-1 font-medium text-xs"
            />
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted-foreground">
              {element.type}
            </span>
          </div>
        )}

        {/* Quick Layer Operations */}
        <div className="mt-2 flex items-center justify-between gap-1 rounded bg-muted/40 p-1">
          <Button
            variant="ghost"
            size="icon-xs"
            title="置顶图层"
            onClick={onBringToFront}
            disabled={!onBringToFront}
          >
            <BringToFront className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="上移一层"
            onClick={onBringForward}
            disabled={!onBringForward || isMulti}
          >
            <ArrowUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="下移一层"
            onClick={onSendBackward}
            disabled={!onSendBackward || isMulti}
          >
            <ArrowDown className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="置底图层"
            onClick={onSendToBack}
            disabled={!onSendToBack}
          >
            <SendToBack className="size-3" />
          </Button>
          <Separator orientation="vertical" className="h-3.5" />
          <Button
            variant="ghost"
            size="icon-xs"
            title="复制"
            onClick={onDuplicate}
            disabled={!onDuplicate}
          >
            <Copy className="size-3" />
          </Button>
        </div>
      </div>

      {activeTab === "inspect" ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">CSS 样式</span>
            <Button size="xs" variant="outline" className="gap-1 text-xs" onClick={copyCSS}>
              <Copy className="size-3" />
              复制 CSS
            </Button>
          </div>
          <pre className="rounded-md border bg-muted/50 p-2.5 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {generateCSS()}
          </pre>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Alignment Tools (8 operations: 6 align + 2 distribute) */}
          <Section title="对齐与分布">
            <div className="flex items-center justify-between gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "左对齐 (选区左侧)" : "左对齐 (容器)"}
                onClick={() => handleAlign("left")}
              >
                <AlignStartVertical className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "水平居中 (选区中轴)" : "水平居中 (容器)"}
                onClick={() => handleAlign("horizontal-center")}
              >
                <AlignCenterVertical className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "右对齐 (选区右侧)" : "右对齐 (容器)"}
                onClick={() => handleAlign("right")}
              >
                <AlignEndVertical className="size-3.5" />
              </Button>

              <Separator orientation="vertical" className="mx-0.5 h-3.5" />

              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "顶对齐 (选区顶侧)" : "顶对齐 (容器)"}
                onClick={() => handleAlign("top")}
              >
                <AlignStartHorizontal className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "垂直居中 (选区中轴)" : "垂直居中 (容器)"}
                onClick={() => handleAlign("vertical-center")}
              >
                <AlignCenterHorizontal className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                title={isMulti ? "底对齐 (选区底侧)" : "底对齐 (容器)"}
                onClick={() => handleAlign("bottom")}
              >
                <AlignEndHorizontal className="size-3.5" />
              </Button>

              <Separator orientation="vertical" className="mx-0.5 h-3.5" />

              <Button
                variant="ghost"
                size="icon-xs"
                disabled={effectiveSelectedElements.length < 3}
                title={
                  effectiveSelectedElements.length >= 3
                    ? "水平等间距分布"
                    : "水平等间距分布 (需选中 3 个及以上组件)"
                }
                className={cn(effectiveSelectedElements.length < 3 && "opacity-35 cursor-not-allowed")}
                onClick={() => handleDistribute("horizontal")}
              >
                <AlignHorizontalSpaceBetween className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={effectiveSelectedElements.length < 3}
                title={
                  effectiveSelectedElements.length >= 3
                    ? "垂直等间距分布"
                    : "垂直等间距分布 (需选中 3 个及以上组件)"
                }
                className={cn(effectiveSelectedElements.length < 3 && "opacity-35 cursor-not-allowed")}
                onClick={() => handleDistribute("vertical")}
              >
                <AlignVerticalSpaceBetween className="size-3.5" />
              </Button>
            </div>
          </Section>

          {/* Geometry & Transform */}
          <Section title="尺寸与变换">
            {isMulti && selectionBounds ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <NumField label="X" value={Math.round(selectionBounds.minX)} min={-10000} onChange={handleMultiMoveX} />
                  <NumField label="Y" value={Math.round(selectionBounds.minY)} min={-10000} onChange={handleMultiMoveY} />
                </div>
                <div className="flex items-center gap-1.5">
                  <NumField label="W" value={Math.round(selectionBounds.width)} min={1} onChange={handleMultiResizeW} />
                  <NumField label="H" value={Math.round(selectionBounds.height)} min={1} onChange={handleMultiResizeH} />
                </div>
                <div className="flex items-center justify-end gap-1 pt-0.5">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                    title="批量水平翻转"
                    onClick={handleMultiFlipH}
                  >
                    <FlipHorizontal className="size-3" />
                    <span>水平翻转</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                    title="批量垂直翻转"
                    onClick={handleMultiFlipV}
                  >
                    <FlipVertical className="size-3" />
                    <span>垂直翻转</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <NumField label="X" value={Math.round(element.x)} min={-10000} onChange={(v) => onUpdate(element.id, { x: v })} />
                  <NumField label="Y" value={Math.round(element.y)} min={-10000} onChange={(v) => onUpdate(element.id, { y: v })} />
                </div>
                {isLineLike ? (
                  <div className="flex gap-1.5">
                    <NumField label="L" value={Math.round(element.width)} min={1} onChange={(v) => onUpdate(element.id, { width: Math.max(1, v) })} suffix="px" />
                    <NumField label="↺" value={Math.round(element.rotation)} onChange={(v) => onUpdate(element.id, { rotation: v })} suffix="°" />
                  </div>
                ) : element.type === "connector" ? (
                  <div className="rounded-md bg-muted/40 p-2 text-[10px] text-muted-foreground flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span>起点连接:</span>
                      <span className="font-medium text-foreground">
                        {element.props.startElementId ? "已绑定节点" : "自由端点"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>终点连接:</span>
                      <span className="font-medium text-foreground">
                        {element.props.endElementId ? "已绑定节点" : "自由端点"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <NumField label="W" value={Math.round(element.width)} min={1} onChange={handleWidthChange} />
                      <NumField label="H" value={Math.round(element.height)} min={1} onChange={handleHeightChange} />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        title={aspectLocked ? "解除等比缩放" : "锁定宽高比"}
                        className={cn("size-7 shrink-0", aspectLocked && "bg-primary/10 text-primary")}
                        onClick={() => setAspectLocked(!aspectLocked)}
                      >
                        {aspectLocked ? <Link2 className="size-3.5" /> : <Unlink2 className="size-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <NumField label="↺" value={Math.round(element.rotation)} onChange={(v) => onUpdate(element.id, { rotation: v })} suffix="°" />
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="水平翻转"
                          className={cn("size-7", Boolean(prop("flipH", false)) && "bg-primary/10 text-primary")}
                          onClick={() => setProp("flipH", !Boolean(prop("flipH", false)))}
                        >
                          <FlipHorizontal className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          title="垂直翻转"
                          className={cn("size-7", Boolean(prop("flipV", false)) && "bg-primary/10 text-primary")}
                          onClick={() => setProp("flipV", !Boolean(prop("flipV", false)))}
                        >
                          <FlipVertical className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* Content & Text Section - 内容与文案 */}
          {element.type !== "line" && element.type !== "arrow" && (
            <Section title="内容与文案" collapsible defaultOpen={true}>
              <div className="flex flex-col gap-2.5 text-xs">
                {/* 1. Switches */}
                {(element.type === "switch-android" || element.type === "switch-ios" || element.type === "switch") && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">开关文案</span>
                      <Input
                        size="sm"
                        value={String(prop("label", element.type === "switch-android" ? "开启通知" : "自动同步"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        placeholder="输入开关标签..."
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">开关状态</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("checked", true) !== false && prop("checked", true) !== "false"}
                          onCheckedChange={(c) => setProp("checked", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">
                          {prop("checked", true) !== false && prop("checked", true) !== "false" ? "默认开启 (ON)" : "默认关闭 (OFF)"}
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* 2. Radio Button */}
                {element.type === "radio" && (
                  <OptionsListEditor
                    title="选项"
                    mode="single"
                    value={String(prop("options", "选项1,选项2,选项3,选项4"))}
                    selectedIndex={Number(prop("selectedIndex", 0))}
                    onSelectIndex={(idx) => setProp("selectedIndex", idx)}
                    onChange={(v) => setProp("options", v)}
                    placeholder="选项名称..."
                  />
                )}

                {/* 3. Checkbox */}
                {element.type === "checkbox" && (() => {
                  const checkedIndices = String(prop("checkedIndices", "0"))
                    .split(",")
                    .map((n) => Number(n.trim()))
                    .filter((n) => !isNaN(n));

                  return (
                    <OptionsListEditor
                      title="选项"
                      mode="multiple"
                      value={String(prop("options", "我已阅读并同意条款,记住登录状态"))}
                      selectedIndices={checkedIndices}
                      onToggleIndex={(idx) => {
                        const next = checkedIndices.includes(idx)
                          ? checkedIndices.filter((i) => i !== idx)
                          : [...checkedIndices, idx];
                        setProp("checkedIndices", next.join(","));
                      }}
                      onChange={(v) => setProp("options", v)}
                      placeholder="选项名称..."
                    />
                  );
                })()}

                {/* 4. Dropdown Menu */}
                {element.type === "dropdown-menu" && (
                  <OptionsListEditor
                    title="下拉菜单项"
                    mode="none"
                    value={String(prop("items", "个人中心,账号设置,退出登录"))}
                    onChange={(v) => setProp("items", v)}
                    placeholder="菜单项..."
                  />
                )}

                {/* 5. Popup Menu */}
                {element.type === "popup-menu" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">菜单标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "更多操作"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        placeholder="菜单标题..."
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="菜单项列表"
                      mode="none"
                      value={String(prop("items", "配置详情,分享项目,删除项目"))}
                      onChange={(v) => setProp("items", v)}
                      placeholder="菜单项..."
                    />
                  </>
                )}

                {/* 6. Navbar */}
                {element.type === "navbar" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Logo 文本</span>
                      <Input
                        size="sm"
                        value={String(prop("logoText", "LOGO"))}
                        onChange={(e) => setProp("logoText", e.target.value)}
                        placeholder="品牌/系统名称"
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="导航链接"
                      mode="none"
                      value={String(prop("links", "首页,功能,定价,帮助"))}
                      onChange={(v) => setProp("links", v)}
                      placeholder="链接名称..."
                    />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">登录文案</span>
                        <Input
                          size="sm"
                          value={String(prop("loginText", "登录"))}
                          onChange={(e) => setProp("loginText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">注册文案</span>
                        <Input
                          size="sm"
                          value={String(prop("signupText", "免费注册"))}
                          onChange={(e) => setProp("signupText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 7. Tabs */}
                {element.type === "tabs" && (
                  <OptionsListEditor
                    title="标签页"
                    mode="single"
                    value={String(prop("tabs", "全部,待处理,已完成"))}
                    selectedIndex={Number(prop("activeIndex", 0))}
                    onSelectIndex={(idx) => setProp("activeIndex", idx)}
                    onChange={(v) => setProp("tabs", v)}
                    placeholder="标签名称..."
                  />
                )}

                {/* 8. Breadcrumb */}
                {element.type === "breadcrumb" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">路径节点</span>
                    <Input
                      size="sm"
                      value={String(prop("path", "首页 / 系统管理 / 用户列表"))}
                      onChange={(e) => setProp("path", e.target.value)}
                      placeholder="首页 / 模块 / 页面"
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* 9. Stepper Nav */}
                {element.type === "stepper-nav" && (
                  <OptionsListEditor
                    title="步骤列表"
                    mode="single"
                    value={String(prop("steps", "填写信息,确认订单,完成"))}
                    selectedIndex={Math.max(0, Number(prop("currentStep", 2)) - 1)}
                    onSelectIndex={(idx) => setProp("currentStep", idx + 1)}
                    onChange={(v) => setProp("steps", v)}
                    placeholder="步骤名称..."
                  />
                )}

                {/* 10. Pagination */}
                {element.type === "pagination" && (
                  <div className="flex items-center gap-2">
                    <NumField label="当前页" value={Number(prop("current", 1))} min={1} onChange={(v) => setProp("current", Math.max(1, v))} />
                    <NumField label="总页数" value={Number(prop("total", 10))} min={1} onChange={(v) => setProp("total", Math.max(1, v))} />
                  </div>
                )}

                {/* 11. Stat */}
                {element.type === "stat" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">指标数值</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "¥ 88,240"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">指标名称</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "今日成交金额"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">浮动比例</span>
                      <Input
                        size="sm"
                        value={String(prop("change", "+15.2%"))}
                        onChange={(e) => setProp("change", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 12. File Upload */}
                {element.type === "file-upload" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">主提示语</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "点击或将文件拖拽到这里上传"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">辅助说明</span>
                      <Input
                        size="sm"
                        value={String(prop("hint", "支持 png, jpg, pdf 格式"))}
                        onChange={(e) => setProp("hint", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 13. Modal Dialog */}
                {element.type === "modal-dialog" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">弹窗标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "弹窗浮层标题"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">提示说明内容</span>
                      <textarea
                        value={String(prop("text", "这里是浮层提示内容或表单区域"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">确定按钮</span>
                        <Input
                          size="sm"
                          value={String(prop("confirmText", "确定"))}
                          onChange={(e) => setProp("confirmText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">取消按钮</span>
                        <Input
                          size="sm"
                          value={String(prop("cancelText", "取消"))}
                          onChange={(e) => setProp("cancelText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 14. Alert */}
                {element.type === "alert" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "提示信息"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示内容</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "这里是系统操作的提示说明文本"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 15. Empty State */}
                {element.type === "empty-state" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">主标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "暂无数据"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">详细说明</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "点击下方按钮创建第一条记录"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">按钮文案</span>
                      <Input
                        size="sm"
                        value={String(prop("buttonText", "立即创建"))}
                        onChange={(e) => setProp("buttonText", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 16. Card */}
                {element.type === "card" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">卡片标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "卡片标题"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">标签角标</span>
                      <Input
                        size="sm"
                        value={String(prop("tag", "推荐"))}
                        onChange={(e) => setProp("tag", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">卡片说明</span>
                      <textarea
                        value={String(prop("text", "这里是卡片的详细说明文本或业务说明..."))}
                        onChange={(e) => setProp("text", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}

                {/* 17. Mind Map */}
                {element.type === "mind-map" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">中心主题</span>
                      <Input
                        size="sm"
                        value={String(prop("rootTitle", "中心主题"))}
                        onChange={(e) => setProp("rootTitle", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="分支节点列表"
                      mode="none"
                      value={String(prop("nodes", "分支节点 1,分支节点 2"))}
                      onChange={(v) => setProp("nodes", v)}
                      placeholder="分支名称..."
                    />
                  </>
                )}

                {/* 18. Code Block */}
                {element.type === "code-block" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">文件名</span>
                      <Input
                        size="sm"
                        value={String(prop("filename", "app.ts"))}
                        onChange={(e) => setProp("filename", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">代码内容</span>
                      <textarea
                        value={String(prop("code", "const app = new Bluepen();\napp.setMode('wireframe');\napp.export('png', { scale: 2 });"))}
                        onChange={(e) => setProp("code", e.target.value)}
                        rows={4}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}

                {/* 19. AI Component */}
                {element.type === "ai-component" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">AI 提示词</span>
                      <Input
                        size="sm"
                        value={String(prop("prompt", "AI 智能生成原型模块"))}
                        onChange={(e) => setProp("prompt", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">辅助提示</span>
                      <Input
                        size="sm"
                        value={String(prop("hint", "输入提示词，自动构建线框元件"))}
                        onChange={(e) => setProp("hint", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 20. Table */}
                {element.type === "table" && (
                  <>
                    <OptionsListEditor
                      title="表头列名"
                      mode="none"
                      value={String(prop("headers", "姓名,角色,部门,状态"))}
                      onChange={(v) => setProp("headers", v)}
                      placeholder="列名..."
                    />
                    <div className="flex gap-2 pt-0.5">
                      <NumField label="行" value={Number(prop("rows", 4))} min={1} onChange={(v) => setProp("rows", Math.max(1, v))} />
                      <NumField label="列" value={Number(prop("cols", 4))} min={1} onChange={(v) => setProp("cols", Math.max(1, v))} />
                    </div>
                  </>
                )}

                {/* 21. Sticky Note */}
                {element.type === "sticky-note" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">批注标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "需求说明"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">批注内容</span>
                      <textarea
                        value={String(prop("text", "此处为需求说明与交互批注..."))}
                        onChange={(e) => setProp("text", e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}

                {/* 22. Pin Note */}
                {element.type === "pin-note" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">打点序号</span>
                    <Input
                      size="sm"
                      value={String(prop("index", "1"))}
                      onChange={(e) => setProp("index", e.target.value)}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                )}

                {/* 23. Avatar */}
                {element.type === "avatar" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">缩写头像</span>
                    <Input
                      size="sm"
                      value={String(prop("initials", "JD"))}
                      onChange={(e) => setProp("initials", e.target.value)}
                      maxLength={4}
                      className="h-7 text-xs font-bold uppercase"
                    />
                  </div>
                )}

                {/* 24. Badge / Chip / Link / Divider */}
                {(element.type === "badge" || element.type === "chip" || element.type === "link" || element.type === "divider") && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">文案</span>
                    <Input
                      size="sm"
                      value={String(prop("text", element.type === "divider" ? "OR" : "标签"))}
                      onChange={(e) => setProp("text", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* 25. Placeholder / Hotspot / Image */}
                {(element.type === "placeholder" || element.type === "hotspot" || element.type === "image") && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">说明文案</span>
                    <Input
                      size="sm"
                      value={String(prop("label", element.type === "hotspot" ? "热区 / Hotspot" : element.type === "image" ? "图片占位" : "占位符"))}
                      onChange={(e) => setProp("label", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* 26. Stepper / Slider */}
                {element.type === "stepper" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">计数值</span>
                    <Input
                      size="sm"
                      value={String(prop("value", "1"))}
                      onChange={(e) => setProp("value", e.target.value)}
                      className="h-7 text-xs font-semibold"
                    />
                  </div>
                )}
                {element.type === "slider" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">滑块值</span>
                    <NumField
                      value={Number(prop("value", 65))}
                      min={0}
                      max={100}
                      onChange={(v) => setProp("value", v)}
                      suffix="%"
                    />
                  </div>
                )}

                {/* 27. Date Picker / Search */}
                {(element.type === "date-picker" || element.type === "search") && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">占位提示</span>
                    <Input
                      size="sm"
                      value={String(prop("placeholder", element.type === "date-picker" ? "选择日期..." : "搜索关键词..."))}
                      onChange={(e) => setProp("placeholder", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* 28. Input / Textarea / Select */}
                {(element.type === "input" || element.type === "textarea" || element.type === "select") && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", ""))}
                        onChange={(e) => setProp("label", e.target.value)}
                        placeholder="输入框标题 (选填)"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">占位提示</span>
                      <Input
                        size="sm"
                        value={String(prop("placeholder", ""))}
                        onChange={(e) => setProp("placeholder", e.target.value)}
                        placeholder={element.type === "select" ? "请选择..." : "请输入..."}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 29. Frames */}
                {element.type === "browser-frame" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">地址栏</span>
                    <Input
                      size="sm"
                      value={String(prop("url", "https://wireframe.design/app"))}
                      onChange={(e) => setProp("url", e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                )}
                {element.type === "mobile-frame" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">设备型号</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "iPhone 16"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">状态栏时间</span>
                      <Input
                        size="sm"
                        value={String(prop("time", "9:41"))}
                        onChange={(e) => setProp("time", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* 30. Text / Button / Document / General Text */}
                {(element.type === "text" || element.type === "button" || element.type === "button-primary" || element.type === "document") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">文本内容</span>
                    <textarea
                      value={String(prop(element.type === "document" ? "title" : "text", element.type.startsWith("button") ? "按钮" : "文本内容"))}
                      onChange={(e) => setProp(element.type === "document" ? "title" : "text", e.target.value)}
                      rows={element.type === "text" ? 3 : 1}
                      className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                )}

                {/* 31. Connector Line Settings */}
                {element.type === "connector" && (
                  <div className="flex flex-col gap-2.5">
                    {/* Routing Type */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">连线分支</span>
                      <div className="flex flex-1 gap-1">
                        {[
                          { id: "orthogonal", label: "折线" },
                          { id: "straight", label: "直线" },
                          { id: "curved", label: "曲线" },
                        ].map((rt) => (
                          <Button
                            key={rt.id}
                            variant="ghost"
                            size="xs"
                            className={cn(
                              "flex-1 h-6 text-[10px] border",
                              String(prop("routing", "orthogonal")) === rt.id
                                ? "bg-foreground text-background font-semibold"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => setProp("routing", rt.id)}
                          >
                            {rt.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Arrow Markers (Start & End) */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex flex-1 items-center gap-1">
                        <span className="shrink-0 text-[10px] text-muted-foreground">起点</span>
                        <div className="flex flex-1 gap-0.5">
                          {[
                            { id: "none", label: "无" },
                            { id: "arrow", label: "箭头" },
                            { id: "circle", label: "圆点" },
                          ].map((ar) => (
                            <Button
                              key={ar.id}
                              variant="ghost"
                              size="xs"
                              className={cn(
                                "flex-1 h-6 px-1 text-[9px] border",
                                String(prop("startArrow", "none")) === ar.id
                                  ? "bg-foreground text-background font-semibold"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setProp("startArrow", ar.id)}
                            >
                              {ar.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-1 items-center gap-1">
                        <span className="shrink-0 text-[10px] text-muted-foreground">终点</span>
                        <div className="flex flex-1 gap-0.5">
                          {[
                            { id: "none", label: "无" },
                            { id: "arrow", label: "箭头" },
                            { id: "circle", label: "圆点" },
                          ].map((ar) => (
                            <Button
                              key={ar.id}
                              variant="ghost"
                              size="xs"
                              className={cn(
                                "flex-1 h-6 px-1 text-[9px] border",
                                String(prop("endArrow", "arrow")) === ar.id
                                  ? "bg-foreground text-background font-semibold"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                              onClick={() => setProp("endArrow", ar.id)}
                            >
                              {ar.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Corner Radius */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">转折圆角</span>
                      <NumField
                        value={Number(prop("radius", 8))}
                        min={0}
                        max={32}
                        onChange={(v) => setProp("radius", v)}
                        suffix="px"
                      />
                    </div>

                    {/* Line Label */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">连线文本</span>
                      <Input
                        size="sm"
                        value={String(prop("text", ""))}
                        onChange={(e) => setProp("text", e.target.value)}
                        placeholder="如：是 / 否 / 条件"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 32. Flowchart Shape Text Content */}
                {element.type.startsWith("flow-") && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">节点文本</span>
                    <textarea
                      value={String(prop("text", ""))}
                      onChange={(e) => setProp("text", e.target.value)}
                      placeholder="输入流程图节点文字..."
                      rows={2}
                      className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Appearance Section - 方案 A: 独立勾选开关 */}
          <Section title="外观">
            <div className="flex flex-col gap-3">
              {/* 0. 不透明度 Opacity */}
              <div className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-[10px] text-muted-foreground">不透明度</span>
                <Slider
                  className="min-w-0 flex-1"
                  value={[Math.round(element.opacity * 100)]}
                  min={0}
                  max={100}
                  onValueChange={(v) =>
                    onUpdate(element.id, { opacity: (Array.isArray(v) ? (v[0] ?? 100) : (v ?? 100)) / 100 })
                  }
                />
                <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                  {Math.round(element.opacity * 100)}%
                </span>
              </div>
              {/* 1. 圆角 Corner Radius */}
              {isRadiusSupported && element.type !== "circle" && !isLineLike && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={radiusEnabled}
                        onCheckedChange={(c) => setProp("radiusEnabled", Boolean(c))}
                      />
                      <span className="text-[11px] font-medium text-foreground/80">圆角</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title={radiusIndependent ? "统一圆角" : "独立四角圆角"}
                      className={cn("size-6", radiusIndependent && "bg-primary/10 text-primary")}
                      onClick={() => {
                        const next = !radiusIndependent;
                        setShowIndependentRadius(next);
                        setProp("radiusIndependent", next);
                      }}
                    >
                      <Maximize2 className="size-3" />
                    </Button>
                  </div>

                  {radiusEnabled && (
                    <>
                      {!radiusIndependent ? (
                        <div className="pl-6">
                          <NumField
                            label=""
                            value={radius}
                            min={0}
                            onChange={(v) => setProp("radius", Math.max(0, v))}
                            suffix="px"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 pl-6">
                          <NumField label="TL" value={radiusTopLeft} min={0} onChange={(v) => setProp("radiusTopLeft", Math.max(0, v))} />
                          <NumField label="TR" value={radiusTopRight} min={0} onChange={(v) => setProp("radiusTopRight", Math.max(0, v))} />
                          <NumField label="BL" value={radiusBottomLeft} min={0} onChange={(v) => setProp("radiusBottomLeft", Math.max(0, v))} />
                          <NumField label="BR" value={radiusBottomRight} min={0} onChange={(v) => setProp("radiusBottomRight", Math.max(0, v))} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 2. 填充 Fill (方案 A 核心: 独立勾选开关 + 渐变/透明支持) */}
              {isFillSupported && !isLineLike && element.type !== "text" && (
                <div className="flex flex-col gap-1.5 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={fillEnabled}
                        onCheckedChange={(c) => setProp("fillEnabled", Boolean(c))}
                      />
                      <span className="text-[11px] font-medium text-foreground/80">填充</span>
                    </label>

                    {fillEnabled && (
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button variant="ghost" size="xs" className="h-5 px-1.5 text-[10px] text-muted-foreground gap-1">
                              <span>{gradientEnabled ? (gradientType === "radial" ? "径向渐变" : "线性渐变") : "纯色填充"}</span>
                              <ChevronDown className="size-2.5 opacity-60" />
                            </Button>
                          }
                        />
                        <MenuPopup align="end">
                          <MenuItem onClick={() => setProps({ gradientEnabled: false, fill: fill === "transparent" ? "#FFFFFF" : fill })}>
                            纯色填充
                          </MenuItem>
                          <MenuItem onClick={() => setProps({ gradientEnabled: true, gradientType: "linear" })}>
                            线性渐变
                          </MenuItem>
                          <MenuItem onClick={() => setProps({ gradientEnabled: true, gradientType: "radial" })}>
                            径向渐变
                          </MenuItem>
                          <MenuItem onClick={() => setProps({ gradientEnabled: false, fill: "transparent" })}>
                            透明 / 无填充
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    )}
                  </div>

                  {fillEnabled && (
                    <div className="flex flex-col gap-1.5 pl-6">
                      {!gradientEnabled ? (
                        <ColorPickerRow
                          title="填充颜色"
                          color={fill}
                          opacity={fillOpacity}
                          onChange={(c, o) => setProps({ fill: c, fillOpacity: o })}
                          onColorChange={(c) => setProp("fill", c)}
                          onOpacityChange={(o) => setProp("fillOpacity", o)}
                        />
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 shrink-0 text-[10px] text-muted-foreground">起止色</span>
                            <div className="flex flex-1 items-center gap-1.5">
                              <Popover>
                                <PopoverTrigger
                                  render={
                                    <button
                                      type="button"
                                      className="group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                      title="选择起始颜色"
                                    >
                                      <ColorSwatchBadge color={gradientStart} opacity={fillOpacity} className="size-6 transition-transform group-hover:scale-105" />
                                    </button>
                                  }
                                />
                                <PopoverPopup backdrop={true} align="start" sideOffset={6} className="p-0 border-border/80 shadow-xl">
                                  <ColorPickerPanel
                                    title="渐变起始色"
                                    color={gradientStart}
                                    opacity={fillOpacity}
                                    onChange={(c) => setProp("gradientStart", c)}
                                  />
                                </PopoverPopup>
                              </Popover>

                              <Popover>
                                <PopoverTrigger
                                  render={
                                    <button
                                      type="button"
                                      className="group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                      title="选择结束颜色"
                                    >
                                      <ColorSwatchBadge color={gradientEnd} opacity={fillOpacity} className="size-6 transition-transform group-hover:scale-105" />
                                    </button>
                                  }
                                />
                                <PopoverPopup backdrop={true} align="start" sideOffset={6} className="p-0 border-border/80 shadow-xl">
                                  <ColorPickerPanel
                                    title="渐变结束色"
                                    color={gradientEnd}
                                    opacity={fillOpacity}
                                    onChange={(c) => setProp("gradientEnd", c)}
                                  />
                                </PopoverPopup>
                              </Popover>

                              {gradientType === "linear" && (
                                <NumField
                                  label="∠"
                                  value={gradientAngle}
                                  min={0}
                                  max={360}
                                  onChange={(v) => setProp("gradientAngle", v)}
                                  suffix="°"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. 描边 Stroke & Borders */}
              {isStrokeSupported && (
                <div className="flex flex-col gap-1.5 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={strokeEnabled}
                        onCheckedChange={(c) => setProp("strokeEnabled", Boolean(c))}
                      />
                      <span className="text-[11px] font-medium text-foreground/80">{isLineLike ? "线条" : "描边"}</span>
                    </label>

                    {strokeEnabled && !isLineLike && (
                      <div className="flex items-center gap-1">
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button variant="ghost" size="xs" className="h-5 px-1.5 text-[10px] text-muted-foreground gap-0.5">
                                <span>
                                  {strokePosition === "outside" ? "外描边" : strokePosition === "center" ? "居中" : "内描边"}
                                </span>
                                <ChevronDown className="size-2.5 opacity-60" />
                              </Button>
                            }
                          />
                          <MenuPopup align="end">
                            <MenuItem onClick={() => setProp("strokePosition", "inside")}>内描边 (Inside)</MenuItem>
                            <MenuItem onClick={() => setProp("strokePosition", "center")}>居中描边 (Center)</MenuItem>
                            <MenuItem onClick={() => setProp("strokePosition", "outside")}>外描边 (Outside)</MenuItem>
                          </MenuPopup>
                        </Menu>
                      </div>
                    )}
                  </div>

                  {strokeEnabled && (
                    <div className="flex flex-col gap-1.5 pl-6">
                      <ColorPickerRow
                        title={isLineLike ? "线条颜色" : "描边颜色"}
                        color={stroke}
                        opacity={strokeOpacity}
                        onChange={(c, o) => setProps({ stroke: c, strokeOpacity: o })}
                        onColorChange={(c) => setProp("stroke", c)}
                        onOpacityChange={(o) => setProp("strokeOpacity", o)}
                      />

                      {/* Width & Style Row */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <NumField
                          label=""
                          value={borderWidth}
                          min={1}
                          onChange={(v) => setProp("borderWidth", Math.max(1, v))}
                          suffix="px"
                        />
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button variant="outline" size="xs" className="h-7 w-20 justify-between text-[10px]">
                                <span>
                                  {strokeStyle === "dashed" ? "虚线" : strokeStyle === "dotted" ? "点线" : "实线"}
                                </span>
                                <ChevronDown className="size-2.5" />
                              </Button>
                            }
                          />
                          <MenuPopup align="end">
                            <MenuItem onClick={() => setProp("strokeStyle", "solid")}>实线 (Solid)</MenuItem>
                            <MenuItem onClick={() => setProp("strokeStyle", "dashed")}>虚线 (Dashed)</MenuItem>
                            <MenuItem onClick={() => setProp("strokeStyle", "dotted")}>点线 (Dotted)</MenuItem>
                          </MenuPopup>
                        </Menu>

                        {!isLineLike && (
                          <Menu>
                            <MenuTrigger
                              render={
                                <Button variant="outline" size="xs" className="h-7 w-20 justify-between text-[10px]">
                                  <span>
                                    {strokeSides === "top"
                                      ? "仅上"
                                      : strokeSides === "bottom"
                                      ? "仅下"
                                      : strokeSides === "left"
                                      ? "仅左"
                                      : strokeSides === "right"
                                      ? "仅右"
                                      : "全边框"}
                                  </span>
                                  <ChevronDown className="size-2.5" />
                                </Button>
                              }
                            />
                            <MenuPopup align="end">
                              <MenuItem onClick={() => setProp("strokeSides", "all")}>全部边框 (All)</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "top")}>仅上边框 (Top)</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "bottom")}>仅下边框 (Bottom)</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "left")}>仅左边框 (Left)</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "right")}>仅右边框 (Right)</MenuItem>
                            </MenuPopup>
                          </Menu>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Typography Section (文字排版 - 支持纯文本或形状内打字) */}
          {(isTextLike || isShapeWithText) && (
            <Section
              title="文本排版"
              collapsible
              defaultOpen={isTextLike || Boolean(element.props.hasText) || Boolean(textContent)}
            >
              <div className="flex flex-col gap-2">
                {/* Text Content */}
                <textarea
                  value={textContent}
                  onChange={(e) => {
                    setProp("text", e.target.value);
                    if (e.target.value) setProp("hasText", true);
                  }}
                  rows={2}
                  placeholder={isTextLike ? "输入文本内容…" : "在形状中输入文本…"}
                  className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {/* Font Family */}
                <Menu>
                  <MenuTrigger
                    render={
                      <Button variant="outline" size="xs" className="h-7 w-full justify-between text-xs font-normal">
                        <span>{FONT_FAMILIES.find((f) => f.value === fontFamily)?.label || fontFamily}</span>
                        <ChevronDown className="size-3 opacity-60" />
                      </Button>
                    }
                  />
                  <MenuPopup align="start">
                    {FONT_FAMILIES.map((f) => (
                      <MenuItem key={f.value} onClick={() => setProp("fontFamily", f.value)}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </MenuPopup>
                </Menu>

                {/* Text Color */}
                <ColorPickerRow
                  title="文字颜色"
                  color={textColor}
                  opacity={textOpacity}
                  onChange={(c, o) => setProps({ textColor: c, textOpacity: o })}
                  onColorChange={(c) => setProp("textColor", c)}
                  onOpacityChange={(o) => setProp("textOpacity", o)}
                />

                {/* Font Size & Weight */}
                <div className="flex items-center gap-1.5">
                  <NumField
                    label="Aa"
                    value={fontSize}
                    min={8}
                    max={120}
                    onChange={(v) => setProp("fontSize", Math.max(8, v))}
                    suffix="px"
                  />
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button variant="outline" size="xs" className="h-7 min-w-0 flex-1 justify-between text-[11px]">
                          <span>{WEIGHT_OPTIONS.find((w) => w.value === fontWeight)?.label ?? "Regular"}</span>
                          <ChevronDown className="size-3 opacity-60" />
                        </Button>
                      }
                    />
                    <MenuPopup align="end">
                      {WEIGHT_OPTIONS.map((w) => (
                        <MenuItem key={w.value} onClick={() => setProp("fontWeight", w.value)}>
                          {w.label}
                        </MenuItem>
                      ))}
                    </MenuPopup>
                  </Menu>
                </div>

                {/* Text Styles & Alignments */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {/* B / I / U / S */}
                  <div className="flex gap-0.5 rounded border p-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="粗体"
                      className={cn("size-6", isBold && "bg-foreground text-background")}
                      onClick={() => {
                        const next = !isBold;
                        setProps({ bold: next, fontWeight: next ? 700 : 400 });
                      }}
                    >
                      <Bold className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="斜体"
                      className={cn("size-6", isItalic && "bg-foreground text-background")}
                      onClick={() => setProp("italic", !isItalic)}
                    >
                      <Italic className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="下划线"
                      className={cn("size-6", isUnderline && "bg-foreground text-background")}
                      onClick={() => setProp("underline", !isUnderline)}
                    >
                      <Underline className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      title="删除线"
                      className={cn("size-6", isStrikethrough && "bg-foreground text-background")}
                      onClick={() => setProp("strikethrough", !isStrikethrough)}
                    >
                      <Strikethrough className="size-3" />
                    </Button>
                  </div>

                  {/* Horizontal Alignment */}
                  <div className="flex gap-0.5 rounded border p-0.5">
                    {[
                      { id: "left", icon: AlignLeft, title: "左对齐" },
                      { id: "center", icon: AlignCenter, title: "居中对齐" },
                      { id: "right", icon: AlignRight, title: "右对齐" },
                    ].map((al) => (
                      <Button
                        key={al.id}
                        variant="ghost"
                        size="icon-xs"
                        title={al.title}
                        className={cn("size-6", textAlign === al.id && "bg-foreground text-background")}
                        onClick={() => setProp("textAlign", al.id)}
                      >
                        <al.icon className="size-3" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Line Height & Letter Spacing */}
                <div className="flex items-center gap-1.5 pt-1">
                  <NumField
                    label="|A|"
                    value={letterSpacing}
                    min={-5}
                    max={50}
                    onChange={(v) => setProp("letterSpacing", v)}
                    suffix="px"
                  />
                  <NumField
                    label="AI"
                    value={lineHeight}
                    min={10}
                    max={200}
                    onChange={(v) => setProp("lineHeight", Math.max(10, v))}
                    suffix="px"
                  />
                </div>
              </div>
            </Section>
          )}
        </div>
      )}
    </aside>
  );
}
