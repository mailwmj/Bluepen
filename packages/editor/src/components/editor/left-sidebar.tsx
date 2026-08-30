"use client";

import { useState } from "react";
import { cn } from "@outlin/editor/lib/utils";
import { Button } from "@outlin/editor/components/ui/button";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  LayoutDashboard,
  FileText,
  Box,
  Trash2,
  Search,
  Menu,
  PanelLeft,
  Layout,
  Shapes,
  HelpCircle,
  Square,
  Columns,
  List,
  Maximize2,
  AlertTriangle,
  Bell,
  MousePointerClick,
  Type,
  User,
  Frame,
  PanelTop,
  Route,
  Rows3,
  Link,
  Minus,
  Grid3X3,
  Quote,
  BadgeDollarSign,
  BarChart3,
  Landmark,
  Users,
  Mail,
  Send,
  Megaphone,
  LayoutGrid,
  GitCommitHorizontal,
  Columns3,
  Calendar,
  TrendingUp,
  AreaChart,
  PackageOpen,
  PanelRightOpen,
  PanelBottomOpen,
  MessagesSquare,
  MessageCircle,
  Command,
  Image,
  Video,
  Badge,
  Tag,
  Gauge,
  Loader,
  Braces,
  Star,
  AlignLeft,
  ChevronsUpDown,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  SlidersHorizontal,
  Upload,
  CalendarDays,
  ListOrdered,
  MousePointer2,
  ChevronsRight,
} from "lucide-react";
import type { ComponentType, EditorElement, Page } from "./types";
import { library } from "./library/index";

interface LeftSidebarProps {
  pages: Page[];
  activePageId: string;
  onPageSelect: (id: string) => void;
  onPageAdd: () => void;
  onPageDelete: (id: string) => void;
  elements: EditorElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddAsset: (type: ComponentType) => void;
}

const pageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  landing: Globe,
  dashboard: LayoutDashboard,
};

const libIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Menu, PanelLeft, Layout, PanelTop, Route, Rows3, Frame, ChevronsRight, Minus, Link,
  Shapes, Grid3X3, Quote, BadgeDollarSign, HelpCircle, BarChart3, Landmark,
  Users, Mail, Send, FileText, Megaphone, LayoutDashboard, Square, Columns, List,
  LayoutGrid, GitCommitHorizontal, Columns3, Calendar, TrendingUp, AreaChart, PackageOpen,
  Maximize2, AlertTriangle, Bell, PanelRightOpen, PanelBottomOpen, MessagesSquare,
  MessageCircle, ChevronDown, Command, Type, Image, Video, User, Badge, Tag, Gauge,
  Loader, Braces, Star, Search, AlignLeft, ChevronsUpDown, CheckSquare, CircleDot,
  ToggleLeft, SlidersHorizontal, Upload, CalendarDays, ListOrdered, MousePointerClick,
  MousePointer2, Box,
};

function getLibIcon(name: string) {
  const Icon = libIcons[name];
  if (!Icon) return <Box aria-hidden="true" className="size-3.5" />;
  return <Icon aria-hidden="true" className="size-3.5" />;
}

