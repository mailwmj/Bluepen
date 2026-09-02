"use client";

import { useState, useMemo, memo, useRef, useEffect } from "react";
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
  ChevronUp,
  ChevronRight,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
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
  Check,
  GripVertical,
  Upload,
  RotateCcw,
  Boxes,
  Ungroup,
} from "lucide-react";
import type { EditorElement, Page } from "./types";
import { showToast } from "./hooks/use-toast";
import { parseItems, parseMenuCategories } from "./library/web-renderers";
import { processImageFile } from "./utils/image";
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
  onGroup?: () => void;
  onUngroup?: () => void;
}


const FONT_FAMILIES = [
  { label: "系统默认", value: "var(--font-sans)" },
  { label: "微软雅黑", value: "'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif" },
  { label: "苹方", value: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', sans-serif" },
  { label: "思源黑体", value: "'Source Han Sans SC', 'Noto Sans SC', sans-serif" },
  { label: "Inter", value: "Inter, 'Microsoft YaHei UI', 'PingFang SC', sans-serif" },
  { label: "Roboto", value: "Roboto, 'Microsoft YaHei UI', 'PingFang SC', sans-serif" },
  { label: "等宽代码", value: "var(--font-mono)" },
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
  "button", "button-primary", "icon-button", "web-button", "web-button-group",
  "card", "mobile-frame", "browser-frame", "placeholder", "hotspot", "image", "scroll-panel", "modal-dialog", "modal",
  "badge", "chip", "avatar", "alert", "sticky-note", "code-block", "ai-component",
  "input", "textarea", "select", "date-picker", "search", "file-upload", "data-table",
  // Web form & inputs
  "web-input", "web-input-number", "web-textarea", "web-select", "web-cascader", "web-tree-select",
  "web-auto-complete", "web-tag-input", "web-date-picker", "web-date-range-picker", "web-time-picker",
  "web-color-picker", "web-upload", "web-transfer",
  // Web containers & cards
  "web-card", "web-statistic-card", "web-collapse", "web-filter-bar", "web-login-card",
  "web-table", "web-descriptions", "web-kanban", "web-calendar", "web-chart", "web-tree",
  // Web feedback & popups
  "web-modal", "web-drawer", "web-alert", "web-popconfirm", "web-notification",
  "web-tips", "web-message", "web-empty-state",
  // Web navigation & tags
  "web-tag", "web-badge", "web-dropdown", "web-menu", "web-tabs", "web-pagination",
  // Agent templates & components
  "agent-home-layout", "agent-chat-stream-layout", "agent-split-workspace-layout",
  "agent-employee-workspace-layout", "agent-employee-market-layout",
  "agent-nav-sidebar", "agent-sidebar-header", "agent-mode-switch", "agent-new-task-button",
  "agent-session-list", "agent-project-tree", "agent-sidebar-nav", "agent-user-footer",
  "agent-prompt-box", "agent-model-badge", "agent-prompt-toolbar", "agent-prompt-suggestions",
  "agent-user-message", "agent-session-header", "agent-status-badge",
  "agent-stream-header", "agent-tool-step", "agent-thought-stream", "agent-file-attachments",
  "agent-employee-card", "agent-template-card", "agent-artifact-tabs", "agent-console-table",
  ...FLOWCHART_TYPES,
]);

const FILL_SUPPORTED_TYPES = new Set([
  "rectangle", "circle", "button", "button-primary", "icon-button", "web-button", "web-button-group",
  "card", "mobile-frame", "browser-frame", "placeholder", "hotspot", "image", "scroll-panel", "modal-dialog", "modal",
  "badge", "chip", "avatar", "alert", "sticky-note", "code-block", "ai-component",
  "input", "textarea", "select", "date-picker", "search", "file-upload", "data-table",
  // Web form & inputs
  "web-input", "web-input-number", "web-textarea", "web-select", "web-cascader", "web-tree-select",
  "web-auto-complete", "web-tag-input", "web-date-picker", "web-date-range-picker", "web-time-picker",
  "web-color-picker", "web-upload", "web-transfer",
  // Web containers & cards
  "web-card", "web-statistic-card", "web-collapse", "web-filter-bar", "web-login-card",
  "web-table", "web-descriptions", "web-kanban", "web-calendar", "web-chart", "web-tree",
  // Web feedback & popups
  "web-modal", "web-drawer", "web-alert", "web-popconfirm", "web-notification",
  "web-tips", "web-message", "web-empty-state",
  // Web navigation & tags
  "web-tag", "web-badge", "web-dropdown", "web-menu", "web-tabs", "web-pagination",
  // Agent templates & components
  "agent-home-layout", "agent-chat-stream-layout", "agent-split-workspace-layout",
  "agent-employee-workspace-layout", "agent-employee-market-layout",
  "agent-nav-sidebar", "agent-sidebar-header", "agent-mode-switch", "agent-new-task-button",
  "agent-session-list", "agent-project-tree", "agent-sidebar-nav", "agent-user-footer",
  "agent-prompt-box", "agent-model-badge", "agent-prompt-toolbar", "agent-prompt-suggestions",
  "agent-user-message", "agent-session-header", "agent-status-badge",
  "agent-stream-header", "agent-tool-step", "agent-thought-stream", "agent-file-attachments",
  "agent-employee-card", "agent-template-card", "agent-artifact-tabs", "agent-console-table",
  ...FLOWCHART_TYPES,
]);

