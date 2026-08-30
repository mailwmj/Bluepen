"use client";

import { cn } from "@outlin/editor/lib/utils";
import { Button } from "@outlin/editor/components/ui/button";
import { Input } from "@outlin/editor/components/ui/input";
import { Separator } from "@outlin/editor/components/ui/separator";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@outlin/editor/components/ui/tabs";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@outlin/editor/components/ui/menu";
import { Slider } from "@outlin/editor/components/ui/slider";
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Trash2,
} from "lucide-react";
import type { EditorElement } from "./types";

interface RightPanelProps {
  element: EditorElement | null;
  parent?: EditorElement | null;
  onUpdate: (id: string, patch: Partial<EditorElement>) => void;
  onDelete: () => void;
}

const PRESET_COLORS = [
  "#FFFFFF", "#F5F5F4", "#E4E4E7", "#D4D4D8", "#A1A1AA", "#71717A", "#3F3F46", "#18181B",
  "#FEF3C7", "#FCA5A5", "#BBF7D0", "#BFDBFE", "#FBCFE8", "#FDE68A",
  "#EF4444", "#F59E0B", "#22C55E", "#10B981", "#3B82F6", "#6366F1", "#A855F7", "#EC4899",
];

const WEIGHT_OPTIONS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
];

const TEXT_TYPES = new Set(["text", "button", "badge", "chip", "link"]);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  suffix?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="w-4 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <Input
        size="sm"
        type="number"
        value={value}
        min={min}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
      {suffix && <span className="shrink-0 text-[10px] text-muted-foreground">{suffix}</span>}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#([0-9a-f]{6})$/i.test(value) ? value : "#18181B";
  return (
    <div className="flex items-center gap-2">
      <span className="w-11 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <div className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-input bg-background px-1.5">
        <label className="relative size-4 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-black/10" style={{ backgroundColor: hex }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} color`}
          />
        </label>
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{hex.toUpperCase()}</span>
      </div>
    </div>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          className={cn(
            "size-4 rounded-md border border-black/10 transition-transform duration-100 hover:scale-110 active:scale-95",
            value.toLowerCase() === c.toLowerCase() && "ring-2 ring-foreground ring-offset-1",
          )}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function AlignRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { v: "left", icon: AlignLeft, label: "Align left" },
    { v: "center", icon: AlignCenter, label: "Align center" },
    { v: "right", icon: AlignRight, label: "Align right" },
  ];
  return (
    <div className="flex gap-0.5">
      {options.map((o) => (
        <Button
          key={o.v}
          variant="ghost"
          size="icon-xs"
          aria-label={o.label}
          className={cn(value === o.v && "bg-foreground text-background")}
          onClick={() => onChange(o.v)}
        >
          <o.icon aria-hidden="true" />
        </Button>
      ))}
    </div>
  );
}

export function RightPanel({ element, parent, onUpdate, onDelete }: RightPanelProps) {
  if (!element) {
    return (
      <aside className="flex w-60 shrink-0 flex-col border-l bg-background/75 backdrop-blur-xl">
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-center text-xs text-muted-foreground">Select an element to edit its properties</p>
        </div>
      </aside>
    );
  }

  const setProp = (key: string, value: string | number | boolean) =>
    onUpdate(element.id, { props: { ...element.props, [key]: value } });

  const prop = (key: string, fallback: string | number | boolean) => element.props[key] ?? fallback;

  const fill = String(prop("fill", "#FFFFFF"));
  const stroke = String(prop("stroke", "#E4E4E7"));
  const radius = Number(prop("radius", 8));
  const borderWidth = Number(prop("borderWidth", 1));
  const isTextLike = TEXT_TYPES.has(element.type);
  const isContainer = element.type === "frame";

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l bg-background/75 backdrop-blur-xl">
      {/* Header: name + actions */}
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Input
            size="sm"
            value={element.name}
            onChange={(e) => onUpdate(element.id, { name: e.target.value })}
            aria-label="Element name"
            className="font-medium"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={element.visible ? "Hide" : "Show"}
            onClick={() => onUpdate(element.id, { visible: !element.visible })}
          >
            {element.visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={element.locked ? "Unlock" : "Lock"}
            onClick={() => onUpdate(element.id, { locked: !element.locked })}
          >
            {element.locked ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Delete" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] capitalize text-muted-foreground">{element.type}</span>
          {element.type === "frame" && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {element.children.length} {element.children.length === 1 ? "layer" : "layers"} inside
            </span>
          )}
          {parent && (
            <span className="truncate text-[10px] text-muted-foreground/70">in {parent.name}</span>
          )}
        </div>
      </div>

      <Tabs defaultValue="design" className="flex min-h-0 flex-1 flex-col">
        <TabsList variant="underline" className="w-full shrink-0">
          <TabsTab value="design" className="flex-1">Design</TabsTab>
          <TabsTab value="prototype" className="flex-1">Prototype</TabsTab>
          <TabsTab value="inspect" className="flex-1">Inspect</TabsTab>
        </TabsList>

        <TabsPanel value="design" className="min-h-0 flex-1 overflow-y-auto">
          {/* Frame */}
          <Section title="Frame">
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <NumField label="X" value={Math.round(element.x)} min={-10000} onChange={(v) => onUpdate(element.id, { x: v })} />
                <NumField label="Y" value={Math.round(element.y)} min={-10000} onChange={(v) => onUpdate(element.id, { y: v })} />
              </div>
              <div className="flex gap-1.5">
                <NumField label="W" value={Math.round(element.width)} min={1} onChange={(v) => onUpdate(element.id, { width: Math.max(1, v) })} />
                <NumField label="H" value={Math.round(element.height)} min={1} onChange={(v) => onUpdate(element.id, { height: Math.max(1, v) })} />
              </div>
              <div className="flex gap-1.5">
                <NumField label="↻" value={Math.round(element.rotation)} onChange={(v) => onUpdate(element.id, { rotation: v })} suffix="°" />
                <NumField label="◒" value={radius} min={0} onChange={(v) => setProp("radius", Math.max(0, v))} suffix="px" />
              </div>
            </div>
          </Section>

          {/* Position */}
          <Section title="Position">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon-xs" aria-label="Align left" onClick={() => onUpdate(element.id, { x: 0 })}><AlignStartVertical aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon-xs" aria-label="Center horizontally" onClick={() => onUpdate(element.id, { x: Math.round(((parent?.width ?? 1440) - element.width) / 2) })}><AlignCenterVertical aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon-xs" aria-label="Align right" onClick={() => onUpdate(element.id, { x: (parent?.width ?? 1440) - element.width })}><AlignEndVertical aria-hidden="true" /></Button>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Button variant="ghost" size="icon-xs" aria-label="Align top" onClick={() => onUpdate(element.id, { y: 0 })}><AlignStartHorizontal aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon-xs" aria-label="Center vertically" onClick={() => onUpdate(element.id, { y: Math.round(((parent?.height ?? 900) - element.height) / 2) })}><AlignCenterHorizontal aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon-xs" aria-label="Align bottom" onClick={() => onUpdate(element.id, { y: (parent?.height ?? 900) - element.height })}><AlignEndHorizontal aria-hidden="true" /></Button>
              <span className="ml-auto text-[9px] text-muted-foreground/70">vs {parent ? parent.name : "1440×900"}</span>
            </div>
          </Section>

          {/* Typography */}
          {isTextLike && (
            <Section title="Typography">
              <div className="flex flex-col gap-2">
                <textarea
                  value={String(prop("text", ""))}
                  onChange={(e) => setProp("text", e.target.value)}
                  rows={2}
                  placeholder="Text content…"
                  className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex items-center gap-1.5">
                  <NumField label="Aa" value={Number(prop("fontSize", 16))} min={6} onChange={(v) => setProp("fontSize", Math.max(6, v))} suffix="px" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button variant="outline" size="xs" className="justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <Bold aria-hidden="true" className="size-3" />
                            {WEIGHT_OPTIONS.find((w) => w.value === Number(prop("fontWeight", 400)))?.label ?? "Regular"}
                          </span>
                          <ChevronDown aria-hidden="true" className="size-3" />
                        </Button>
                      }
                    />
                    <MenuPopup align="start">
                      {WEIGHT_OPTIONS.map((w) => (
                        <MenuItem key={w.value} onClick={() => setProp("fontWeight", w.value)}>
                          {w.label}
                        </MenuItem>
                      ))}
                    </MenuPopup>
                  </Menu>
                  <AlignRow value={String(prop("align", "left"))} onChange={(v) => setProp("align", v)} />
                </div>
                <ColorField label="Text" value={String(prop("textColor", "#18181B"))} onChange={(v) => setProp("textColor", v)} />
                <ColorSwatches value={String(prop("textColor", "#18181B"))} onChange={(v) => setProp("textColor", v)} />
              </div>
            </Section>
          )}

          {/* Appearance */}
          <Section title="Appearance">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-11 shrink-0 text-[10px] text-muted-foreground">Opacity</span>
                <Slider
                  className="flex-1"
                  value={[Math.round(element.opacity * 100)]}
                  min={5}
                  max={100}
                  onValueChange={(v) =>
                    onUpdate(element.id, { opacity: (Array.isArray(v) ? (v[0] ?? 100) : (v ?? 100)) / 100 })
                  }
                />
                <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground">{Math.round(element.opacity * 100)}%</span>
              </div>
              <ColorField label="Fill" value={fill} onChange={(v) => setProp("fill", v)} />
              <ColorSwatches value={fill} onChange={(v) => setProp("fill", v)} />
              {(element.type !== "text" || isContainer) && (
                <>
                  <ColorField label="Stroke" value={stroke} onChange={(v) => setProp("stroke", v)} />
                  <div className="flex items-center gap-2">
                    <span className="w-11 shrink-0 text-[10px] text-muted-foreground">Border</span>
                    <NumField label="" value={borderWidth} min={0} onChange={(v) => setProp("borderWidth", Math.max(0, v))} suffix="px" />
                  </div>
                </>
              )}
            </div>
          </Section>
        </TabsPanel>

        <TabsPanel value="prototype" className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="text-xs text-muted-foreground">Prototype settings coming soon</p>
        </TabsPanel>

        <TabsPanel value="inspect" className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1.5">
            {[
              ["Type", element.type],
              ["Position", `${Math.round(element.x)}, ${Math.round(element.y)}`],
              ["Size", `${Math.round(element.width)} × ${Math.round(element.height)}`],
              ["Rotation", `${element.rotation}°`],
              ["Opacity", `${Math.round(element.opacity * 100)}%`],
              ["Visible", element.visible ? "Yes" : "No"],
              ["Locked", element.locked ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </TabsPanel>
      </Tabs>
    </aside>
  );
}