function LayerTreeItem({
  el,
  selectedId,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  depth = 0,
}: {
  el: EditorElement;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateElement: (id: string, patch: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const libEntry = library.find((c) => c.type === el.type);
  const hasChildren = el.children.length > 0;
  const isSelected = selectedId === el.id;

  return (
    <div>
      <div
        className={cn(
          "group flex h-7 cursor-pointer items-center gap-1 rounded-sm pr-1.5 text-xs transition-colors",
          isSelected ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
        )}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        onClick={() => onSelect(el.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        <span className="flex size-4 shrink-0 items-center justify-center opacity-70">
          {el.type === "text" ? <Type className="size-3.5" /> : el.type === "rectangle" ? <Square className="size-3.5" /> : libEntry ? getLibIcon(libEntry.icon) : <Box className="size-3.5" />}
        </span>

        <span className="truncate flex-1">{el.name}</span>

        {el.locked && <Lock aria-hidden="true" className="size-3 shrink-0 text-muted-foreground/60" />}

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { visible: !el.visible }); }}
            aria-label={el.visible ? "Hide" : "Show"}
          >
            {el.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          </button>
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { locked: !el.locked }); }}
            aria-label={el.locked ? "Unlock" : "Lock"}
          >
            {el.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          </button>
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-sm hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
            aria-label={`Delete ${el.name}`}
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>

      {hasChildren && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-apple",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            {el.children.map((child) => (
              <LayerTreeItem
                key={child.id}
                el={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetCategory({
  category,
  items,
  onAddAsset,
}: {
  category: string;
  items: typeof library;
  onAddAsset: (type: ComponentType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="flex h-7 w-full items-center gap-2 px-3 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent/50 active:bg-accent"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className={cn(
            "flex size-3 shrink-0 items-center justify-center text-muted-foreground/50 transition-transform duration-300 ease-apple",
            open && "rotate-90",
          )}
        >
          <ChevronRight aria-hidden="true" className="size-3" />
        </span>
        <span className="flex-1 truncate text-left">{category}</span>
        <span className="text-muted-foreground/40">{items.length}</span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-apple",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="py-0.5">
            {items.map((item) => (
              <button
                key={item.type}
                type="button"
                title={`Add ${item.label}`}
                className="flex h-7 w-full items-center gap-2 pl-6 pr-3 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent/50 active:bg-accent"
                onClick={() => onAddAsset(item.type)}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {getLibIcon(item.icon)}
                </span>
                <span className="flex-1 truncate text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeftSidebar({
  pages,
  activePageId,
  onPageSelect,
  onPageAdd,
  onPageDelete,
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
  onDeleteElement,
  onAddAsset,
}: LeftSidebarProps) {
  const assetCategories = Array.from(new Set(library.map((c) => c.category)));
  const roots = elements.filter((el) => !el.parentId || !elements.some((p) => p.id === el.parentId));

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      {/* PAGES */}
      <div className="border-b">
        <div className="flex items-center justify-between py-2 pl-3 pr-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pages</span>
          <Button variant="ghost" size="icon-xs" onClick={onPageAdd} aria-label="Add page">
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <div className="pb-1.5">
          {pages.map((page) => {
            const Icon = pageIcons[page.id] || FileText;
            const isActive = activePageId === page.id;
            return (
              <div
                key={page.id}
                className={cn(
                  "group flex h-7 w-full animate-fade-up items-center gap-2 pr-2 pl-3 text-xs transition-colors duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50",
                )}
                onClick={() => onPageSelect(page.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onPageSelect(page.id);
                }}
              >
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="flex-1 truncate text-left">{page.name}</span>
                <button
                  type="button"
                  title="Delete page"
                  aria-label={`Delete page ${page.name}`}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60 opacity-0 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageDelete(page.id);
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-3" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="flex h-7 w-full items-center gap-2 px-3 text-xs text-muted-foreground transition-colors hover:bg-accent/50"
            onClick={onPageAdd}
          >
            <Plus aria-hidden="true" className="size-3.5 shrink-0" />
            <span>Add page</span>
          </button>
        </div>
      </div>

      {/* LAYERS */}
      <div className="min-h-0 flex-1 overflow-y-auto border-b">
        <div className="flex items-center justify-between py-2 pl-3 pr-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Layers</span>
        </div>
        <div className="pb-1.5">
          {roots.map((el) => (
            <LayerTreeItem
              key={el.id}
              el={el}
              selectedId={selectedId}
              onSelect={onSelect}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
            />
          ))}
          {roots.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground/70">No layers yet. Add an asset or press F.</p>
          )}
        </div>
      </div>

      {/* ASSETS */}
      <div>
        <div className="flex items-center justify-between py-2 pl-3 pr-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assets</span>
        </div>
        <div className="pb-2">
          {assetCategories.map((category) => {
            const items = library.filter((c) => c.category === category);
            return (
              <AssetCategory
                key={category}
                category={category}
                items={items}
                onAddAsset={onAddAsset}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
}