const RADIUS_SUPPORTED_TYPES = new Set([
  "rectangle", "button", "button-primary", "icon-button", "web-button", "web-button-group",
  "card", "mobile-frame", "browser-frame", "placeholder", "image", "scroll-panel", "modal-dialog", "modal",
  "code-block", "ai-component", "badge", "alert", "connector",
  "input", "textarea", "select", "date-picker", "search", "file-upload", "data-table",
  // Web form & inputs
  "web-input", "web-input-number", "web-textarea", "web-select", "web-cascader", "web-tree-select",
  "web-auto-complete", "web-tag-input", "web-date-picker", "web-date-range-picker", "web-time-picker",
  "web-color-picker", "web-upload", "web-transfer",
  // Web containers & cards
  "web-card", "web-statistic-card", "web-collapse", "web-filter-bar", "web-login-card",
  "web-table", "web-descriptions", "web-kanban", "web-calendar", "web-chart", "web-tree",
  // Web feedback & popups
  "web-modal", "web-drawer", "web-alert", "web-popconfirm", "web-notification",
  "web-tips", "web-message", "web-empty-state",
  // Web navigation & tags
  "web-tag", "web-badge", "web-dropdown", "web-menu", "web-tabs", "web-pagination",
  // Agent templates & components
  "agent-home-layout", "agent-chat-stream-layout", "agent-split-workspace-layout",
  "agent-employee-workspace-layout", "agent-employee-market-layout",
  "agent-nav-sidebar", "agent-sidebar-header", "agent-mode-switch", "agent-new-task-button",
  "agent-session-list", "agent-project-tree", "agent-sidebar-nav", "agent-user-footer",
  "agent-prompt-box", "agent-model-badge", "agent-prompt-toolbar", "agent-prompt-suggestions",
  "agent-user-message", "agent-session-header", "agent-status-badge",
  "agent-stream-header", "agent-tool-step", "agent-thought-stream", "agent-file-attachments",
  "agent-employee-card", "agent-template-card", "agent-artifact-tabs", "agent-console-table",
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

function evaluateNumericExpression(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const direct = Number(trimmed);
  if (!Number.isNaN(direct)) return direct;
  if (/^[\d\s+\-*/.()]+$/.test(trimmed)) {
    try {
      const fn = Function(`"use strict"; return (${trimmed})`);
      const res = fn();
      if (typeof res === "number" && Number.isFinite(res)) {
        return res;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function formatNumberPrecise(val: number): number {
  return Math.round(val * 1000) / 1000;
}

function NumField({
  label,
  value,
  onChange,
  min,
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
  const [text, setText] = useState<string>(() =>
    Number.isNaN(value) ? "" : String(formatNumberPrecise(value))
  );
  const [isFocused, setIsFocused] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubStartRef = useRef<{ startX: number; startVal: number }>({ startX: 0, startVal: 0 });
  const autoRepeatTimer = useRef<{ timeout?: number; interval?: number }>({});

  const clearAutoRepeat = () => {
    if (autoRepeatTimer.current.timeout) {
      window.clearTimeout(autoRepeatTimer.current.timeout);
      autoRepeatTimer.current.timeout = undefined;
    }
    if (autoRepeatTimer.current.interval) {
      window.clearInterval(autoRepeatTimer.current.interval);
      autoRepeatTimer.current.interval = undefined;
    }
  };

  useEffect(() => {
    return () => clearAutoRepeat();
  }, []);

  // Sync external value changes (selection change, undo/redo) when not actively focused or scrubbing
  useEffect(() => {
    if (!isFocused && !isScrubbing) {
      setText(Number.isNaN(value) ? "" : String(formatNumberPrecise(value)));
    }
  }, [value, isFocused, isScrubbing]);

  const applyDelta = (delta: number, mult: number = 1) => {
    const currentParsed =
      evaluateNumericExpression(text.trim()) ?? (Number.isNaN(value) ? 0 : value);
    let nextVal = currentParsed + delta * mult;
    if (typeof min === "number" && nextVal < min) nextVal = min;
    if (typeof max === "number" && nextVal > max) nextVal = max;
    nextVal = formatNumberPrecise(nextVal);
    setText(String(nextVal));
    onChange(nextVal);
  };

  const commitValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setText(Number.isNaN(value) ? "" : String(formatNumberPrecise(value)));
      return;
    }
    const parsed = evaluateNumericExpression(trimmed);
    if (parsed === null || Number.isNaN(parsed)) {
      setText(Number.isNaN(value) ? "" : String(formatNumberPrecise(value)));
      return;
    }
    let nextVal = parsed;
    if (typeof min === "number" && nextVal < min) nextVal = min;
    if (typeof max === "number" && nextVal > max) nextVal = max;
    nextVal = formatNumberPrecise(nextVal);
    setText(String(nextVal));
    if (nextVal !== value) {
      onChange(nextVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitValue(text);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setText(Number.isNaN(value) ? "" : String(formatNumberPrecise(value)));
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const delta = (e.key === "ArrowUp" ? 1 : -1) * step;
      applyDelta(delta, mult);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;
    setText(nextText);

    const trimmed = nextText.trim();
    if (
      trimmed !== "" &&
      trimmed !== "-" &&
      !trimmed.endsWith(".") &&
      !trimmed.endsWith("+") &&
      !trimmed.endsWith("-") &&
      !trimmed.endsWith("*") &&
      !trimmed.endsWith("/")
    ) {
      const parsed = evaluateNumericExpression(trimmed);
      if (parsed !== null && !Number.isNaN(parsed)) {
        if ((min === undefined || parsed >= min) && (max === undefined || parsed <= max)) {
          onChange(formatNumberPrecise(parsed));
        }
      }
    }
  };

  const startAutoRepeat = (direction: 1 | -1, e: React.PointerEvent) => {
    clearAutoRepeat();
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    applyDelta(direction * step, mult);

    const initialTimeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        applyDelta(direction * step, mult);
      }, 50);
      autoRepeatTimer.current.interval = interval as unknown as number;
    }, 300);

    autoRepeatTimer.current.timeout = initialTimeout as unknown as number;

    const stop = () => {
      clearAutoRepeat();
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const handleLabelPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const cur = evaluateNumericExpression(text.trim()) ?? (Number.isNaN(value) ? 0 : value);
    scrubStartRef.current = { startX: e.clientX, startVal: cur };
  };

  const handleLabelPointerMove = (e: React.PointerEvent) => {
    if (!isScrubbing) return;
    const dx = e.clientX - scrubStartRef.current.startX;
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    let nextVal = scrubStartRef.current.startVal + dx * step * mult;
    if (typeof min === "number" && nextVal < min) nextVal = min;
    if (typeof max === "number" && nextVal > max) nextVal = max;
    nextVal = formatNumberPrecise(nextVal);
    setText(String(nextVal));
    onChange(nextVal);
  };

  const handleLabelPointerUp = (e: React.PointerEvent) => {
    if (isScrubbing) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setIsScrubbing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
    const delta = e.deltaY < 0 ? step : -step;
    applyDelta(delta, mult);
  };

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      {label && (
        <span
          onPointerDown={handleLabelPointerDown}
          onPointerMove={handleLabelPointerMove}
          onPointerUp={handleLabelPointerUp}
          onPointerCancel={handleLabelPointerUp}
          title="可按住左右拖拽调节数值 (Shift x10, Alt x0.1)"
          className={cn(
            "shrink-0 text-[10px] font-medium font-mono select-none transition-colors",
            isScrubbing
              ? "text-foreground font-bold cursor-ew-resize"
              : "text-muted-foreground hover:text-foreground cursor-ew-resize",
          )}
        >
          {label}
        </span>
      )}
      <div
        onWheel={handleWheel}
        className={cn(
          "relative inline-flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md border border-border-visible bg-surface text-xs text-foreground transition-colors duration-150",
          "hover:border-foreground/40 focus-within:border-foreground focus-within:ring-1 focus-within:ring-ring group/numfield",
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={(e) => {
            setIsFocused(true);
            e.currentTarget.select();
          }}
          onBlur={() => {
            setIsFocused(false);
            commitValue(text);
          }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-center font-mono text-xs leading-none outline-none placeholder:text-muted-foreground/50"
        />
        {suffix && (
          <span className="pointer-events-none select-none pr-1 font-mono text-[9.5px] text-muted-foreground shrink-0">
            {suffix}
          </span>
        )}
        <div className="flex h-full w-3.5 flex-col border-l border-border-visible/80 divide-y divide-border-visible/80 shrink-0 select-none bg-surface/50">
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => startAutoRepeat(1, e)}
            title="增加数值 (按住连续调节, Shift x10, Alt x0.1)"
            className="flex flex-1 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised active:bg-foreground/10 transition-colors cursor-pointer select-none"
          >
            <ChevronUp className="size-2.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => startAutoRepeat(-1, e)}
            title="减少数值 (按住连续调节, Shift x10, Alt x0.1)"
            className="flex flex-1 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised active:bg-foreground/10 transition-colors cursor-pointer select-none"
          >
            <ChevronDown className="size-2.5" />
          </button>
        </div>
      </div>
    </div>
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

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...items];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    updateItems(copy);
    if (mode === "single" && onSelectIndex && selectedIndex !== undefined) {
      if (selectedIndex === index) onSelectIndex(index - 1);
      else if (selectedIndex === index - 1) onSelectIndex(index);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const copy = [...items];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    updateItems(copy);
    if (mode === "single" && onSelectIndex && selectedIndex !== undefined) {
      if (selectedIndex === index) onSelectIndex(index + 1);
      else if (selectedIndex === index + 1) onSelectIndex(index);
    }
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
              className="group relative flex items-center gap-1"
            >
              {/* Up / Down Move buttons */}
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="size-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  title="上移"
                >
                  <ArrowUp className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  className="size-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  title="下移"
                >
                  <ArrowDown className="size-2.5" />
                </button>
              </div>

              {/* Input with Selection Indicator */}
              <div className="relative flex min-w-0 flex-1 items-center">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "h-7 w-full rounded-md bg-muted/50 px-2 text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors",
                    "border border-transparent focus:border-input focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring",
                    mode !== "none" ? "pr-6" : "pr-2",
                  )}
                />

                {/* Default/Selected Indicator */}
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
                    className="absolute right-1.5 flex size-4 items-center justify-center cursor-pointer select-none"
                  >
                    {mode === "multiple" ? (
                      isSelected ? (
                        <div className="flex size-3 items-center justify-center rounded-xs border border-foreground bg-foreground text-background transition-transform hover:scale-105">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="size-3 rounded-xs border border-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:border-foreground transition-all" />
                      )
                    ) : isSelected ? (
                      <div className="flex size-3 items-center justify-center rounded-full border border-foreground transition-transform hover:scale-105">
                        <div className="size-1.5 rounded-full bg-foreground" />
                      </div>
                    ) : (
                      <div className="size-3 rounded-full border border-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:border-foreground transition-all" />
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
                  items.length <= 1 && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground",
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

function TableInspectorSection({
  element,
  prop,
  setProp,
  setProps,
}: {
  element: EditorElement;
  prop: (key: string, def?: any) => any;
  setProp: (key: string, value: any) => void;
  setProps: (patch: Record<string, any>) => void;
}) {
  const headersStr = String(prop("headers", "编号,用户名称,所属部门,状态"));
  const rawHeaders = headersStr
    ? headersStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const rows = Math.max(2, Number(prop("rows", 4)));
  const cols = Math.max(1, Math.max(rawHeaders.length, Number(prop("cols", 4))));

  const headers = Array.from({ length: cols }, (_, i) => rawHeaders[i] || `列头 ${i + 1}`);

  const rawColWidthsStr = typeof element.props.colWidths === "string" ? element.props.colWidths : "";
  const parsedColWidths: number[] = rawColWidthsStr
    ? rawColWidthsStr
        .split(",")
        .map((n) => Math.max(36, Number(n.trim())))
        .filter((n) => !isNaN(n))
    : [];

  const colWidths: number[] = Array.from({ length: cols }, (_, i) => {
    if (parsedColWidths[i] && parsedColWidths[i] >= 30) return parsedColWidths[i];
    if (i === 0) return 70;
    if (i === cols - 1) return 80;
    return 130;
  });

  const defaultPreset = [
    ["01", "张三", "用户体验设计部", "正常"],
    ["02", "李四", "技术架构中台", "正常"],
    ["03", "王五", "数据智能平台", "离线"],
    ["04", "赵六", "核心研发团队", "正常"],
  ];

  let parsedCells: string[][] | null = null;
  if (typeof element.props.cells === "string" && element.props.cells.trim()) {
    try {
      const json = JSON.parse(element.props.cells);
      if (Array.isArray(json)) {
        parsedCells = json.map((r) => (Array.isArray(r) ? r.map(String) : []));
      }
    } catch {
      parsedCells = element.props.cells.split("\n").map((l) => l.split(/[,，]/).map((c) => c.trim()));
    }
  }

  const bodyRowCount = Math.max(1, rows - 1);
  const hasCustomCells = parsedCells !== null;

  const currentMatrix = useMemo(() => {
    const custom = parsedCells;
    return Array.from({ length: bodyRowCount }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        if (custom !== null) {
          return custom[r]?.[c] !== undefined ? custom[r][c] : "";
        }
        if (defaultPreset[r] && defaultPreset[r][c] !== undefined) {
          return defaultPreset[r][c];
        }
        return c === 0 ? String(r + 1).padStart(2, "0") : c === cols - 1 ? (r % 3 === 2 ? "离线" : "正常") : `数据项 ${r + 1}-${c}`;
      })
    );
  }, [bodyRowCount, cols, parsedCells]);

  const defaultCsvText = useMemo(() => {
    return currentMatrix.map((row) => row.join(", ")).join("\n");
  }, [currentMatrix]);

  const [csvText, setCsvText] = useState(defaultCsvText);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setCsvText(defaultCsvText);
    }
  }, [defaultCsvText, element.id]);

  return (
    <>
      <OptionsListEditor
        title="表头列名"
        mode="none"
        value={headersStr}
        onChange={(v) => setProp("headers", v)}
        placeholder="列名..."
      />

      {/* Row & Col Controls */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <NumField
          label="行数"
          value={rows}
          min={2}
          max={50}
          onChange={(v) => {
            const nextRows = Math.max(2, v);
            if (nextRows > rows) {
              const addedRowsCount = nextRows - rows;
              const newRows = Array.from({ length: addedRowsCount }, (_, i) => {
                const rowIdx = rows + i;
                return Array.from({ length: cols }, (_, c) =>
                  c === 0 ? String(rowIdx).padStart(2, "0") : c === cols - 1 ? (rowIdx % 3 === 2 ? "离线" : "正常") : `数据项 ${rowIdx}-${c}`
                );
              });
              setProps({
                rows: nextRows,
                cells: JSON.stringify([...currentMatrix, ...newRows]),
              });
            } else if (nextRows < rows) {
              const kept = currentMatrix.slice(0, nextRows - 1);
              setProps({
                rows: nextRows,
                cells: JSON.stringify(kept),
              });
            } else {
              setProp("rows", nextRows);
            }
          }}
        />

        <NumField
          label="列数"
          value={cols}
          min={1}
          max={20}
          onChange={(v) => {
            const nextCols = Math.max(1, v);
            if (nextCols > cols) {
              const newHeaders = [...headers];
              while (newHeaders.length < nextCols) {
                newHeaders.push(`列头 ${newHeaders.length + 1}`);
              }
              const nextMatrix = currentMatrix.map((r, rowIdx) => {
                const row = [...r];
                while (row.length < nextCols) {
                  row.push(`数据项 ${rowIdx + 1}-${row.length}`);
                }
                return row;
              });
              const nextWidths = [...colWidths];
              while (nextWidths.length < nextCols) {
                nextWidths.push(110);
              }
              setProps({
                cols: nextCols,
                headers: newHeaders.join(","),
                cells: JSON.stringify(nextMatrix),
                colWidths: nextWidths.join(","),
              });
            } else if (nextCols < cols) {
              const newHeaders = headers.slice(0, nextCols);
              const nextMatrix = currentMatrix.map((r) => r.slice(0, nextCols));
              const nextWidths = colWidths.slice(0, nextCols);
              setProps({
                cols: nextCols,
                headers: newHeaders.join(","),
                cells: JSON.stringify(nextMatrix),
                colWidths: nextWidths.join(","),
              });
            } else {
              setProp("cols", nextCols);
            }
          }}
        />
      </div>

      {/* Individual Column Width Control */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-muted-foreground font-semibold">各列宽度 (px)</span>
          <button
            type="button"
            onClick={() => {
              const avg = 110;
              setProp("colWidths", Array(cols).fill(avg).join(","));
            }}
            className="font-mono text-[9px] text-foreground/80 hover:text-foreground underline cursor-pointer"
          >
            均分宽度
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {colWidths.map((w, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className="w-10 shrink-0 truncate font-mono text-[9.5px] text-muted-foreground" title={headers[idx] || `列${idx + 1}`}>
                {headers[idx] || `列${idx + 1}`}
              </span>
              <NumField
                value={w}
                min={36}
                max={500}
                onChange={(newW) => {
                  const updated = [...colWidths];
                  updated[idx] = Math.max(36, newW);
                  setProp("colWidths", updated.join(","));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Batch Table Data Editor */}
      <div className="flex flex-col gap-1 pt-1">
        <span className="font-mono text-[10px] uppercase text-muted-foreground font-semibold">批量编辑数据 (按行/逗号分隔)</span>
        <textarea
          rows={4}
          value={csvText}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
          }}
          onChange={(e) => {
            const val = e.target.value;
            setCsvText(val);
            const lines = val.split("\n");
            const newMatrix = lines.map((line) => line.split(/[,，]/).map((cell) => cell.trim()));
            setProps({
              rows: Math.max(2, lines.length + 1),
              cells: JSON.stringify(newMatrix),
            });
          }}
          placeholder="例如：&#10;01, 张三, 设计部, 正常&#10;02, 李四, 架构部, 正常"
          className="w-full resize-y rounded-md border border-input bg-background p-1.5 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
        />
      </div>

      {/* Header Background */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">表头背景</span>
        <div className="flex flex-1 items-center gap-1.5 min-w-0">
          <Input
            size="sm"
            value={String(prop("headerBg", ""))}
            placeholder="默认自适应"
            onChange={(e) => setProp("headerBg", e.target.value)}
            className="h-7 flex-1 text-xs font-mono uppercase"
          />
          {Boolean(prop("headerBg", "")) && (
            <button
              type="button"
              onClick={() => setProp("headerBg", "")}
              title="重置为默认主题自适应"
              className="shrink-0 rounded-xs border border-border-visible px-2 py-1 text-[10px] font-mono text-muted-foreground hover:bg-surface-raised hover:text-foreground cursor-pointer transition-colors"
            >
              重置
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export const RightPanel = memo(function RightPanel({
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
  onGroup,
  onUngroup,
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
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l border-border bg-surface text-foreground">
        <div className="flex h-10 items-center border-b border-border px-3">
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">[ CANVAS & INFO ]</span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-3 text-xs overflow-y-auto">
          <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-2.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">[ SHORTCUTS ]</span>
            <div className="flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>PAN CANVAS</span>
                <kbd className="rounded-xs border border-border-visible bg-background px-1.5 py-0.5 text-[10px]">SPACE + DRAG</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>ZOOM</span>
                <kbd className="rounded-xs border border-border-visible bg-background px-1.5 py-0.5 text-[10px]">CTRL + SCROLL</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>DUPLICATE</span>
                <kbd className="rounded-xs border border-border-visible bg-background px-1.5 py-0.5 text-[10px]">CTRL + D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>UNDO / REDO</span>
                <kbd className="rounded-xs border border-border-visible bg-background px-1.5 py-0.5 text-[10px]">CTRL+Z / CTRL+Y</kbd>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-border py-8 text-center">
            <Square className="size-6 text-muted-foreground/40 mb-2" />
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">NO SELECTION</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70 px-2 uppercase">SELECT AN ELEMENT TO INSPECT</p>
          </div>
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
  const isLineLike = element.type === "line" || element.type === "arrow" || element.type === "connector";
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
  const borderWidth = Number(prop("borderWidth", element.type === "connector" || isLineLike ? 1.5 : 1));
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
  const fontFamily = String(prop("fontFamily", "var(--font-sans)"));
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
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l border-border bg-surface text-foreground">
      {/* Header & Tabs */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xs bg-muted p-0.5 font-mono text-xs">
            <button
              type="button"
              className={cn("rounded-xs px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors", activeTab === "design" ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setActiveTab("design")}
            >
              DESIGN
            </button>
            <button
              type="button"
              className={cn("rounded-xs px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors", activeTab === "inspect" ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setActiveTab("inspect")}
            >
              INSPECT
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

        {/* Quick Layer Operations */}
        <div className="mt-2 flex items-center justify-between gap-0.5 border-t border-border pt-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            title="置顶图层"
            onClick={onBringToFront}
            disabled={!onBringToFront}
          >
            <ArrowUpToLine className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="上移一层"
            onClick={onBringForward}
            disabled={!onBringForward || isMulti}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="下移一层"
            onClick={onSendBackward}
            disabled={!onSendBackward || isMulti}
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            title="置底图层"
            onClick={onSendToBack}
            disabled={!onSendToBack}
          >
            <ArrowDownToLine className="size-3.5" />
          </Button>
          <Separator orientation="vertical" className="mx-0.5 h-3.5" />
          <Button
            variant="ghost"
            size="icon-xs"
            title="复制 (Ctrl+D)"
            onClick={onDuplicate}
            disabled={!onDuplicate}
          >
            <Copy className="size-3.5" />
          </Button>
          {isMulti && onGroup && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-3.5" />
              <Button
                variant="ghost"
                size="icon-xs"
                title="创建组合 (Ctrl+G)"
                onClick={onGroup}
                className="text-foreground hover:bg-surface-raised"
              >
                <Boxes className="size-3.5" />
              </Button>
            </>
          )}
          {(element.type === "group" || (element.children && element.children.length > 0)) && onUngroup && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-3.5" />
              <Button
                variant="ghost"
                size="icon-xs"
                title="打散组合 (Ctrl+Shift+G)"
                onClick={onUngroup}
                className="text-foreground hover:bg-surface-raised"
              >
                <Ungroup className="size-3.5" />
              </Button>
            </>
          )}
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
          {/* Multi-Selection or Group Header Banner */}
          {isMulti ? (
            <div className="border-b border-border bg-surface-raised/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  已选中 {effectiveSelectedElements.length} 项图层
                </span>
              </div>
              {onGroup && (
                <button
                  type="button"
                  onClick={onGroup}
                  className="mt-2 flex h-6 w-full items-center justify-center gap-1.5 rounded-xs bg-foreground px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-background hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Boxes className="size-3" />
                  <span>组合为整体 (Ctrl+G)</span>
                </button>
              )}
            </div>
          ) : (element.type === "group" || (element.children && element.children.length > 0)) ? (
            <div className="border-b border-border bg-surface-raised/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Boxes className="size-3.5 text-foreground shrink-0" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground truncate">
                    {element.name || "组合图层"}
                  </span>
                </div>
                <span className="rounded-xs border border-border-visible bg-background px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground shrink-0">
                  {element.children.length} 个子图层
                </span>
              </div>
              {onUngroup && (
                <button
                  type="button"
                  onClick={onUngroup}
                  className="mt-2 flex h-6 w-full items-center justify-center gap-1.5 rounded-xs border border-border-visible bg-background px-2 font-mono text-[10px] font-medium uppercase tracking-wider text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <Ungroup className="size-3" />
                  <span>打散为独立组件 (Ctrl+Shift+G)</span>
                </button>
              )}
            </div>
          ) : null}

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
                {element.type === "line" || element.type === "arrow" ? (
                  <div className="flex gap-1.5">
                    <NumField label="L" value={Math.round(element.width)} min={1} onChange={(v) => onUpdate(element.id, { width: Math.max(1, v) })} suffix="px" />
                    <NumField label="↺" value={Math.round(element.rotation)} onChange={(v) => onUpdate(element.id, { rotation: v })} suffix="°" />
                  </div>
                ) : element.type === "connector" ? (
                  <div className="rounded-md bg-muted/40 p-2 text-[10px] text-muted-foreground flex flex-col gap-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="uppercase">起点节点:</span>
                      <span className="font-semibold text-foreground">
                        {element.props.startElementId ? "已绑定" : "自由端点"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="uppercase">终点节点:</span>
                      <span className="font-semibold text-foreground">
                        {element.props.endElementId ? "已绑定" : "自由端点"}
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
                      {!(element.type === "table" || element.type === "web-table" || element.type === "web-crud-table" || element.type === "web-pricing-table") && (
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
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </Section>

          {/* Connector Properties Section */}
          {element.type === "connector" && (
            <Section title="连线属性" collapsible defaultOpen={true}>
              <div className="flex flex-col gap-2.5 text-xs">
                {/* Routing Type */}
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">路径样式</span>
                  <div className="grid grid-cols-3 gap-1 flex-1">
                    {([
                      { id: "orthogonal", label: "折线" },
                      { id: "straight", label: "直线" },
                      { id: "curved", label: "曲线" },
                    ] as const).map((route) => {
                      const active = (element.props.routing || "orthogonal") === route.id;
                      return (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => setProp("routing", route.id)}
                          className={cn(
                            "h-6 rounded text-[9px] font-mono uppercase tracking-wider transition-colors border select-none cursor-pointer",
                            active
                              ? "bg-foreground text-background border-foreground font-bold"
                              : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                          )}
                        >
                          {route.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Arrow Endpoints - Start Arrow */}
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">起点端点</span>
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button variant="outline" size="xs" className="h-7 flex-1 justify-between text-xs font-mono">
                          <span className="truncate">
                            {element.props.startArrow === "arrow" ? "箭头" : element.props.startArrow === "circle" ? "圆点" : "无端点"}
                          </span>
                          <ChevronDown className="size-3 opacity-60" />
                        </Button>
                      }
                    />
                    <MenuPopup align="start">
                      <MenuItem onClick={() => setProp("startArrow", "none")}>无端点</MenuItem>
                      <MenuItem onClick={() => setProp("startArrow", "arrow")}>箭头</MenuItem>
                      <MenuItem onClick={() => setProp("startArrow", "circle")}>圆点</MenuItem>
                    </MenuPopup>
                  </Menu>
                </div>

                {/* Arrow Endpoints - End Arrow */}
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">终点端点</span>
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button variant="outline" size="xs" className="h-7 flex-1 justify-between text-xs font-mono">
                          <span className="truncate">
                            {element.props.endArrow === "none" ? "无端点" : element.props.endArrow === "circle" ? "圆点" : "箭头"}
                          </span>
                          <ChevronDown className="size-3 opacity-60" />
                        </Button>
                      }
                    />
                    <MenuPopup align="start">
                      <MenuItem onClick={() => setProp("endArrow", "none")}>无端点</MenuItem>
                      <MenuItem onClick={() => setProp("endArrow", "arrow")}>箭头</MenuItem>
                      <MenuItem onClick={() => setProp("endArrow", "circle")}>圆点</MenuItem>
                    </MenuPopup>
                  </Menu>
                </div>

                {/* Corner Radius if orthogonal */}
                {element.props.routing !== "straight" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">拐角圆角</span>
                    <NumField
                      label="R"
                      value={Number(element.props.radius ?? 8)}
                      min={0}
                      max={32}
                      onChange={(v) => setProp("radius", Math.max(0, v))}
                      suffix="px"
                    />
                  </div>
                )}

                {/* Text Label on Connector */}
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">连线说明</span>
                  <Input
                    size="sm"
                    value={String(prop("text", ""))}
                    onChange={(e) => setProp("text", e.target.value)}
                    placeholder="输入线条中点说明..."
                    className="h-7 text-xs flex-1"
                  />
                </div>

                {/* Reset Custom Path Button */}
                {Boolean(element.props.customWaypoints) && (
                  <div className="pt-1.5 flex items-center justify-between border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">微调状态: 已手动调整</span>
                    <button
                      type="button"
                      onClick={() => setProp("customWaypoints", "")}
                      title="清除手动微调的折线位置，恢复全自动避障走线"
                      className="rounded px-2 py-1 text-[10px] font-mono uppercase font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer"
                    >
                      [恢复自动走线]
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Content & Text Section - 内容与文案 */}
          {element.type !== "line" && element.type !== "arrow" && element.type !== "connector" && (
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
                          {prop("checked", true) !== false && prop("checked", true) !== "false" ? "默认开启" : "默认关闭"}
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
                  <TableInspectorSection
                    element={element}
                    prop={prop}
                    setProp={setProp}
                    setProps={setProps}
                  />
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

                {/* 25a. Placeholder / Hotspot */}
                {(element.type === "placeholder" || element.type === "hotspot") && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">说明文案</span>
                    <Input
                      size="sm"
                      value={String(prop("label", element.type === "hotspot" ? "交互热区" : "占位符"))}
                      onChange={(e) => setProp("label", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* 25b. Image Element Controls */}
                {element.type === "image" && (
                  <div className="space-y-3 pt-1">
                    {Boolean(element.props.src) ? (
                      <>
                        <div className="flex items-center gap-3 rounded border border-border p-2 bg-neutral-900/10">
                          <img
                            src={String(element.props.src)}
                            alt="preview"
                            className="size-10 object-cover rounded border border-border shrink-0 bg-neutral-100 dark:bg-neutral-800"
                          />
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="text-[10px] font-mono text-foreground font-semibold truncate uppercase">
                              {String(element.props.label || "IMAGE")}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase">
                              {Number(element.props.naturalWidth || element.width)} × {Number(element.props.naturalHeight || element.height)} PX
                            </span>
                          </div>
                        </div>

                        {/* Fit Mode Switcher */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">FIT MODE</span>
                          <div className="grid grid-cols-3 gap-1 flex-1">
                            {(["cover", "contain", "fill"] as const).map((fitMode) => {
                              const active = (element.props.fit || "cover") === fitMode;
                              return (
                                <button
                                  key={fitMode}
                                  type="button"
                                  onClick={() => setProp("fit", fitMode)}
                                  className={cn(
                                    "h-6 rounded text-[9px] font-mono uppercase tracking-wider transition-colors border select-none",
                                    active
                                      ? "bg-foreground text-background border-foreground font-bold"
                                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                                  )}
                                >
                                  {fitMode}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions: Replace, Reset Aspect Ratio, Clear */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <label className="flex-1 flex items-center justify-center gap-1 h-7 rounded border border-border hover:border-foreground/50 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors select-none">
                            <Upload className="size-3" />
                            <span>替换</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const processed = await processImageFile(file);
                                  onUpdate(element.id, {
                                    props: {
                                      ...element.props,
                                      src: processed.dataUrl,
                                      naturalWidth: processed.naturalWidth,
                                      naturalHeight: processed.naturalHeight,
                                      label: processed.name,
                                    },
                                  });
                                } catch (err) {
                                  console.error("Replace image error:", err);
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            title="还原原始宽高比"
                            onClick={() => {
                              const nw = Number(element.props.naturalWidth);
                              const nh = Number(element.props.naturalHeight);
                              if (nw && nh) {
                                const targetHeight = Math.round(element.width * (nh / nw));
                                onUpdate(element.id, { height: targetHeight });
                              }
                            }}
                            className="flex items-center justify-center gap-1 px-2 h-7 rounded border border-border hover:border-foreground/50 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none"
                          >
                            <RotateCcw className="size-3" />
                            <span>比例</span>
                          </button>

                          <button
                            type="button"
                            title="清除图片内容，恢复占位状态"
                            onClick={() => {
                              onUpdate(element.id, {
                                props: {
                                  ...element.props,
                                  src: "",
                                },
                              });
                            }}
                            className="flex items-center justify-center size-7 rounded border border-border hover:border-red-500/50 hover:text-red-500 text-muted-foreground transition-colors select-none"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] text-muted-foreground">说明文案</span>
                          <Input
                            size="sm"
                            value={String(prop("label", "图片占位"))}
                            onChange={(e) => setProp("label", e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>

                        <label className="flex w-full items-center justify-center gap-1.5 h-8 rounded border border-dashed border-border hover:border-foreground/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer transition-colors select-none">
                          <Upload className="size-3.5" />
                          <span>上传图片文件</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const processed = await processImageFile(file);
                                onUpdate(element.id, {
                                  width: processed.width,
                                  height: processed.height,
                                  props: {
                                    ...element.props,
                                    src: processed.dataUrl,
                                    naturalWidth: processed.naturalWidth,
                                    naturalHeight: processed.naturalHeight,
                                    label: processed.name,
                                  },
                                });
                              } catch (err) {
                                console.error("Upload image error:", err);
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
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

                {/* ========================================================================= */}
                {/* 31. Web Templates & Components Properties */}
                {/* ========================================================================= */}

                {/* Web Dropdown */}
                {element.type === "web-dropdown" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">触发按钮</span>
                      <Input
                        size="sm"
                        value={String(prop("triggerText", "下拉操作菜单"))}
                        onChange={(e) => setProp("triggerText", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="下拉项列表 (支持 --- 分割线 / :danger 标红)"
                      mode="none"
                      value={String(prop("items", "查看详情,编辑信息,权限设置,---,导出数据,删除项目:danger"))}
                      onChange={(v) => setProp("items", v)}
                      placeholder="菜单项..."
                    />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">展开菜单</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("isOpen", false) === true || prop("isOpen", false) === "true"}
                          onCheckedChange={(c) => setProp("isOpen", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">
                          {prop("isOpen", false) === true || prop("isOpen", false) === "true" ? "展开显示下拉浮层" : "收起仅显示触发按钮"}
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Top Nav */}
                {element.type === "web-top-nav" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">系统 Logo</span>
                      <Input
                        size="sm"
                        value={String(prop("logoText", "BLUEPEN SaaS"))}
                        onChange={(e) => setProp("logoText", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="顶部导航列表"
                      mode="single"
                      value={String(prop("links", "概览仪表盘,项目管理,数据资产,团队协作,系统配置"))}
                      selectedIndex={Number(prop("activeIndex", 0))}
                      onSelectIndex={(idx) => setProp("activeIndex", idx)}
                      onChange={(v) => setProp("links", v)}
                      placeholder="导航标题..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">登录用户</span>
                      <Input
                        size="sm"
                        value={String(prop("userName", "Alex Morgan"))}
                        onChange={(e) => setProp("userName", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Web Menu */}
                {element.type === "web-menu" && (() => {
                  const showCategories = prop("showCategories", true) !== false && prop("showCategories", true) !== "false";
                  const categories = parseMenuCategories(element.props);
                  const flatItemsStr = String(prop("items1", prop("items", categories.flatMap((c) => c.items).join(","))));
                  const flatItems = parseItems(flatItemsStr, ["分析概览", "实时大屏", "用户列表", "角色策略", "审计日志"]);
                  const allMenuItems = showCategories ? categories.flatMap((c) => c.items) : flatItems;

                  const rawActiveKey = String(prop("activeKey", ""));
                  const effectiveActiveKey = allMenuItems.includes(rawActiveKey)
                    ? rawActiveKey
                    : (allMenuItems[0] ?? "");

                  const updateCategories = (newCategories: { title: string; items: string[] | string }[]) => {
                    const formatted = newCategories.map((c) => ({
                      title: c.title,
                      items: Array.isArray(c.items) ? c.items.join(",") : c.items,
                    }));
                    const patch: Record<string, string | number | boolean> = {
                      categories: JSON.stringify(formatted),
                    };
                    if (formatted[0]) {
                      patch.category1 = formatted[0].title;
                      patch.items1 = formatted[0].items;
                    }
                    if (formatted[1]) {
                      patch.category2 = formatted[1].title;
                      patch.items2 = formatted[1].items;
                    } else {
                      patch.category2 = "";
                      patch.items2 = "";
                    }
                    setProps(patch);
                  };

                  const handleAddCategory = () => {
                    const next = [
                      ...categories.map((c) => ({ title: c.title, items: [...c.items] })),
                      { title: `分类 ${categories.length + 1}`, items: ["新菜单项1", "新菜单项2"] },
                    ];
                    updateCategories(next);
                  };

                  const handleDeleteCategory = (idx: number) => {
                    if (categories.length <= 1) {
                      updateCategories([{ title: "", items: [] }]);
                      return;
                    }
                    const next = categories.filter((_, i) => i !== idx);
                    updateCategories(next);
                  };

                  const handleMoveCategoryUp = (idx: number) => {
                    if (idx <= 0) return;
                    const next = [...categories.map((c) => ({ title: c.title, items: [...c.items] }))];
                    const temp = next[idx - 1];
                    next[idx - 1] = next[idx];
                    next[idx] = temp;
                    updateCategories(next);
                  };

                  const handleMoveCategoryDown = (idx: number) => {
                    if (idx >= categories.length - 1) return;
                    const next = [...categories.map((c) => ({ title: c.title, items: [...c.items] }))];
                    const temp = next[idx + 1];
                    next[idx + 1] = next[idx];
                    next[idx] = temp;
                    updateCategories(next);
                  };

                  const handleCategoryTitleChange = (idx: number, newTitle: string) => {
                    const next = categories.map((c, i) => (i === idx ? { ...c, title: newTitle } : c));
                    updateCategories(next);
                  };

                  const handleCategoryItemsChange = (idx: number, newItemsStr: string) => {
                    const next = categories.map((c, i) => (i === idx ? { ...c, items: newItemsStr } : c));
                    updateCategories(next);
                  };

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">导航标题</span>
                        <Input
                          size="sm"
                          value={String(prop("title", "控制台导航"))}
                          onChange={(e) => setProp("title", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-0.5 pb-1 border-b border-border/50">
                        <span className="text-[10px] text-muted-foreground">显示分类名</span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                          <Checkbox
                            checked={showCategories}
                            onCheckedChange={(c) => setProp("showCategories", Boolean(c))}
                          />
                          <span className="text-[11px] text-foreground/80">
                            {showCategories ? "开启分组分类标题" : "扁平一级菜单"}
                          </span>
                        </label>
                      </div>

                      {showCategories ? (
                        <div className="flex flex-col gap-2.5">
                          {categories.map((cat, catIdx) => (
                            <div
                              key={catIdx}
                              className="group/cat flex flex-col gap-2 rounded-md border border-border/60 p-2.5 bg-surface-raised/20"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-12 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">
                                  分类 {catIdx + 1}
                                </span>
                                <Input
                                  size="sm"
                                  value={cat.title}
                                  onChange={(e) => handleCategoryTitleChange(catIdx, e.target.value)}
                                  placeholder="输入分类标题..."
                                  className="h-6 flex-1 text-xs font-semibold"
                                />
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveCategoryUp(catIdx)}
                                    disabled={catIdx === 0}
                                    className="size-5 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-raised hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                                    title="上移分类"
                                  >
                                    <ArrowUp className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveCategoryDown(catIdx)}
                                    disabled={catIdx === categories.length - 1}
                                    className="size-5 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-raised hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default"
                                    title="下移分类"
                                  >
                                    <ArrowDown className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(catIdx)}
                                    disabled={categories.length <= 1 && !cat.title && cat.items.length === 0}
                                    className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors"
                                    title="删除此分类"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </div>

                              <OptionsListEditor
                                title={`${cat.title ? `"${cat.title}"` : `分类 ${catIdx + 1}`} 菜单项`}
                                mode="none"
                                value={cat.items.join(",")}
                                onChange={(v) => handleCategoryItemsChange(catIdx, v)}
                                placeholder="菜单项名称..."
                              />
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddCategory}
                            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-visible hover:border-foreground/50 hover:bg-surface-raised/50 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          >
                            <Plus className="size-3.5" />
                            <span>添加分类</span>
                          </button>
                        </div>
                      ) : (
                        <OptionsListEditor
                          title="一级菜单列表"
                          mode="none"
                          value={flatItemsStr}
                          onChange={(v) => {
                            setProps({ items1: v, items: v });
                          }}
                          placeholder="菜单项名称..."
                        />
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前选中项</span>
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button variant="outline" size="xs" className="h-7 flex-1 justify-between text-xs font-medium">
                                <span className="truncate">{effectiveActiveKey || "请选择选中项..."}</span>
                                <ChevronDown className="size-3 opacity-60 shrink-0" />
                              </Button>
                            }
                          />
                          <MenuPopup align="start" className="max-h-60 overflow-y-auto w-48">
                            {allMenuItems.length > 0 ? (
                              allMenuItems.map((item, idx) => (
                                <MenuItem
                                  key={`${item}-${idx}`}
                                  onClick={() => setProp("activeKey", item)}
                                  className={cn("text-xs justify-between", item === effectiveActiveKey && "font-bold text-foreground")}
                                >
                                  <span className="truncate">{item}</span>
                                  {item === effectiveActiveKey && <Check className="size-3 ml-2 shrink-0 text-foreground" />}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled className="text-xs text-muted-foreground">
                                暂无可选项
                              </MenuItem>
                            )}
                          </MenuPopup>
                        </Menu>
                      </div>
                    </>
                  );
                })()}

                {/* Web Tabs */}
                {element.type === "web-tabs" && (
                  <>
                    <OptionsListEditor
                      title="选项卡列表"
                      mode="single"
                      value={String(prop("tabs", "全部订单,待支付(3),进行中(12),已完成,已退款"))}
                      selectedIndex={Number(prop("activeIndex", 0))}
                      onSelectIndex={(idx) => setProp("activeIndex", idx)}
                      onChange={(v) => setProp("tabs", v)}
                      placeholder="选项卡标题..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">展示风格</span>
                      <div className="grid grid-cols-2 gap-1 flex-1">
                        {["line", "card"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setProp("variant", v)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono uppercase border",
                              prop("variant", "line") === v
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border"
                            )}
                          >
                            {v === "line" ? "线条" : "卡片"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Web Breadcrumb */}
                {element.type === "web-breadcrumb" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">路径内容</span>
                    <Input
                      size="sm"
                      value={String(prop("path", "工作台 / 研发项目 / 迭代计划 / 需求详情"))}
                      onChange={(e) => setProp("path", e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

                {/* Web Pagination */}
                {element.type === "web-pagination" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <NumField label="当前页" value={Number(prop("current", 1))} min={1} onChange={(v) => setProp("current", Math.max(1, v))} />
                      <NumField label="每页条数" value={Number(prop("pageSize", 10))} min={1} onChange={(v) => setProp("pageSize", Math.max(1, v))} />
                    </div>
                    <NumField label="总记录数" value={Number(prop("total", 128))} min={1} onChange={(v) => setProp("total", Math.max(1, v))} />
                  </div>
                )}

                {/* Web Steps */}
                {element.type === "web-steps" && (
                  <>
                    <OptionsListEditor
                      title="步骤节点"
                      mode="none"
                      value={String(prop("steps", "填写基本信息,配置权限策略,关联数据源,完成创建"))}
                      onChange={(v) => setProp("steps", v)}
                      placeholder="步骤标题..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前步骤</span>
                      <NumField
                        value={Number(prop("current", 2))}
                        min={1}
                        max={10}
                        onChange={(v) => setProp("current", Math.max(1, v))}
                      />
                    </div>
                  </>
                )}

                {/* Web Button */}
                {element.type === "web-button" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">按钮文本</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "主要操作"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">变体风格</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "primary", label: "主要" },
                          { id: "secondary", label: "次要" },
                          { id: "dashed", label: "虚线" },
                          { id: "ghost", label: "幽灵" },
                          { id: "danger", label: "危险" },
                          { id: "link", label: "链接" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setProp("variant", item.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono uppercase border transition-colors cursor-pointer",
                              prop("variant", "primary") === item.id
                                ? item.id === "danger"
                                  ? "bg-[#D71921]/15 text-[#D71921] border-[#D71921] font-bold"
                                  : "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">尺寸大小</span>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        {[
                          { id: "sm", label: "紧凑" },
                          { id: "md", label: "标准" },
                          { id: "lg", label: "大号" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setProp("size", s.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border transition-colors cursor-pointer",
                              prop("size", "md") === s.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">外形轮廓</span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        {[
                          { id: "pill", label: "胶囊" },
                          { id: "rectangle", label: "微圆" },
                          { id: "circle", label: "圆形" },
                          { id: "square", label: "方形" },
                        ].map((sh) => (
                          <button
                            key={sh.id}
                            type="button"
                            onClick={() => setProp("shape", sh.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border transition-colors cursor-pointer",
                              prop("shape", "pill") === sh.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">图标预设</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "Plus", label: "新建+" },
                          { id: "Download", label: "导出" },
                          { id: "Upload", label: "导入" },
                          { id: "Trash2", label: "删除" },
                          { id: "Search", label: "搜索" },
                          { id: "Filter", label: "筛选" },
                          { id: "RefreshCw", label: "刷新" },
                          { id: "Settings", label: "设置" },
                          { id: "Check", label: "完成" },
                          { id: "Edit", label: "编辑" },
                          { id: "ExternalLink", label: "链接" },
                          { id: "none", label: "无图标" },
                        ].map((ic) => (
                          <button
                            key={ic.id}
                            type="button"
                            onClick={() => setProp("icon", ic.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border transition-colors cursor-pointer",
                              prop("icon", "Plus") === ic.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {ic.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Web Input */}
                {element.type === "web-input" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "企业名称"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">占位提示</span>
                      <Input
                        size="sm"
                        value={String(prop("placeholder", "请输入企业全称..."))}
                        onChange={(e) => setProp("placeholder", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">前缀文字</span>
                      <Input
                        size="sm"
                        value={String(prop("prefixText", ""))}
                        onChange={(e) => setProp("prefixText", e.target.value)}
                        placeholder="前缀文本 (选填)"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">后缀文字</span>
                      <Input
                        size="sm"
                        value={String(prop("suffixText", ""))}
                        onChange={(e) => setProp("suffixText", e.target.value)}
                        placeholder="后缀文本 (选填)"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">必填星号</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("required", true) !== false && prop("required", true) !== "false"}
                          onCheckedChange={(c) => setProp("required", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">显示必填 * 标记</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Input Number */}
                {element.type === "web-input-number" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "购买配额"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">调节样式</span>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        {([
                          { id: "right-vertical", label: "右侧步进" },
                          { id: "both-sides", label: "两侧加减" },
                          { id: "none", label: "无按钮" },
                        ] as const).map((pos) => {
                          const active = (element.props.controlsPosition || "right-vertical") === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setProp("controlsPosition", pos.id)}
                              className={cn(
                                "h-6 rounded text-[9px] font-mono uppercase tracking-wider transition-colors border select-none cursor-pointer",
                                active
                                  ? "bg-foreground text-background border-foreground font-bold"
                                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                              )}
                            >
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">默认数值</span>
                      <NumField
                        value={Number(prop("value", 5))}
                        step={Number(prop("step", 1))}
                        min={typeof element.props.min === "number" ? element.props.min : undefined}
                        max={typeof element.props.max === "number" ? element.props.max : undefined}
                        onChange={(v) => setProp("value", v)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumField
                        label="步长"
                        value={Number(prop("step", 1))}
                        min={0.01}
                        onChange={(v) => setProp("step", Math.max(0.01, v))}
                      />
                      <NumField
                        label="最小"
                        value={Number(prop("min", 1))}
                        onChange={(v) => setProp("min", v)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground font-mono uppercase">单位后缀</span>
                      <Input
                        size="sm"
                        value={String(prop("unit", "台"))}
                        onChange={(e) => setProp("unit", e.target.value)}
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  </>
                )}

                {/* Web Textarea */}
                {element.type === "web-textarea" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "需求背景描述"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">占位提示</span>
                      <Input
                        size="sm"
                        value={String(prop("placeholder", "请输入详细描述信息..."))}
                        onChange={(e) => setProp("placeholder", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">最大字数</span>
                      <NumField
                        value={Number(prop("maxLength", 200))}
                        min={10}
                        onChange={(v) => setProp("maxLength", v)}
                      />
                    </div>
                  </>
                )}

                {/* Web Select */}
                {element.type === "web-select" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "所属部门"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前选中</span>
                      <Input
                        size="sm"
                        value={String(prop("selected", "用户体验设计部 (UED)"))}
                        onChange={(e) => setProp("selected", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Web Cascader */}
                {element.type === "web-cascader" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "所属区域"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">选中路径</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "广东省 / 深圳市 / 南山区"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">展开级联</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("isOpen", true) !== false && prop("isOpen", true) !== "false"}
                          onCheckedChange={(c) => setProp("isOpen", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">显示 3 级展开浮层</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Tree Select */}
                {element.type === "web-tree-select" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "组织树节点"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">选定节点</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "技术中台 / 架构组"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Web Auto Complete */}
                {element.type === "web-auto-complete" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">搜索词</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "Tencent"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <OptionsListEditor
                      title="联想候选列表"
                      mode="none"
                      value={String(prop("suggestions", "Tencent Cloud,Tencent Video,Tencent Meeting"))}
                      onChange={(v) => setProp("suggestions", v)}
                      placeholder="联想词..."
                    />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">展开联想</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("isOpen", false) === true || prop("isOpen", false) === "true"}
                          onCheckedChange={(c) => setProp("isOpen", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">
                          {prop("isOpen", false) === true || prop("isOpen", false) === "true" ? "展开显示联想浮层" : "收起仅显示搜索框"}
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Tag Input */}
                {element.type === "web-tag-input" && (
                  <OptionsListEditor
                    title="已选标签"
                    mode="none"
                    value={String(prop("tags", "React 19,TDesign,Tauri 2"))}
                    onChange={(v) => setProp("tags", v)}
                    placeholder="标签名称..."
                  />
                )}

                {/* Web Date Picker & Range */}
                {(element.type === "web-date-picker" || element.type === "web-date-range-picker") && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", element.type === "web-date-picker" ? "截止日期" : "统计周期"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    {element.type === "web-date-picker" ? (
                      <div className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-[10px] text-muted-foreground">选定日期</span>
                        <Input
                          size="sm"
                          value={String(prop("value", "2026-09-01"))}
                          onChange={(e) => setProp("value", e.target.value)}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] text-muted-foreground">开始日期</span>
                          <Input
                            size="sm"
                            value={String(prop("startDate", "2026-08-01"))}
                            onChange={(e) => setProp("startDate", e.target.value)}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] text-muted-foreground">结束日期</span>
                          <Input
                            size="sm"
                            value={String(prop("endDate", "2026-08-31"))}
                            onChange={(e) => setProp("endDate", e.target.value)}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] text-muted-foreground">快捷标签</span>
                          <Input
                            size="sm"
                            value={String(prop("quickTag", "近30天"))}
                            onChange={(e) => setProp("quickTag", e.target.value)}
                            className="h-7 text-xs"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Web Time Picker */}
                {element.type === "web-time-picker" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "执行时间"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">时间数值</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "14:30:00"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Web Radio Group */}
                {element.type === "web-radio-group" && (
                  <OptionsListEditor
                    title="单选选项列表"
                    mode="single"
                    value={String(prop("options", "开发环境 (Dev),测试环境 (Test),生产环境 (Prod)"))}
                    selectedIndex={Number(prop("selectedIndex", 0))}
                    onSelectIndex={(idx) => setProp("selectedIndex", idx)}
                    onChange={(v) => setProp("options", v)}
                    placeholder="选项名称..."
                  />
                )}

                {/* Web Checkbox Group */}
                {element.type === "web-checkbox-group" && (() => {
                  const checkedIndices = String(prop("checkedIndices", "0,1"))
                    .split(",")
                    .map((n) => Number(n.trim()))
                    .filter((n) => !isNaN(n));

                  return (
                    <OptionsListEditor
                      title="复选项列表"
                      mode="multiple"
                      value={String(prop("options", "站内信,企业微信,邮件通知,短信推送"))}
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

                {/* Web Switch */}
                {element.type === "web-switch" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">开关文案</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "自动容灾热备"))}
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
                          {prop("checked", true) !== false && prop("checked", true) !== "false" ? "默认开启" : "默认关闭"}
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Slider */}
                {element.type === "web-slider" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "带宽限制 (Mbps)"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前数值</span>
                      <NumField
                        value={Number(prop("value", 60))}
                        min={Number(prop("min", 0))}
                        max={Number(prop("max", 100))}
                        onChange={(v) => setProp("value", v)}
                        suffix="%"
                      />
                    </div>
                  </>
                )}

                {/* Web Transfer */}
                {element.type === "web-transfer" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">左栏标题</span>
                      <Input
                        size="sm"
                        value={String(prop("sourceTitle", "可选字段 (4)"))}
                        onChange={(e) => setProp("sourceTitle", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="可选源列表"
                      mode="none"
                      value={String(prop("sourceItems", "用户 ID,电子邮箱,注册时间,最后登录"))}
                      onChange={(v) => setProp("sourceItems", v)}
                      placeholder="字段名称..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">右栏标题</span>
                      <Input
                        size="sm"
                        value={String(prop("targetTitle", "已选导出字段 (2)"))}
                        onChange={(e) => setProp("targetTitle", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <OptionsListEditor
                      title="已选目标列表"
                      mode="none"
                      value={String(prop("targetItems", "真实姓名,手机号码"))}
                      onChange={(v) => setProp("targetItems", v)}
                      placeholder="字段名称..."
                    />
                  </>
                )}

                {/* Web Upload */}
                {element.type === "web-upload" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">主提示语</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "点击或将文件拖拽至此区域上传"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">辅助说明</span>
                      <Input
                        size="sm"
                        value={String(prop("hint", "支持 PNG、JPG、PDF 或 ZIP 归档文件，单文件不超过 50MB"))}
                        onChange={(e) => setProp("hint", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Web Color Picker */}
                {element.type === "web-color-picker" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">字段标签</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "主题主色"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">选定颜色</span>
                      <Input
                        size="sm"
                        value={String(prop("color", "#0052D9"))}
                        onChange={(e) => setProp("color", e.target.value)}
                        className="h-7 text-xs font-mono uppercase"
                      />
                    </div>
                  </>
                )}

                {/* Web Table */}
                {element.type === "web-table" && (
                  <OptionsListEditor
                    title="表头列名定义"
                    mode="none"
                    value={String(prop("columns", "应用名称,版本号,所属集群,运行状态,最后更新,操作"))}
                    onChange={(v) => setProp("columns", v)}
                    placeholder="列名..."
                  />
                )}

                {/* Web Descriptions */}
                {element.type === "web-descriptions" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">列表标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "服务实例基本详情"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">每行列数</span>
                      <NumField
                        value={Number(prop("cols", 3))}
                        min={1}
                        max={6}
                        onChange={(v) => setProp("cols", Math.max(1, v))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase">键值项列表 (分号或换行分隔，冒号对齐)</span>
                      <textarea
                        value={String(prop("items", "实例 ID:ins-982143;运行环境:生产集群-华南;公网 IP:119.29.29.29;创建时间:2026-08-30;计费模式:按量计费;到期状态:正常运行"))}
                        onChange={(e) => setProp("items", e.target.value)}
                        rows={4}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                        placeholder="键:值;键:值..."
                      />
                    </div>
                  </>
                )}

                {/* Web Tree */}
                {element.type === "web-tree" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">目录标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "资源文件目录"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <OptionsListEditor
                      title="节点列表 (含 . 渲染为文件，:open 展开)"
                      mode="none"
                      value={String(prop("nodes", "src 源代码:open,components 界面组件,assets 媒体资源,package.json 配置"))}
                      onChange={(v) => setProp("nodes", v)}
                      placeholder="节点名称..."
                    />
                  </>
                )}

                {/* Web Collapse */}
                {element.type === "web-collapse" && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">折叠面板 (标题:正文:open;...)</span>
                    <textarea
                      value={String(prop("panels", "通用配置规则:支持自定义配置默认路由与访问策略;安全与防火墙:已开启 DDoS 基础防护与白名单拦截:open;日志归档策略:按日切分并保留最近 180 天"))}
                      onChange={(e) => setProp("panels", e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded-md border border-input bg-background p-1.5 font-sans text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                      placeholder="面板标题:面板描述文本:open;..."
                    />
                  </div>
                )}

                {/* Web Statistic Card */}
                {element.type === "web-statistic-card" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">指标标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "今日活跃用户数 (DAU)"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">指标数值</span>
                      <Input
                        size="sm"
                        value={String(prop("value", "148,290"))}
                        onChange={(e) => setProp("value", e.target.value)}
                        className="h-7 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">涨跌幅度</span>
                      <Input
                        size="sm"
                        value={String(prop("delta", "+18.4%"))}
                        onChange={(e) => setProp("delta", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">比较说明</span>
                      <Input
                        size="sm"
                        value={String(prop("subText", "较昨日同期"))}
                        onChange={(e) => setProp("subText", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">正向增长</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("isPositive", true) !== false && prop("isPositive", true) !== "false"}
                          onCheckedChange={(c) => setProp("isPositive", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">
                          {prop("isPositive", true) !== false && prop("isPositive", true) !== "false" ? "绿色上涨 (▲)" : "红色下跌 (▼)"}
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Tag */}
                {element.type === "web-tag" && (
                  <OptionsListEditor
                    title="标签组 (支持 :success/:warning/:danger/:info)"
                    mode="none"
                    value={String(prop("tags", "运行中:success,待处理:warning,执行失败:danger,离线排队:default"))}
                    onChange={(v) => setProp("tags", v)}
                    placeholder="标签名:状态..."
                  />
                )}

                {/* Web Timeline */}
                {element.type === "web-timeline" && (
                  <OptionsListEditor
                    title="时间轴节点 (支持 :done/:process/:pending)"
                    mode="none"
                    value={String(prop("events", "14:32:45 提交发布单:done,14:35:10 自动化单元测试通过:done,14:40:00 灰度发布至50%流量:process,15:00:00 全量上线:pending"))}
                    onChange={(v) => setProp("events", v)}
                    placeholder="时间 事件名称:状态..."
                  />
                )}

                {/* Web Badge */}
                {element.type === "web-badge" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">徽章名称</span>
                      <Input
                        size="sm"
                        value={String(prop("label", "未读消息"))}
                        onChange={(e) => setProp("label", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">角标数字</span>
                      <Input
                        size="sm"
                        value={String(prop("count", "99+"))}
                        onChange={(e) => setProp("count", e.target.value)}
                        className="h-7 text-xs font-mono font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Web Avatar Group */}
                {element.type === "web-avatar-group" && (
                  <>
                    <OptionsListEditor
                      title="头像缩写列表"
                      mode="none"
                      value={String(prop("initials", "TX,BP,AL,WD"))}
                      onChange={(v) => setProp("initials", v)}
                      placeholder="头像缩写..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">溢出文案</span>
                      <Input
                        size="sm"
                        value={String(prop("overflowText", "+6"))}
                        onChange={(e) => setProp("overflowText", e.target.value)}
                        className="h-7 text-xs font-mono font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Web Modal / Web Drawer */}
                {(element.type === "web-modal" || element.type === "web-drawer") && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">标题名称</span>
                      <Input
                        size="sm"
                        value={String(prop("title", element.type === "web-modal" ? "新建集群节点配置" : "查看实例运行详情"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    {element.type === "web-modal" && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">正文说明内容</span>
                        <textarea
                          value={String(prop("content", "请确认节点分配的 CPU 与内存资源，配置提交后将触发自动化部署流水线。"))}
                          onChange={(e) => setProp("content", e.target.value)}
                          rows={3}
                          className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">确定文案</span>
                        <Input
                          size="sm"
                          value={String(prop("confirmText", element.type === "web-modal" ? "立即创建" : "保存修改"))}
                          onChange={(e) => setProp("confirmText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">取消文案</span>
                        <Input
                          size="sm"
                          value={String(prop("cancelText", element.type === "web-modal" ? "取消" : "关闭"))}
                          onChange={(e) => setProp("cancelText", e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Web Alert */}
                {element.type === "web-alert" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "系统维护升级通知"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">详细说明</span>
                      <Input
                        size="sm"
                        value={String(prop("description", "底层网络将于今日 24:00 进行例行维护，请提前做好数据保存。"))}
                        onChange={(e) => setProp("description", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示基调</span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        {[
                          { id: "info", label: "信息" },
                          { id: "success", label: "成功" },
                          { id: "warning", label: "警告" },
                          { id: "error", label: "错误" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setProp("tone", t.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border select-none cursor-pointer transition-colors",
                              prop("tone", "warning") === t.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Web Popconfirm */}
                {element.type === "web-popconfirm" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示问题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "确定要永久删除该记录吗？"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">确定文案</span>
                        <Input
                          size="sm"
                          value={String(prop("confirmText", "确定"))}
                          onChange={(e) => setProp("confirmText", e.target.value)}
                          className="h-7 text-xs font-bold"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="w-12 shrink-0 text-[10px] text-muted-foreground">取消文案</span>
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

                {/* Web Notification */}
                {element.type === "web-notification" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">通知标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "任务执行成功"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">通知正文</span>
                      <textarea
                        value={String(prop("message", "您的数据导出任务已完成，点击可直接下载生成的报表文件。"))}
                        onChange={(e) => setProp("message", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">时间戳</span>
                      <Input
                        size="sm"
                        value={String(prop("time", "刚刚"))}
                        onChange={(e) => setProp("time", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Web Tips */}
                {element.type === "web-tips" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "系统状态提示"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">提示说明内容</span>
                      <textarea
                        value={String(prop("content", "当前节点资源利用率正常，网络链路响应时延 12ms。"))}
                        onChange={(e) => setProp("content", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">状态基调</span>
                      <div className="grid grid-cols-5 gap-1 flex-1">
                        {[
                          { id: "info", label: "信息" },
                          { id: "success", label: "成功" },
                          { id: "warning", label: "警告" },
                          { id: "error", label: "错误" },
                          { id: "default", label: "默认" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setProp("tone", t.id)}
                            className={cn(
                              "h-6 rounded text-[9.5px] font-mono border select-none cursor-pointer transition-colors",
                              prop("tone", "info") === t.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">箭头方向</span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        {[
                          { id: "top", label: "上" },
                          { id: "bottom", label: "下" },
                          { id: "left", label: "左" },
                          { id: "right", label: "右" },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setProp("placement", p.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border select-none cursor-pointer transition-colors",
                              prop("placement", "top") === p.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">气泡尖角</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("showArrow", true) !== false && prop("showArrow", true) !== "false"}
                          onCheckedChange={(c) => setProp("showArrow", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">显示指向尖角</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Message */}
                {element.type === "web-message" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">提示文本</span>
                      <Input
                        size="sm"
                        value={String(prop("content", "操作成功：业务数据已实时同步至集群"))}
                        onChange={(e) => setProp("content", e.target.value)}
                        className="h-7 text-xs font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">状态类型</span>
                      <div className="grid grid-cols-5 gap-1 flex-1">
                        {[
                          { id: "success", label: "成功" },
                          { id: "warning", label: "警告" },
                          { id: "error", label: "错误" },
                          { id: "info", label: "信息" },
                          { id: "loading", label: "加载" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setProp("tone", t.id)}
                            className={cn(
                              "h-6 rounded text-[9.5px] font-mono border select-none cursor-pointer transition-colors",
                              prop("tone", "success") === t.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] text-muted-foreground">关闭按钮</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium select-none">
                        <Checkbox
                          checked={prop("closable", true) !== false && prop("closable", true) !== "false"}
                          onCheckedChange={(c) => setProp("closable", Boolean(c))}
                        />
                        <span className="text-[11px] text-foreground/80">允许手动关闭 [X]</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Web Empty State */}
                {element.type === "web-empty-state" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">缺省主标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "暂无关联业务数据"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">详细说明</span>
                      <textarea
                        value={String(prop("description", "当前筛选条件下未检索到任何符合条件的结果，请重新输入或清空重置"))}
                        onChange={(e) => setProp("description", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">按钮文案</span>
                      <Input
                        size="sm"
                        value={String(prop("buttonText", "新建一条记录"))}
                        onChange={(e) => setProp("buttonText", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Web Admin Layout */}
                {element.type === "web-admin-layout" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">后台名称</span>
                    <Input
                      size="sm"
                      value={String(prop("systemTitle", "BLUEPEN 管理后台"))}
                      onChange={(e) => setProp("systemTitle", e.target.value)}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                )}

                {/* Web Filter Bar */}
                {element.type === "web-filter-bar" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">搜索提示</span>
                      <Input
                        size="sm"
                        value={String(prop("keyword", "搜索关键词..."))}
                        onChange={(e) => setProp("keyword", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">部门筛选</span>
                      <Input
                        size="sm"
                        value={String(prop("dept", "全部部门"))}
                        onChange={(e) => setProp("dept", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">日期范围</span>
                      <Input
                        size="sm"
                        value={String(prop("dateRange", "2026-08-01 ~ 2026-08-31"))}
                        onChange={(e) => setProp("dateRange", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Web CRUD Table */}
                {element.type === "web-crud-table" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">页面标题</span>
                    <Input
                      size="sm"
                      value={String(prop("pageTitle", "服务集群实例列表"))}
                      onChange={(e) => setProp("pageTitle", e.target.value)}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                )}

                {/* Web Form Layout */}
                {element.type === "web-form-layout" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">表单标题</span>
                    <Input
                      size="sm"
                      value={String(prop("formTitle", "新建企业级微服务实例"))}
                      onChange={(e) => setProp("formTitle", e.target.value)}
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                )}

                {/* Web Login Card */}
                {element.type === "web-login-card" && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] text-muted-foreground">系统标题</span>
                    <Input
                      size="sm"
                      value={String(prop("systemName", "BLUEPEN PROTOTYPE"))}
                      onChange={(e) => setProp("systemName", e.target.value)}
                      className="h-7 text-xs font-bold font-mono"
                    />
                  </div>
                )}

                {/* Web Steps Form */}
                {element.type === "web-steps-form" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">步骤标题</span>
                      <Input
                        size="sm"
                        value={String(prop("stepTitle", "第一步：填写基础集群参数"))}
                        onChange={(e) => setProp("stepTitle", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <OptionsListEditor
                      title="步骤列表"
                      mode="none"
                      value={String(prop("steps", "填写基本信息,配置权限策略,关联数据源,完成创建"))}
                      onChange={(v) => setProp("steps", v)}
                      placeholder="步骤标题..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前步骤</span>
                      <NumField
                        value={Number(prop("current", 1))}
                        min={1}
                        max={10}
                        onChange={(v) => setProp("current", Math.max(1, v))}
                      />
                    </div>
                  </>
                )}

                {/* Agent Prompt Box */}
                {element.type === "agent-prompt-box" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">输入提示占位符</span>
                      <Input
                        size="sm"
                        value={String(prop("placeholder", "有什么问题请问我吧，输入 / 可调用技能"))}
                        onChange={(e) => setProp("placeholder", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">权限标签</span>
                      <Input
                        size="sm"
                        value={String(prop("permissionText", "默认权限"))}
                        onChange={(e) => setProp("permissionText", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">模型名称</span>
                      <Input
                        size="sm"
                        value={String(prop("modelName", "高级模型"))}
                        onChange={(e) => setProp("modelName", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">挂载工程</span>
                      <Input
                        size="sm"
                        value={String(prop("projectScope", "Project-D"))}
                        onChange={(e) => setProp("projectScope", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Prompt Toolbar */}
                {element.type === "agent-prompt-toolbar" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">挂载工程</span>
                      <Input
                        size="sm"
                        value={String(prop("projectScope", "Project-D"))}
                        onChange={(e) => setProp("projectScope", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">生成页数</span>
                      <Input
                        size="sm"
                        value={String(prop("pageCount", "4-6 页"))}
                        onChange={(e) => setProp("pageCount", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">比例尺寸</span>
                      <Input
                        size="sm"
                        value={String(prop("ratio", "16:9"))}
                        onChange={(e) => setProp("ratio", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">输出语言</span>
                      <Input
                        size="sm"
                        value={String(prop("language", "中文"))}
                        onChange={(e) => setProp("language", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Stream Header */}
                {element.type === "agent-stream-header" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">智能体名</span>
                      <Input
                        size="sm"
                        value={String(prop("agentName", "ClawHive 总管"))}
                        onChange={(e) => setProp("agentName", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">消耗积分</span>
                      <Input
                        size="sm"
                        value={String(prop("consumedPoints", "21"))}
                        onChange={(e) => setProp("consumedPoints", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">已耗时长</span>
                      <Input
                        size="sm"
                        value={String(prop("elapsedTime", "2m 39s"))}
                        onChange={(e) => setProp("elapsedTime", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Tool Step */}
                {element.type === "agent-tool-step" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">工具动作</span>
                      <Input
                        size="sm"
                        value={String(prop("toolLabel", "读取输入文件"))}
                        onChange={(e) => setProp("toolLabel", e.target.value)}
                        className="h-7 text-xs font-medium font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">执行状态</span>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        {[
                          { id: "done", label: "完成" },
                          { id: "running", label: "执行中" },
                          { id: "pending", label: "等待" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setProp("status", s.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border select-none cursor-pointer transition-colors",
                              prop("status", "done") === s.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">详情/返回说明</span>
                      <Input
                        size="sm"
                        value={String(prop("detail", "已解析 openclaw-report.docx (1.2MB)"))}
                        onChange={(e) => setProp("detail", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Employee Card */}
                {element.type === "agent-employee-card" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">角色名称</span>
                      <Input
                        size="sm"
                        value={String(prop("name", "流程画师"))}
                        onChange={(e) => setProp("name", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">技能标签</span>
                      <Input
                        size="sm"
                        value={String(prop("tags", "结构绘制,数据分析,机器学习"))}
                        onChange={(e) => setProp("tags", e.target.value)}
                        placeholder="逗号分隔标签..."
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">职责定位说明</span>
                      <textarea
                        value={String(prop("description", "将复杂想法与业务逻辑转化为高保真清晰流程图"))}
                        onChange={(e) => setProp("description", e.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </>
                )}

                {/* Agent Sidebar Header */}
                {element.type === "agent-sidebar-header" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">应用名称</span>
                      <Input
                        size="sm"
                        value={String(prop("appName", "AGENT CLAW"))}
                        onChange={(e) => setProp("appName", e.target.value)}
                        className="h-7 text-xs font-bold font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Mode Switch */}
                {element.type === "agent-mode-switch" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">分段选项</span>
                      <Input
                        size="sm"
                        value={String(prop("options", "对话,AI员工"))}
                        onChange={(e) => setProp("options", e.target.value)}
                        placeholder="逗号分隔选项..."
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">当前选中</span>
                      <Input
                        size="sm"
                        value={String(prop("active", "对话"))}
                        onChange={(e) => setProp("active", e.target.value)}
                        className="h-7 text-xs font-mono font-bold"
                      />
                    </div>
                  </>
                )}

                {/* Agent New Task Button */}
                {element.type === "agent-new-task-button" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">按钮文字</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "新建任务"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs font-medium font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Session List */}
                {element.type === "agent-session-list" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">分组标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "置顶会话"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <OptionsListEditor
                      title="会话条目列表 (:active 表示高亮)"
                      mode="none"
                      value={String(prop("items", "营销活动月度复盘分析...:active,市场趋势与竞争分析"))}
                      onChange={(v) => setProp("items", v)}
                      placeholder="会话标题:active..."
                    />
                  </>
                )}

                {/* Agent Project Tree */}
                {element.type === "agent-project-tree" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">工程名称</span>
                      <Input
                        size="sm"
                        value={String(prop("projectName", "Project-A"))}
                        onChange={(e) => setProp("projectName", e.target.value)}
                        className="h-7 text-xs font-bold font-mono"
                      />
                    </div>
                    <OptionsListEditor
                      title="项目任务列表 (:active, :loading, :dot)"
                      mode="none"
                      value={String(prop("items", "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档"))}
                      onChange={(v) => setProp("items", v)}
                      placeholder="任务标题..."
                    />
                  </>
                )}

                {/* Agent Sidebar Nav */}
                {element.type === "agent-sidebar-nav" && (
                  <>
                    <OptionsListEditor
                      title="快捷导航项 (名称:图标)"
                      mode="none"
                      value={String(prop("items", "技能·插件:Zap,知识库:FileText,定时任务:Clock"))}
                      onChange={(v) => setProp("items", v)}
                      placeholder="名称:图标..."
                    />
                  </>
                )}

                {/* Agent User Footer */}
                {element.type === "agent-user-footer" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">用户名称</span>
                      <Input
                        size="sm"
                        value={String(prop("userName", "李 · Jason · io"))}
                        onChange={(e) => setProp("userName", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">身份角色</span>
                      <Input
                        size="sm"
                        value={String(prop("role", "Pro Workspace"))}
                        onChange={(e) => setProp("role", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Model Badge */}
                {element.type === "agent-model-badge" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">模型名称</span>
                      <Input
                        size="sm"
                        value={String(prop("modelName", "高级推理模型"))}
                        onChange={(e) => setProp("modelName", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">权限级别</span>
                      <Input
                        size="sm"
                        value={String(prop("permissionText", "默认权限"))}
                        onChange={(e) => setProp("permissionText", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent User Message */}
                {element.type === "agent-user-message" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground">提问Prompt内容</span>
                      <textarea
                        value={String(prop("prompt", "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论..."))}
                        onChange={(e) => setProp("prompt", e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-md border border-input bg-background p-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">挂载工程</span>
                      <Input
                        size="sm"
                        value={String(prop("projectScope", "Project-D"))}
                        onChange={(e) => setProp("projectScope", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Agent Session Header */}
                {element.type === "agent-session-header" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">会话标题</span>
                      <Input
                        size="sm"
                        value={String(prop("title", "营销活动月度复盘分析报告"))}
                        onChange={(e) => setProp("title", e.target.value)}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">状态标签</span>
                      <Input
                        size="sm"
                        value={String(prop("badge", "STREAM ACTIVE"))}
                        onChange={(e) => setProp("badge", e.target.value)}
                        className="h-7 text-xs font-mono uppercase"
                      />
                    </div>
                  </>
                )}

                {/* Agent Status Badge */}
                {element.type === "agent-status-badge" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">标签文本</span>
                      <Input
                        size="sm"
                        value={String(prop("text", "DIFF READY"))}
                        onChange={(e) => setProp("text", e.target.value)}
                        className="h-7 text-xs font-mono font-bold uppercase"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">状态类型</span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        {[
                          { id: "default", label: "默认" },
                          { id: "success", label: "成功" },
                          { id: "warning", label: "警告" },
                          { id: "danger", label: "紧急" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setProp("status", s.id)}
                            className={cn(
                              "h-6 rounded text-[10px] font-mono border select-none cursor-pointer transition-colors",
                              prop("status", "default") === s.id
                                ? "bg-foreground text-background border-foreground font-bold"
                                : "bg-transparent text-muted-foreground border-border hover:border-border-visible"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Agent Layout Templates & Pages */}
                {(element.type === "agent-home-layout" ||
                  element.type === "agent-chat-stream-layout" ||
                  element.type === "agent-split-workspace-layout" ||
                  element.type === "agent-employee-workspace-layout" ||
                  element.type === "agent-employee-market-layout") && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">主标题/会话</span>
                      <Input
                        size="sm"
                        value={String(
                          prop(
                            "sessionTitle",
                            prop("welcomeTitle", prop("marketTitle", prop("employeeName", "营销活动月度复盘分析报告")))
                          )
                        )}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (element.type === "agent-home-layout") setProp("welcomeTitle", val);
                          else if (element.type === "agent-employee-market-layout") setProp("marketTitle", val);
                          else if (element.type === "agent-employee-workspace-layout") setProp("employeeName", val);
                          else setProp("sessionTitle", val);
                        }}
                        className="h-7 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">副标/智能体</span>
                      <Input
                        size="sm"
                        value={String(
                          prop(
                            "agentName",
                            prop("employeeDesc", prop("marketSubtitle", prop("modelName", "ClawHive 总管")))
                          )
                        )}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (element.type === "agent-home-layout") setProp("modelName", val);
                          else if (element.type === "agent-employee-market-layout") setProp("marketSubtitle", val);
                          else if (element.type === "agent-employee-workspace-layout") setProp("employeeDesc", val);
                          else setProp("agentName", val);
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </>
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
                        <div className="pl-4">
                          <NumField
                            label=""
                            value={radius}
                            min={0}
                            onChange={(v) => setProp("radius", Math.max(0, v))}
                            suffix="px"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 pl-4">
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
                    <div className="flex flex-col gap-1.5 pl-4">
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
                                <PopoverPopup backdrop={true} align="start" sideOffset={6} className="border-none bg-transparent shadow-none p-0 before:hidden [&>[data-slot=popover-viewport]]:p-0">
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
                                <PopoverPopup backdrop={true} align="start" sideOffset={6} className="border-none bg-transparent shadow-none p-0 before:hidden [&>[data-slot=popover-viewport]]:p-0">
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
                  </div>

                  {strokeEnabled && (
                    <div className="flex flex-col gap-1.5 pl-4">
                      <ColorPickerRow
                        title={isLineLike ? "线条颜色" : "描边颜色"}
                        color={stroke}
                        opacity={strokeOpacity}
                        onChange={(c, o) => setProps({ stroke: c, strokeOpacity: o })}
                        onColorChange={(c) => setProp("stroke", c)}
                        onOpacityChange={(o) => setProp("strokeOpacity", o)}
                      />

                      {/* Width & Style Row */}
                      <div className="mt-1 flex items-center gap-2">
                        <NumField
                          label="粗细"
                          value={borderWidth}
                          min={0.5}
                          step={0.5}
                          max={64}
                          onChange={(v) => setProp("borderWidth", Math.max(0.5, v))}
                          suffix="px"
                        />
                        <Menu>
                          <MenuTrigger
                            render={
                              <Button variant="outline" size="xs" className="h-7 min-w-0 flex-1 justify-between px-2 text-xs">
                                <span className="truncate">
                                  {strokeStyle === "dashed" ? "虚线" : strokeStyle === "dotted" ? "点线" : "实线"}
                                </span>
                                <ChevronDown className="size-3 shrink-0 opacity-60" />
                              </Button>
                            }
                          />
                          <MenuPopup align="end">
                            <MenuItem onClick={() => setProp("strokeStyle", "solid")}>实线</MenuItem>
                            <MenuItem onClick={() => setProp("strokeStyle", "dashed")}>虚线</MenuItem>
                            <MenuItem onClick={() => setProp("strokeStyle", "dotted")}>点线</MenuItem>
                          </MenuPopup>
                        </Menu>
                      </div>

                      {/* Stroke Position & Sides Row */}
                      {!isLineLike && (
                        <div className="flex items-center gap-2">
                          <Menu>
                            <MenuTrigger
                              render={
                                <Button variant="outline" size="xs" className="h-7 min-w-0 flex-1 justify-between px-2 text-xs">
                                  <span className="truncate">
                                    {strokePosition === "outside" ? "外描边" : strokePosition === "center" ? "居中描边" : "内描边"}
                                  </span>
                                  <ChevronDown className="size-3 shrink-0 opacity-60" />
                                </Button>
                              }
                            />
                            <MenuPopup align="start">
                              <MenuItem onClick={() => setProp("strokePosition", "inside")}>内描边</MenuItem>
                              <MenuItem onClick={() => setProp("strokePosition", "center")}>居中描边</MenuItem>
                              <MenuItem onClick={() => setProp("strokePosition", "outside")}>外描边</MenuItem>
                            </MenuPopup>
                          </Menu>

                          <Menu>
                            <MenuTrigger
                              render={
                                <Button variant="outline" size="xs" className="h-7 min-w-0 flex-1 justify-between px-2 text-xs">
                                  <span className="truncate">
                                    {strokeSides === "top"
                                      ? "仅上边框"
                                      : strokeSides === "bottom"
                                      ? "仅下边框"
                                      : strokeSides === "left"
                                      ? "仅左边框"
                                      : strokeSides === "right"
                                      ? "仅右边框"
                                      : "全部边框"}
                                  </span>
                                  <ChevronDown className="size-3 shrink-0 opacity-60" />
                                </Button>
                              }
                            />
                            <MenuPopup align="end">
                              <MenuItem onClick={() => setProp("strokeSides", "all")}>全部边框</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "top")}>仅上边框</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "bottom")}>仅下边框</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "left")}>仅左边框</MenuItem>
                              <MenuItem onClick={() => setProp("strokeSides", "right")}>仅右边框</MenuItem>
                            </MenuPopup>
                          </Menu>
                        </div>
                      )}
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
                  data-slot="element-text-input"
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
                        <Button variant="outline" size="xs" className="h-7 min-w-0 flex-1 justify-between px-2 text-[11px]">
                          <span className="truncate">{WEIGHT_OPTIONS.find((w) => w.value === fontWeight)?.label ?? "Regular"}</span>
                          <ChevronDown className="size-3 shrink-0 opacity-60" />
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
});
