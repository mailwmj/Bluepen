import React, { useState, useRef, useEffect, useMemo } from "react";
import type { ComponentType } from "../types";
import type { ComponentRenderContext } from "./renderers";
import { cn } from "@bluepen/editor/lib/utils";
import { computeShapeStyle, hexToRgba } from "../utils/shape-styles";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  X,
  Check,
  MoreHorizontal,
  Upload,
  CalendarDays,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Filter,
  RefreshCw,
  FolderTree,
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Info,
  PackageOpen,
  TrendingUp,
  Tag,
  CheckSquare,
  CircleDot,
  SlidersHorizontal,
  Lock,
  User,
  LayoutDashboard,
  Shield,
  Table,
  UploadCloud,
  FileText,
  Sliders,
  ExternalLink,
  Loader2,
  Trash2,
  Download,
  Settings,
  Edit,
} from "lucide-react";

type Props = Record<string, string | number | boolean>;
const val = (props: Props, key: string, fallback: string | number | boolean) =>
  props[key] ?? fallback;

export function parseItems(valStr: unknown, fallback: string[]): string[] {
  if (Array.isArray(valStr)) return valStr.map(String);
  if (typeof valStr === "string") {
    const trimmed = valStr.trim();
    if (!trimmed) return fallback;
    const splitByNewline = trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
    if (splitByNewline.length > 1) return splitByNewline;
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return fallback;
}

// =========================================================================
// 1. Web 导航组件 (Web Navigation)
// =========================================================================

export function WebDropdownPreview({ props = {} }: { props?: Props }) {
  const triggerText = String(val(props, "triggerText", "下拉操作菜单"));
  const rawItems = val(props, "items", "查看详情,编辑信息,权限设置,---,导出数据,删除项目:danger");
  const items = parseItems(rawItems, ["查看详情", "编辑信息", "权限设置", "---", "导出数据", "删除项目:danger"]);
  const isOpen = props.isOpen === true || props.isOpen === "true";
  const triggerStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col font-sans select-none">
      {/* Trigger Button */}
      <div
        className={cn("flex w-full items-center justify-between px-3 text-xs font-medium text-foreground shadow-2xs", isOpen ? "h-9 shrink-0" : "h-full")}
        style={triggerStyle}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1.5" />
      </div>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="mt-1.5 flex flex-1 flex-col overflow-hidden rounded-md border border-border-visible bg-surface p-1 shadow-md">
          {items.map((item, idx) => {
            if (item === "---" || item === "-" || item === "divider") {
              return <div key={`div-${idx}`} className="my-1 border-t border-border-visible/50" />;
            }
            const isDanger = item.includes(":danger");
            const label = item.replace(":danger", "").trim();

            return (
              <div
                key={`${label}-${idx}`}
                className={cn(
                  "flex h-7 items-center justify-between rounded-xs px-2.5 text-xs transition-colors",
                  isDanger
                    ? "text-[#D71921] hover:bg-[#D71921]/10 font-medium"
                    : "text-foreground hover:bg-surface-raised"
                )}
              >
                <span className="truncate">{label}</span>
                {idx === 0 && <span className="font-mono text-[9px] text-muted-foreground uppercase">⌘D</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WebTopNavPreview({ props = {} }: { props?: Props }) {
  const logoText = String(val(props, "logoText", "后台管理系统"));
  const rawLinks = val(props, "links", "概览仪表盘,项目管理,数据资产,团队协作,系统配置");
  const links = parseItems(rawLinks, ["概览仪表盘", "项目管理", "数据资产", "团队协作", "系统配置"]);
  const activeIndex = Number(val(props, "activeIndex", 0));
  const userName = String(val(props, "userName", "系统管理员"));

  return (
    <div className="flex h-full w-full items-center justify-between border-b border-border bg-surface px-6 select-none">
      {/* Brand & Links */}
      <div className="flex min-w-0 items-center gap-8">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background font-mono text-xs font-bold">
            系统
          </div>
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">{logoText}</span>
        </div>

        <nav className="flex items-center gap-1">
          {links.map((link, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={link}
                className={cn(
                  "relative flex h-10 items-center px-3 text-xs font-medium transition-colors cursor-default",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{link}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground" />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-8 w-44 items-center gap-2 rounded-md border border-border-visible bg-background px-2.5 font-mono text-[11px] text-muted-foreground">
          <Search className="size-3 text-muted-foreground shrink-0" />
          <span className="truncate">全局搜索...</span>
          <span className="ml-auto rounded-xs border border-border-visible bg-surface px-1 text-[9px]">⌘K</span>
        </div>

        <div className="flex size-8 items-center justify-center rounded-md border border-border-visible bg-surface text-muted-foreground">
          <Bell className="size-3.5" />
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="flex size-7 items-center justify-center rounded-full bg-surface-raised border border-border-visible font-mono text-[10px] font-bold text-foreground">
            AM
          </div>
          <span className="text-xs font-medium text-foreground">{userName}</span>
        </div>
      </div>
    </div>
  );
}

export interface MenuCategoryGroup {
  title: string;
  items: string[];
}

export function parseMenuCategories(props: Props): MenuCategoryGroup[] {
  // 1. If explicit props.categories exists (JSON array string or array)
  if (props.categories !== undefined && props.categories !== null) {
    try {
      const parsed = typeof props.categories === "string" ? JSON.parse(props.categories) : props.categories;
      if (Array.isArray(parsed)) {
        return parsed.map((cat: any, idx: number) => {
          const title = typeof cat?.title === "string" ? cat.title : (cat?.name ? String(cat.name) : `分类 ${idx + 1}`);
          const items = parseItems(cat?.items, []);
          return { title, items };
        });
      }
    } catch {
      // fallback
    }
  }

  // 2. Dynamic check for indexed props: category1/items1, category2/items2, ...
  const indexed: MenuCategoryGroup[] = [];
  let i = 1;
  while (props[`category${i}`] !== undefined || props[`items${i}`] !== undefined) {
    const rawTitle = props[`category${i}`];
    const title = rawTitle !== undefined ? String(rawTitle) : `分类 ${i}`;
    const rawItems = props[`items${i}`] ?? (i === 1 ? props.items : "");
    const items = parseItems(rawItems, []);
    indexed.push({ title, items });
    i++;
  }

  if (indexed.length > 0) {
    return indexed;
  }

  // 3. Fallback defaults if nothing specified
  return [
    { title: "核心工作台", items: ["分析概览", "实时大屏"] },
    { title: "系统与权限", items: ["用户列表", "角色策略", "审计日志"] },
  ];
}

export function WebMenuPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "控制台导航"));
  const version = String(val(props, "version", ""));
  const showCategories = props.showCategories !== false && props.showCategories !== "false";
  const categories = parseMenuCategories(props);

  const flatItems = useMemo(() => {
    if (props.items1 !== undefined || props.items !== undefined) {
      return parseItems(props.items1 ?? props.items, ["分析概览", "实时大屏", "用户列表", "角色策略", "审计日志"]);
    }
    return categories.flatMap((c) => c.items);
  }, [props.items1, props.items, categories]);

  const allAvailableItems = showCategories ? categories.flatMap((c) => c.items) : flatItems;
  const activeKeyProp = String(val(props, "activeKey", ""));
  const activeKey = allAvailableItems.includes(activeKeyProp)
    ? activeKeyProp
    : (allAvailableItems[0] ?? "");

  const getIconForLabel = (label: string, idx: number) => {
    if (label.includes("概览") || label.includes("仪表") || label.includes("控制")) return LayoutDashboard;
    if (label.includes("大屏") || label.includes("图表") || label.includes("趋势")) return TrendingUp;
    if (label.includes("用户") || label.includes("人员") || label.includes("成员")) return User;
    if (label.includes("权限") || label.includes("角色") || label.includes("安全")) return Shield;
    if (label.includes("日志") || label.includes("审计") || label.includes("文档")) return FileText;
    if (label.includes("配置") || label.includes("设置") || label.includes("系统")) return Sliders;
    if (label.includes("数据") || label.includes("资产") || label.includes("表格")) return Table;
    return [LayoutDashboard, TrendingUp, User, Shield, FileText, FolderTree, Table, Sliders][idx % 8] || LayoutDashboard;
  };

  const renderMenuItem = (label: string, idx: number) => {
    const isActive = label === activeKey;
    const IconComp = getIconForLabel(label, idx);

    return (
      <div
        key={`${label}-${idx}`}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors cursor-default",
          isActive
            ? "bg-surface-raised text-foreground font-bold border border-border-visible shadow-2xs"
            : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground"
        )}
      >
        <IconComp className={cn("size-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
        <span className="truncate">{label}</span>
        {isActive && <span className="ml-auto size-1.5 rounded-full bg-foreground" />}
      </div>
    );
  };

  const menuStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 0 });

  let globalItemIndex = 0;

  return (
    <div className="flex h-full w-full flex-col border-r select-none font-sans" style={menuStyle}>
      {title && (
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">{title}</span>
          {version && (
            <span className="rounded-xs bg-surface-raised border border-border-visible px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              {version}
            </span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {showCategories ? (
          categories.map((cat, catIdx) => {
            if (cat.items.length === 0 && !cat.title) return null;
            return (
              <div key={catIdx} className="space-y-1">
                {cat.title && (
                  <div className="px-2 font-mono text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
                    {cat.title}
                  </div>
                )}
                {cat.items.map((label) => {
                  const currentIdx = globalItemIndex++;
                  return renderMenuItem(label, currentIdx);
                })}
              </div>
            );
          })
        ) : (
          /* Flat list without categories */
          <div className="space-y-1">
            {flatItems.map((label, idx) => renderMenuItem(label, idx))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WebTabsPreview({ props = {} }: { props?: Props }) {
  const rawTabs = val(props, "tabs", "全部订单,待支付(3),进行中(12),已完成,已退款");
  const tabs = parseItems(rawTabs, ["全部订单", "待支付(3)", "进行中(12)", "已完成", "已退款"]);
  const activeIndex = Number(val(props, "activeIndex", 0));
  const variant = String(val(props, "variant", "line"));

  if (variant === "card") {
    return (
      <div className="flex h-full w-full items-center gap-1 border-b border-border bg-surface px-2 select-none">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={tab}
              className={cn(
                "flex h-8 items-center justify-center rounded-t-md px-3.5 text-xs font-medium transition-colors cursor-default border-t border-x",
                isActive
                  ? "border-border-visible bg-background font-bold text-foreground -mb-px"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="truncate">{tab}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center gap-6 border-b border-border bg-surface px-3 select-none">
      {tabs.map((tab, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={tab}
            className={cn(
              "relative flex h-full items-center text-xs font-medium transition-colors cursor-default",
              isActive ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{tab}</span>
            {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

export function WebBreadcrumbPreview({ props = {} }: { props?: Props }) {
  const pathStr = String(val(props, "path", "工作台 / 研发项目 / 迭代计划 / 需求详情"));
  const items = pathStr.split("/").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex h-full w-full items-center gap-1.5 px-3 font-sans select-none">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={`${item}-${idx}`} className="flex items-center gap-1.5 text-xs">
            <span className={cn("truncate", isLast ? "font-bold text-foreground" : "text-muted-foreground")}>
              {item}
            </span>
            {!isLast && <span className="text-muted-foreground/60 font-mono text-[10px]">/</span>}
          </div>
        );
      })}
    </div>
  );
}

export function WebPaginationPreview({ props = {} }: { props?: Props }) {
  const current = Number(val(props, "current", 1));
  const total = Number(val(props, "total", 128));
  const pageSize = Number(val(props, "pageSize", 10));
  const totalPages = Math.ceil(total / pageSize) || 13;
  const pagStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center justify-between px-3.5 font-mono text-xs select-none" style={pagStyle}>
      <span className="text-muted-foreground">共 {total} 条</span>

      <div className="flex items-center gap-1.5">
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-background text-muted-foreground hover:text-foreground cursor-default">
          &lt;
        </div>
        {[1, 2, 3, "...", totalPages].map((pg, idx) => {
          const isActive = pg === current;
          return (
            <div
              key={`${pg}-${idx}`}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-xs font-semibold cursor-default",
                isActive
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "border border-border-visible bg-background text-foreground hover:bg-surface-raised"
              )}
            >
              {pg}
            </div>
          );
        })}
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-background text-muted-foreground hover:text-foreground cursor-default">
          &gt;
        </div>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex h-7 items-center gap-1 rounded-md border border-border-visible bg-background px-2 text-[11px]">
          <span>{pageSize} 条/页</span>
          <ChevronDown className="size-3" />
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span>跳至</span>
          <span className="flex h-6 w-8 items-center justify-center rounded-xs border border-border-visible bg-background font-bold text-foreground">
            {current}
          </span>
          <span>页</span>
        </div>
      </div>
    </div>
  );
}

export function WebStepsPreview({ props = {} }: { props?: Props }) {
  const rawSteps = val(props, "steps", "填写基本信息,配置权限策略,关联数据源,完成创建");
  const steps = parseItems(rawSteps, ["填写基本信息", "配置权限策略", "关联数据源", "完成创建"]);
  const current = Number(val(props, "current", 2));

  return (
    <div className="flex h-full w-full items-center justify-between px-4 font-sans select-none">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < current;
        const isCurrent = stepNum === current;

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold transition-colors",
                  isDone
                    ? "bg-surface-raised border border-foreground text-foreground"
                    : isCurrent
                    ? "bg-foreground text-background"
                    : "border border-border-visible bg-surface text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3.5 stroke-[3]" /> : stepNum}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-xs font-medium leading-tight", isCurrent ? "font-bold text-foreground" : "text-muted-foreground")}>
                  {step}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/60 uppercase">
                  {isDone ? "COMPLETED" : isCurrent ? "IN PROGRESS" : "PENDING"}
                </span>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-3", isDone ? "bg-foreground" : "bg-border-visible")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// =========================================================================
// 2. Web 表单输入与操作组件 (Web Form & Action)
// =========================================================================

export function WebButtonPreview({ props = {}, isEditing }: { props?: Props; isEditing?: boolean }) {
  const text = String(val(props, "text", "主要操作"));
  const variant = String(val(props, "variant", "primary"));
  const size = String(val(props, "size", "md"));
  const shape = String(val(props, "shape", "pill"));
  const icon = String(val(props, "icon", "Plus"));
  const disabled = props.disabled === true || props.disabled === "false";
  const loading = props.loading === true || props.loading === "true";

  // Size styling
  const sizeClasses = {
    sm: "h-7 px-2.5 text-[11px] gap-1",
    md: "h-8 px-3.5 text-xs gap-1.5",
    lg: "h-10 px-5 text-sm gap-2",
  }[size] || "h-8 px-3.5 text-xs gap-1.5";

  // Shape styling
  const shapeClasses = {
    pill: "rounded-full",
    rectangle: "rounded-md",
    circle: "rounded-full aspect-square p-0 justify-center",
    square: "rounded-md aspect-square p-0 justify-center",
  }[shape] || (shape === "pill" ? "rounded-full" : "rounded-md");

  // Variant styling according to nothing-design
  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses = "bg-primary text-primary-foreground font-bold border-transparent shadow-2xs hover:opacity-90";
      break;
    case "secondary":
      variantClasses = "bg-surface border border-border-visible text-foreground hover:bg-surface-raised shadow-2xs";
      break;
    case "dashed":
      variantClasses = "bg-transparent border border-dashed border-border-visible text-foreground hover:border-foreground";
      break;
    case "ghost":
      variantClasses = "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-raised";
      break;
    case "danger":
      variantClasses = "bg-transparent border border-[#D71921] text-[#D71921] hover:bg-[#D71921]/10 font-bold";
      break;
    case "link":
      variantClasses = "bg-transparent border-transparent text-foreground underline underline-offset-4 p-0 h-auto font-medium";
      break;
    default:
      variantClasses = "bg-primary text-primary-foreground font-bold";
  }

  const customStyle = computeShapeStyle(props);

  if (props.textColor) {
    customStyle.color = hexToRgba(String(props.textColor), Number(props.textOpacity ?? 100));
  }
  if (props.fontSize) {
    customStyle.fontSize = `${props.fontSize}px`;
  }
  if (props.fontWeight) {
    customStyle.fontWeight = Number(props.fontWeight);
  }
  if (props.fontFamily) {
    customStyle.fontFamily = String(props.fontFamily);
  }
  if (props.letterSpacing !== undefined) {
    customStyle.letterSpacing =
      typeof props.letterSpacing === "number" ? `${props.letterSpacing}px` : String(props.letterSpacing);
  }
  if (props.lineHeight) {
    customStyle.lineHeight = `${props.lineHeight}px`;
  }
  if (props.italic) {
    customStyle.fontStyle = "italic";
  }
  if (props.underline || props.strikethrough) {
    customStyle.textDecoration =
      props.underline && props.strikethrough
        ? "underline line-through"
        : props.underline
        ? "underline"
        : "line-through";
  }

  // Icon mapping
  const renderIcon = () => {
    if (loading) return <Loader2 className="size-3.5 shrink-0 animate-spin" />;
    switch (icon) {
      case "Plus": return <Plus className="size-3.5 shrink-0" />;
      case "Download": return <Download className="size-3.5 shrink-0" />;
      case "Trash2": return <Trash2 className="size-3.5 shrink-0" />;
      case "Search": return <Search className="size-3.5 shrink-0" />;
      case "Settings": return <Settings className="size-3.5 shrink-0" />;
      case "Upload": return <Upload className="size-3.5 shrink-0" />;
      case "RefreshCw": return <RefreshCw className="size-3.5 shrink-0" />;
      case "Filter": return <Filter className="size-3.5 shrink-0" />;
      case "Check": return <Check className="size-3.5 shrink-0" />;
      case "ExternalLink": return <ExternalLink className="size-3.5 shrink-0" />;
      case "Edit": return <Edit className="size-3.5 shrink-0" />;
      case "none":
      default:
        return null;
    }
  };

  const isIconOnly = shape === "circle" || shape === "square";
  const isGroupChild = props.isGroupChild === true || props.isGroupChild === "true";

  return (
    <button
      type="button"
      disabled={disabled}
      style={customStyle}
      className={cn(
        "items-center justify-center font-mono uppercase tracking-wider transition-all select-none border whitespace-nowrap overflow-hidden",
        isGroupChild ? "inline-flex h-full" : "flex size-full",
        shapeClasses,
        variantClasses,
        sizeClasses.split(" ").filter((c) => !c.startsWith("h-")).join(" "),
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
      )}
    >
      {renderIcon()}
      {!isEditing && !isIconOnly && <span className="whitespace-nowrap truncate">{loading ? "处理中..." : text}</span>}
    </button>
  );
}

export function WebInputPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "企业名称"));
  const placeholder = String(val(props, "placeholder", "请输入企业全称..."));
  const required = props.required !== false && props.required !== "false";
  const prefixText = String(val(props, "prefixText", ""));
  const suffixText = String(val(props, "suffixText", ""));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && (
        <div className="flex items-center gap-1 text-xs font-medium text-foreground shrink-0 leading-none py-0.5">
          {required && <span className="font-mono text-[#D71921]">*</span>}
          <span className="truncate">{label}</span>
        </div>
      )}
      <div
        className={cn(
          "flex w-full items-center px-3 text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        {prefixText && <span className="mr-2 font-mono text-muted-foreground shrink-0">{prefixText}</span>}
        <span className="flex-1 truncate text-muted-foreground/70">{placeholder}</span>
        {suffixText && <span className="ml-2 font-mono text-muted-foreground shrink-0">{suffixText}</span>}
      </div>
    </div>
  );
}

export function WebInputNumberPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "购买配额"));
  const value = val(props, "value", 5);
  const unit = String(val(props, "unit", "台"));
  const controlsPosition = String(val(props, "controlsPosition", "right-vertical"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center overflow-hidden shadow-2xs min-h-0 relative",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        {controlsPosition === "both-sides" ? (
          <>
            <button type="button" className="flex size-full max-w-9 items-center justify-center border-r border-border-visible bg-surface font-mono text-sm text-foreground hover:bg-surface-raised shrink-0">
              -
            </button>
            <div className="flex flex-1 items-center justify-center gap-1 font-mono text-xs font-bold text-foreground px-2">
              <span>{String(value)}</span>
              {unit && <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>}
            </div>
            <button type="button" className="flex size-full max-w-9 items-center justify-center border-l border-border-visible bg-surface font-mono text-sm text-foreground hover:bg-surface-raised shrink-0">
              +
            </button>
          </>
        ) : controlsPosition === "right-vertical" ? (
          <>
            <div className="flex flex-1 items-center justify-start gap-1 font-mono text-xs font-bold text-foreground px-3">
              <span>{String(value)}</span>
              {unit && <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>}
            </div>
            <div className="flex h-full w-7 flex-col border-l border-border-visible bg-surface shrink-0">
              <button
                type="button"
                className="flex flex-1 items-center justify-center border-b border-border-visible/80 text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                title="增加"
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                title="减少"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-start gap-1 font-mono text-xs font-bold text-foreground px-3">
            <span>{String(value)}</span>
            {unit && <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function WebTextareaPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "需求背景描述"));
  const placeholder = String(val(props, "placeholder", "请输入详细描述信息..."));
  const maxLength = Number(val(props, "maxLength", 200));
  const currentLength = Number(val(props, "currentLength", 32));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className="relative flex flex-1 min-h-0 flex-col p-2.5 text-xs shadow-2xs"
        style={boxStyle}
      >
        <span className="text-muted-foreground/70 truncate">{placeholder}</span>
        <span className="absolute bottom-2 right-2.5 font-mono text-[10px] text-muted-foreground">
          {currentLength} / {maxLength}
        </span>
      </div>
    </div>
  );
}

export function WebSelectPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "所属部门"));
  const selected = String(val(props, "selected", "用户体验设计部 (UED)"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <span className="truncate font-medium">{selected}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
      </div>
    </div>
  );
}

export function WebCascaderPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "所属区域"));
  const value = String(val(props, "value", "广东省 / 深圳市 / 南山区"));
  const isOpen = props.isOpen !== false && props.isOpen !== "false";
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground mb-1 shrink-0 leading-none truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 text-xs text-foreground shadow-2xs min-h-0",
          isOpen ? "h-9 shrink-0" : label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <span className="truncate font-medium">{value}</span>
        <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
      </div>

      {isOpen && (
        <div className="mt-1.5 flex flex-1 min-h-0 overflow-hidden rounded-md border border-border-visible bg-surface shadow-md">
          {/* Level 1 */}
          <div className="flex-1 border-r border-border-visible p-1 space-y-0.5 font-sans text-xs overflow-y-auto">
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">北京市</div>
            <div className="flex items-center justify-between rounded-xs bg-surface-raised px-2 py-1 font-bold text-foreground">
              <span className="truncate">广东省</span>
              <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            </div>
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">上海市</div>
          </div>
          {/* Level 2 */}
          <div className="flex-1 border-r border-border-visible p-1 space-y-0.5 font-sans text-xs overflow-y-auto">
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">广州市</div>
            <div className="flex items-center justify-between rounded-xs bg-surface-raised px-2 py-1 font-bold text-foreground">
              <span className="truncate">深圳市</span>
              <ChevronRight className="size-3 text-muted-foreground shrink-0" />
            </div>
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">珠海市</div>
          </div>
          {/* Level 3 */}
          <div className="flex-1 p-1 space-y-0.5 font-sans text-xs overflow-y-auto">
            <div className="flex items-center justify-between rounded-xs bg-foreground text-background px-2 py-1 font-bold">
              <span className="truncate">南山区</span>
              <Check className="size-3 shrink-0" />
            </div>
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">福田区</div>
            <div className="rounded-xs px-2 py-1 text-muted-foreground truncate">宝安区</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WebDateRangePickerPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "统计周期"));
  const startDate = String(val(props, "startDate", "2026-08-01"));
  const endDate = String(val(props, "endDate", "2026-08-31"));
  const quickTag = String(val(props, "quickTag", "近30天"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 font-mono text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{startDate}</span>
          <span className="text-muted-foreground">~</span>
          <span className="truncate">{endDate}</span>
        </div>
        {quickTag && (
          <span className="rounded-xs bg-surface-raised border border-border-visible px-1.5 py-0.5 text-[10px] font-sans text-foreground shrink-0">
            {quickTag}
          </span>
        )}
      </div>
    </div>
  );
}

export function WebTransferPreview({ props = {} }: { props?: Props }) {
  const sourceTitle = String(val(props, "sourceTitle", "可选字段 (4)"));
  const targetTitle = String(val(props, "targetTitle", "已选导出字段 (2)"));
  const sourceItems = parseItems(val(props, "sourceItems", "用户 ID,电子邮箱,注册时间,最后登录"), ["用户 ID", "电子邮箱", "注册时间", "最后登录"]);
  const targetItems = parseItems(val(props, "targetItems", "真实姓名,手机号码"), ["真实姓名", "手机号码"]);
  const boxStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center gap-2 font-sans select-none">
      {/* Source Box */}
      <div className="flex flex-1 h-full flex-col overflow-hidden" style={boxStyle}>
        <div className="flex h-8 items-center border-b border-border-visible bg-surface-raised px-2.5 font-mono text-xs font-bold text-foreground">
          {sourceTitle}
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
          {sourceItems.map((it) => (
            <div key={it} className="flex items-center gap-2 rounded-xs px-2 py-1 hover:bg-surface-raised text-foreground">
              <CheckSquare className="size-3 text-muted-foreground" />
              <span>{it}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1.5">
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-background text-foreground hover:bg-surface-raised cursor-default">
          &gt;
        </div>
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-background text-foreground hover:bg-surface-raised cursor-default">
          &lt;
        </div>
      </div>

      {/* Target Box */}
      <div className="flex flex-1 h-full flex-col overflow-hidden" style={boxStyle}>
        <div className="flex h-8 items-center border-b border-border-visible bg-surface-raised px-2.5 font-mono text-xs font-bold text-foreground">
          {targetTitle}
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
          {targetItems.map((it) => (
            <div key={it} className="flex items-center gap-2 rounded-xs bg-surface-raised/60 px-2 py-1 text-foreground font-medium">
              <CheckSquare className="size-3 text-foreground" />
              <span>{it}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WebUploadPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "点击或将文件拖拽至此区域上传"));
  const hint = String(val(props, "hint", "支持 PNG、JPG、PDF 或 ZIP 归档文件，单文件不超过 50MB"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center border-dashed p-4 text-center select-none font-sans" style={boxStyle}>
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-raised border border-border-visible mb-2 text-foreground">
        <UploadCloud className="size-5" />
      </div>
      <div className="text-xs font-semibold text-foreground">{title}</div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}

// =========================================================================
// 3. Web 数据展示组件 (Web Data Display)
// =========================================================================

export function WebTablePreview({ props = {}, context }: { props?: Props; context?: ComponentRenderContext }) {
  const rawCols = val(props, "columns", "应用名称,版本号,所属集群,运行状态,最后更新,操作");
  const cols = parseItems(rawCols, ["应用名称", "版本号", "所属集群", "运行状态", "最后更新", "操作"]);
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tableStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  useEffect(() => {
    if (editingCol !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCol]);

  const commitColEdit = () => {
    if (editingCol === null) return;
    const nextCols = [...cols];
    nextCols[editingCol] = editVal;
    context?.onUpdateProps?.({ columns: nextCols.join(",") });
    setEditingCol(null);
  };

  useEffect(() => {
    if (!context?.isSelected && editingCol !== null) {
      commitColEdit();
    }
  }, [context?.isSelected]);

  const sampleRows = [
    { name: "auth-gateway-srv", ver: "v2.1.4", cluster: "华南-集群01", status: "运行中", statusType: "success", time: "2026-08-30 14:20" },
    { name: "payment-core-api", ver: "v1.8.0", cluster: "华东-集群02", status: "运行中", statusType: "success", time: "2026-08-30 13:45" },
    { name: "data-sync-worker", ver: "v3.0.0-rc", cluster: "华北-集群01", status: "排队中", statusType: "warning", time: "2026-08-30 12:10" },
    { name: "report-export-job", ver: "v1.2.9", cluster: "华南-集群03", status: "已停止", statusType: "danger", time: "2026-08-29 22:30" },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden font-sans select-none shadow-2xs" style={tableStyle}>
      {/* Table Header */}
      <div className="flex h-9 items-center border-b border-border-visible bg-surface-raised/60 px-3 text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
        <div className="w-8">
          <CheckSquare className="size-3.5 text-muted-foreground" />
        </div>
        {cols.map((col, idx) => (
          <div
            key={idx}
            className={cn(
              "relative flex items-center gap-1 min-w-0 transition-colors",
              idx === 0 ? "flex-2" : idx === cols.length - 1 ? "w-24 justify-end" : "flex-1",
              editingCol !== idx && "hover:text-foreground cursor-pointer"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (context?.elementId && context?.onSelect) context.onSelect(context.elementId);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingCol(idx);
              setEditVal(col);
            }}
          >
            {editingCol === idx ? (
              <input
                ref={inputRef}
                type="text"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onBlur={commitColEdit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    commitColEdit();
                  } else if (e.key === "Escape") {
                    setEditingCol(null);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="h-6 w-full rounded-2xs border border-foreground bg-background px-1 font-sans text-xs text-foreground outline-none ring-1 ring-border-visible"
              />
            ) : (
              <>
                <span className="truncate">{col}</span>
                {col !== "操作" && <span className="font-mono text-[9px] text-muted-foreground">▲▼</span>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-visible/60">
        {sampleRows.map((row, idx) => (
          <div
            key={`${row.name}-${idx}`}
            className="flex h-10 items-center px-3 text-xs text-foreground hover:bg-surface-raised/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (context?.elementId && context?.onSelect) context.onSelect(context.elementId);
            }}
          >
            <div className="w-8">
              <CheckSquare className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex-2 font-mono font-semibold truncate text-foreground">{row.name}</div>
            <div className="flex-1 font-mono text-muted-foreground">{row.ver}</div>
            <div className="flex-1 truncate text-muted-foreground">{row.cluster}</div>
            <div className="flex-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-xs px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                  row.statusType === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  row.statusType === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                  row.statusType === "danger" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                )}
              >
                {row.status}
              </span>
            </div>
            <div className="flex-1 font-mono text-[11px] text-muted-foreground">{row.time}</div>
            <div className="w-24 flex items-center justify-end gap-2 font-medium">
              <span className="text-foreground hover:underline cursor-default">编辑</span>
              <span className="text-[#D71921] hover:underline cursor-default">删除</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WebDescriptionsPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "服务实例基本详情"));
  const rawItems = val(props, "items", "实例编号:实例-982143;运行环境:华南生产集群;网络地址:119.29.29.29;创建时间:2026-08-30;计费模式:按量计费;到期状态:正常运行");
  const cols = Number(val(props, "cols", 3));
  const descStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  const items = String(rawItems)
    .split(String(rawItems).includes("\n") ? "\n" : ";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return { label: pair, value: "--" };
      return {
        label: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1).trim(),
      };
    });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden font-sans select-none" style={descStyle}>
      <div className="flex h-8.5 items-center border-b border-border-visible bg-surface-raised px-3.5 font-mono text-xs font-bold text-foreground">
        {title}
      </div>
      <div
        className="grid flex-1 divide-x divide-y divide-border-visible text-xs overflow-y-auto"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0, 1fr))` }}
      >
        {items.map((it, idx) => (
          <div key={`${it.label}-${idx}`} className="flex flex-col p-2.5">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">{it.label}</span>
            <span className="mt-1 font-medium text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WebStatisticCardPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "今日活跃用户数"));
  const value = String(val(props, "value", "148,290"));
  const delta = String(val(props, "delta", "+18.4%"));
  const isPositive = props.isPositive !== false && props.isPositive !== "false";
  const subText = String(val(props, "subText", "较昨日同期"));
  const cardStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col justify-between p-4 font-sans select-none shadow-2xs" style={cardStyle}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <TrendingUp className="size-4 text-muted-foreground" />
      </div>

      <div className="my-1 font-mono text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className={cn("font-bold", isPositive ? "text-emerald-500" : "text-rose-500")}>
          {delta} {isPositive ? "▲" : "▼"}
        </span>
        <span className="text-[11px] text-muted-foreground">{subText}</span>
      </div>
    </div>
  );
}

// =========================================================================
// 4. Web 反馈与模版组件 (Web Feedback & Blocks)
// =========================================================================

export function WebModalPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "新建集群节点配置"));
  const content = String(val(props, "content", "请确认节点分配的 CPU 与内存资源，配置提交后将触发自动化部署流水线。"));
  const confirmText = String(val(props, "confirmText", "立即创建"));
  const cancelText = String(val(props, "cancelText", "取消"));
  const modalStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 12 });

  return (
    <div className="flex h-full w-full flex-col shadow-2xl font-sans select-none overflow-hidden" style={modalStyle}>
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-5">
        <span className="text-sm font-bold text-foreground">{title}</span>
        <button type="button" className="flex size-6 items-center justify-center rounded-xs text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 text-xs text-muted-foreground leading-relaxed">
        <p>{content}</p>
      </div>

      {/* Footer */}
      <div className="flex h-14 items-center justify-end gap-2.5 border-t border-border bg-surface-raised/40 px-5">
        <button type="button" className="rounded-full border border-border-visible bg-transparent px-4 py-1.5 font-mono text-xs uppercase text-foreground hover:bg-surface-raised">
          {cancelText}
        </button>
        <button type="button" className="rounded-full bg-foreground px-5 py-1.5 font-mono text-xs uppercase font-bold text-background hover:opacity-90">
          {confirmText}
        </button>
      </div>
    </div>
  );
}

export function WebFilterBarPreview({ props = {} }: { props?: Props }) {
  const keyword = String(val(props, "keyword", "搜索关键词..."));
  const dept = String(val(props, "dept", "全部部门"));
  const dateRange = String(val(props, "dateRange", "2026-08-01 ~ 2026-08-31"));
  const barStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center justify-between px-4 font-sans select-none gap-3" style={barStyle}>
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-8.5 w-52 items-center gap-2 rounded-md border border-border-visible bg-background px-2.5 text-xs">
          <Search className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground truncate">{keyword}</span>
        </div>
        <div className="flex h-8.5 w-36 items-center justify-between rounded-md border border-border-visible bg-background px-2.5 text-xs">
          <span className="text-foreground truncate">{dept}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1" />
        </div>
        <div className="flex h-8.5 w-60 items-center gap-2 rounded-md border border-border-visible bg-background px-2.5 font-mono text-xs">
          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{dateRange}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="flex h-8.5 items-center gap-1 rounded-md bg-foreground px-3.5 text-xs font-bold text-background">
          <Search className="size-3" />
          <span>查询</span>
        </button>
        <button type="button" className="flex h-8.5 items-center gap-1 rounded-md border border-border-visible bg-background px-3 text-xs text-foreground">
          <RefreshCw className="size-3" />
          <span>重置</span>
        </button>
      </div>
    </div>
  );
}

export function WebAdminLayoutPreview({ props = {} }: { props?: Props }) {
  const systemTitle = String(val(props, "systemTitle", "后台管理控制中心"));

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border-visible bg-background overflow-hidden font-sans select-none shadow-lg">
      {/* Top Navbar */}
      <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-xs bg-foreground" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">{systemTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-surface-raised border border-border-visible" />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Menu */}
        <div className="w-48 border-r border-border bg-surface p-2 space-y-1 font-mono text-xs">
          <div className="rounded-md bg-surface-raised px-2.5 py-1.5 font-bold text-foreground border border-border-visible">
            控制台概览
          </div>
          <div className="rounded-md px-2.5 py-1.5 text-muted-foreground">用户与权限</div>
          <div className="rounded-md px-2.5 py-1.5 text-muted-foreground">集群实例</div>
          <div className="rounded-md px-2.5 py-1.5 text-muted-foreground">日志监控</div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-background p-4 flex flex-col gap-3">
          <div className="font-mono text-xs text-muted-foreground">首页 / 运维监控 / 实例列表</div>
          <div className="flex-1 rounded-lg border-2 border-dashed border-border-visible bg-surface/40 flex items-center justify-center font-mono text-xs text-muted-foreground">
            [ MAIN VIEWPORT CONTAINER ]
          </div>
        </div>
      </div>
    </div>
  );
}

export function WebDrawerPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "查看实例运行详情"));
  const confirmText = String(val(props, "confirmText", "保存修改"));
  const cancelText = String(val(props, "cancelText", "关闭"));
  const drawerStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 0 });

  return (
    <div className="flex h-full w-full flex-col shadow-2xl font-sans select-none overflow-hidden" style={drawerStyle}>
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        <div className="rounded-md border border-border-visible bg-background p-3 space-y-1">
          <div className="font-mono text-[10px] text-muted-foreground">INSTANCE STATUS</div>
          <div className="font-bold text-emerald-500">HEALTHY / NORMAL</div>
        </div>
        <div className="space-y-2">
          <div className="text-muted-foreground">规格配置: 8C 32G · 500GB SSD</div>
          <div className="text-muted-foreground">所属子网: subnet-98312-ap-guangzhou</div>
        </div>
      </div>
      <div className="flex h-12 items-center justify-end gap-2 border-t border-border bg-surface-raised/40 px-4">
        <button type="button" className="rounded-full border border-border-visible px-3 py-1 font-mono text-xs uppercase text-foreground">
          {cancelText}
        </button>
        <button type="button" className="rounded-full bg-foreground px-4 py-1 font-mono text-xs uppercase font-bold text-background">
          {confirmText}
        </button>
      </div>
    </div>
  );
}

export function WebAlertPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "系统维护升级通知"));
  const description = String(val(props, "description", "底层网络将于今日 24:00 进行例行维护，请提前做好数据保存。"));
  const tone = String(val(props, "tone", "warning"));
  const defaultFill = tone === "warning" ? "rgba(245, 158, 11, 0.1)" : tone === "error" ? "rgba(244, 63, 94, 0.1)" : tone === "success" ? "rgba(16, 185, 129, 0.1)" : "var(--surface)";
  const defaultStroke = tone === "warning" ? "rgba(245, 158, 11, 0.3)" : tone === "error" ? "rgba(244, 63, 94, 0.3)" : tone === "success" ? "rgba(16, 185, 129, 0.3)" : "var(--border-visible)";
  const alertStyle = computeShapeStyle(props, { fill: defaultFill, stroke: defaultStroke, borderWidth: 1, radius: 6 });

  return (
    <div
      className="flex h-full w-full items-center justify-between px-4 py-2 font-sans select-none gap-3 text-foreground"
      style={alertStyle}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle className={cn("size-4 shrink-0", tone === "warning" ? "text-amber-500" : tone === "error" ? "text-rose-500" : "text-foreground")} />
        <div className="min-w-0">
          <span className="text-xs font-bold mr-2">{title}:</span>
          <span className="text-xs text-muted-foreground truncate">{description}</span>
        </div>
      </div>
      <button type="button" className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function WebPopconfirmPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "确定要永久删除该记录吗？"));
  const confirmText = String(val(props, "confirmText", "确定"));
  const cancelText = String(val(props, "cancelText", "取消"));
  const popStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col justify-between p-3 font-sans select-none shadow-xl" style={popStyle}>
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <HelpCircle className="size-4 text-amber-500 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-2">
        <button type="button" className="rounded-xs border border-border-visible bg-background px-2.5 py-0.5 font-mono text-[10px] text-foreground">
          {cancelText}
        </button>
        <button type="button" className="rounded-xs bg-[#D71921] px-3 py-0.5 font-mono text-[10px] font-bold text-white">
          {confirmText}
        </button>
      </div>
    </div>
  );
}

export function WebNotificationPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "任务执行成功"));
  const message = String(val(props, "message", "您的数据导出任务已完成，点击可直接下载生成的报表文件。"));
  const time = String(val(props, "time", "刚刚"));
  const notifStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col justify-between p-3 font-sans select-none shadow-xl" style={notifStyle}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-foreground">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{time}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed truncate">{message}</p>
    </div>
  );
}

export function WebTipsPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "系统状态提示"));
  const content = String(val(props, "content", "当前节点资源利用率正常，网络链路响应时延 12ms。"));
  const tone = String(val(props, "tone", "info")); // "info" | "success" | "warning" | "error" | "default"
  const placement = String(val(props, "placement", "top")); // "top" | "bottom" | "left" | "right"
  const showArrow = props.showArrow !== false && props.showArrow !== "false";
  const tipsStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="relative flex h-full w-full items-center justify-center p-2 font-sans select-none">
      <div
        className="relative flex flex-col justify-center p-3 text-xs shadow-xl w-full h-full"
        style={tipsStyle}
      >
        {/* Header with tone indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              tone === "warning" && "bg-amber-500 ring-2 ring-amber-500/20",
              tone === "error" && "bg-rose-500 ring-2 ring-rose-500/20",
              tone === "success" && "bg-emerald-500 ring-2 ring-emerald-500/20",
              tone === "info" && "bg-sky-500 ring-2 ring-sky-500/20",
              tone === "default" && "bg-foreground"
            )}
          />
          {title && <span className="font-bold text-foreground text-xs leading-none">{title}</span>}
        </div>

        {/* Content */}
        <div className="text-[11px] text-muted-foreground leading-relaxed truncate">
          {content}
        </div>

        {/* Arrow Pointer */}
        {showArrow && (
          <div
            className={cn(
              "absolute size-2.5 bg-surface rotate-45 pointer-events-none",
              placement === "top" && "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
              placement === "bottom" && "-top-1.5 left-1/2 -translate-x-1/2 border-t border-l",
              placement === "left" && "-right-1.5 top-1/2 -translate-y-1/2 border-t border-r",
              placement === "right" && "-left-1.5 top-1/2 -translate-y-1/2 border-b border-l",
              tone === "warning" && "border-amber-500/40",
              tone === "error" && "border-rose-500/40",
              tone === "success" && "border-emerald-500/40",
              tone === "info" && "border-sky-500/40",
              tone === "default" && "border-border-visible"
            )}
          />
        )}
      </div>
    </div>
  );
}

export function WebMessagePreview({ props = {} }: { props?: Props }) {
  const content = String(val(props, "content", "操作成功：业务数据已实时同步至集群"));
  const tone = String(val(props, "tone", "success")); // "success" | "warning" | "error" | "info" | "loading"
  const closable = props.closable !== false && props.closable !== "false";
  const msgStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center justify-between px-3 py-2 font-sans select-none shadow-md gap-2.5" style={msgStyle}>
      <div className="flex items-center gap-2 min-w-0">
        {tone === "success" && <Check className="size-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />}
        {tone === "warning" && <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />}
        {tone === "error" && <AlertCircle className="size-3.5 text-[#D71921] shrink-0" />}
        {tone === "info" && <Info className="size-3.5 text-sky-500 shrink-0" />}
        {tone === "loading" && <RefreshCw className="size-3.5 text-muted-foreground animate-spin shrink-0" />}
        <span className="text-xs font-medium text-foreground truncate">{content}</span>
      </div>
      {closable && (
        <button type="button" className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export function WebSkeletonPreview({ props = {} }: { props?: Props }) {
  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible bg-surface p-4 font-sans select-none">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-muted animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-1/3 rounded-xs bg-muted animate-pulse" />
          <div className="h-2 w-1/2 rounded-xs bg-muted/60 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2 mt-3">
        <div className="h-2.5 w-full rounded-xs bg-muted/80 animate-pulse" />
        <div className="h-2.5 w-4/5 rounded-xs bg-muted/60 animate-pulse" />
        <div className="h-2.5 w-2/3 rounded-xs bg-muted/40 animate-pulse" />
      </div>
    </div>
  );
}

export function WebEmptyStatePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "暂无关联业务数据"));
  const description = String(val(props, "description", "当前筛选条件下未检索到任何符合条件的结果"));
  const buttonText = String(val(props, "buttonText", "新建一条记录"));
  const emptyStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center font-sans select-none" style={emptyStyle}>
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-raised border border-border-visible mb-2 text-muted-foreground">
        <PackageOpen className="size-6" />
      </div>
      <div className="text-xs font-bold text-foreground">{title}</div>
      <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">{description}</p>
      {buttonText && (
        <button type="button" className="mt-3 rounded-full bg-foreground px-4 py-1 font-mono text-xs font-bold text-background uppercase">
          {buttonText}
        </button>
      )}
    </div>
  );
}

export function WebTreePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "资源文件目录"));
  const rawNodes = val(props, "nodes", "src 源代码:open,components 界面组件,assets 媒体资源,package.json 配置");
  const nodes = parseItems(rawNodes, ["src 源代码:open", "components 界面组件", "assets 媒体资源", "package.json 配置"]);

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface overflow-hidden font-sans select-none">
      <div className="flex h-8 items-center border-b border-border-visible bg-surface-raised px-3 font-mono text-xs font-bold text-foreground">
        {title}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {nodes.map((nodeStr, idx) => {
          const isOpen = nodeStr.includes(":open");
          const label = nodeStr.replace(":open", "").trim();
          const isFile = label.includes(".");
          return (
            <div key={`${label}-${idx}`} className="flex items-center gap-1.5 px-1 py-0.5 rounded-xs hover:bg-surface-raised transition-colors">
              {isFile ? (
                <span className="size-1.5 ml-3 mr-1 rounded-full bg-foreground" />
              ) : isOpen ? (
                <ChevronDown className="size-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              )}
              <FolderTree className={cn("size-3.5 shrink-0", isFile ? "text-muted-foreground" : "text-foreground")} />
              <span className={cn("truncate", isOpen ? "font-bold text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebCollapsePreview({ props = {} }: { props?: Props }) {
  const rawPanels = val(props, "panels", "通用配置规则:支持自定义配置默认路由与访问策略;网络安全防护:已开启基础防护与白名单拦截:open;日志归档策略:按日切分并保留最近 180 天");
  const panelItems = String(rawPanels)
    .split(String(rawPanels).includes("\n") ? "\n" : ";")
    .map((s) => s.trim())
    .filter(Boolean);
  const collapseStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden font-sans select-none divide-y divide-border-visible" style={collapseStyle}>
      {panelItems.map((p, idx) => {
        const parts = p.split(":");
        const header = parts[0] || `面板 ${idx + 1}`;
        const content = parts[1] || "面板详细内容说明...";
        const isOpen = parts.length > 2 ? parts[2]?.trim() === "open" : (idx === 1 || p.includes(":open"));

        return (
          <div key={`${header}-${idx}`} className={cn(isOpen && "bg-surface-raised/40")}>
            <div className="flex items-center justify-between p-3 text-xs font-bold text-foreground cursor-default">
              <span>{header}</span>
              {isOpen ? <ChevronDown className="size-3.5 text-foreground shrink-0" /> : <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
            </div>
            {isOpen && (
              <div className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WebTagPreview({ props = {} }: { props?: Props }) {
  const rawTags = val(props, "tags", "运行中:success,待处理:warning,执行失败:danger,离线排队:default");
  const tags = parseItems(rawTags, ["运行中:success", "待处理:warning", "执行失败:danger", "离线排队:default"]);

  return (
    <div className="flex h-full w-full items-center gap-2 px-2 font-mono text-xs select-none overflow-x-auto">
      {tags.map((t, idx) => {
        const isSuccess = t.includes(":success");
        const isWarning = t.includes(":warning");
        const isDanger = t.includes(":danger") || t.includes(":error");
        const isInfo = t.includes(":info") || t.includes(":primary");
        const label = t.replace(/:[a-z]+/gi, "").trim();

        return (
          <span
            key={`${label}-${idx}`}
            className={cn(
              "inline-flex items-center rounded-xs border px-2 py-0.5 font-semibold shrink-0 uppercase text-[10px]",
              isSuccess && "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
              isWarning && "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
              isDanger && "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
              isInfo && "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
              !isSuccess && !isWarning && !isDanger && !isInfo && "bg-surface-raised border-border-visible text-muted-foreground"
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

export function WebTimelinePreview({ props = {} }: { props?: Props }) {
  const rawEvents = val(props, "events", "14:32 提交发布单:done,14:35 自动化单元测试通过:done,14:40 灰度发布至50%流量:process,15:00 全量上线:pending");
  const events = parseItems(rawEvents, ["14:32 提交发布单:done", "14:35 自动化单元测试通过:done", "14:40 灰度发布至50%流量:process", "15:00 全量上线:pending"]);

  return (
    <div className="flex h-full w-full flex-col justify-between p-3 font-sans select-none text-xs overflow-y-auto">
      {events.map((ev, idx) => {
        const isDone = ev.includes(":done") || ev.includes(":success");
        const isProcess = ev.includes(":process") || ev.includes(":current");
        const rawText = ev.replace(/:[a-z]+/gi, "").trim();
        const spaceIdx = rawText.indexOf(" ");
        const time = spaceIdx !== -1 ? rawText.slice(0, spaceIdx) : "";
        const title = spaceIdx !== -1 ? rawText.slice(spaceIdx + 1) : rawText;

        return (
          <div key={`${title}-${idx}`} className="flex items-start gap-2.5">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "size-2.5 rounded-full",
                  isDone ? "bg-emerald-500" : isProcess ? "bg-foreground ring-2 ring-foreground/20" : "bg-muted border border-border-visible"
                )}
              />
              {idx < events.length - 1 && <div className="h-6 w-px bg-border-visible my-0.5" />}
            </div>
            <div>
              <div className={cn("font-bold", isDone || isProcess ? "text-foreground" : "text-muted-foreground")}>{title}</div>
              {time && <div className="font-mono text-[10px] text-muted-foreground">{time}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WebBadgePreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "未读通知"));
  const count = String(val(props, "count", "99+"));
  const badgeStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center justify-between px-3 text-xs text-foreground select-none" style={badgeStyle}>
      <span>{label}</span>
      <span className="rounded-full bg-[#D71921] px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
        {count}
      </span>
    </div>
  );
}

export function WebAvatarGroupPreview({ props = {} }: { props?: Props }) {
  const rawInitials = val(props, "initials", "张,李,王,赵");
  const initials = parseItems(rawInitials, ["张", "李", "王", "赵"]);
  const overflowText = String(val(props, "overflowText", "+6"));

  return (
    <div className="flex h-full w-full items-center font-mono text-xs select-none">
      <div className="flex -space-x-2">
        {initials.map((ini, i) => (
          <div key={`${ini}-${i}`} className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-surface-raised font-bold text-foreground shadow-2xs">
            {ini}
          </div>
        ))}
        {overflowText && (
          <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-foreground font-bold text-background shadow-2xs">
            {overflowText}
          </div>
        )}
      </div>
    </div>
  );
}

export function WebCrudTablePreview({ props = {} }: { props?: Props }) {
  const pageTitle = String(val(props, "pageTitle", "服务集群实例列表"));

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border-visible bg-background p-4 gap-3 font-sans select-none shadow-lg">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-bold text-foreground">{pageTitle}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="flex h-8 items-center gap-1 rounded-md bg-foreground px-3 text-xs font-bold text-background">
            <Plus className="size-3.5" />
            <span>新建实例</span>
          </button>
          <button type="button" className="flex h-8 items-center gap-1 rounded-md border border-border-visible bg-surface px-3 text-xs text-foreground">
            <Upload className="size-3" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* Filter Bar Inline */}
      <div className="h-10">
        <WebFilterBarPreview />
      </div>

      {/* Table */}
      <div className="flex-1">
        <WebTablePreview />
      </div>

      {/* Pagination */}
      <div className="h-10">
        <WebPaginationPreview />
      </div>
    </div>
  );
}

export function WebFormLayoutPreview({ props = {} }: { props?: Props }) {
  const formTitle = String(val(props, "formTitle", "新建企业微服务实例"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-border-visible bg-surface p-5 font-sans select-none shadow-md">
      <div className="border-b border-border pb-3">
        <span className="text-sm font-bold text-foreground">{formTitle}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 my-2">
        <WebInputPreview props={{ label: "实例名称", placeholder: "例如：核心订单服务" }} />
        <WebSelectPreview props={{ label: "所属环境", selected: "生产环境集群" }} />
        <WebDateRangePickerPreview props={{ label: "有效周期" }} />
        <WebInputNumberPreview props={{ label: "副本数量", value: 3, unit: "节点" }} />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <button type="button" className="rounded-full border border-border-visible px-4 py-1.5 font-mono text-xs uppercase text-foreground">
          重置
        </button>
        <button type="button" className="rounded-full bg-foreground px-5 py-1.5 font-mono text-xs uppercase font-bold text-background">
          保存并提交
        </button>
      </div>
    </div>
  );
}

export function WebLoginCardPreview({ props = {} }: { props?: Props }) {
  const systemName = String(val(props, "systemName", "用户认证与登录中心"));
  const loginStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 12 });

  return (
    <div className="flex h-full w-full flex-col justify-between p-6 font-sans select-none shadow-xl" style={loginStyle}>
      <div className="text-center">
        <div className="font-mono text-xs font-bold tracking-widest uppercase text-foreground">{systemName}</div>
        <div className="text-xs text-muted-foreground mt-1">请使用企业域账号登录</div>
      </div>

      <div className="space-y-3 my-2">
        <div className="flex h-9 items-center rounded-md border border-border-visible bg-background px-3 text-xs text-muted-foreground">
          <User className="size-3.5 mr-2" />
          <span>邮箱或手机号</span>
        </div>
        <div className="flex h-9 items-center rounded-md border border-border-visible bg-background px-3 text-xs text-muted-foreground">
          <Lock className="size-3.5 mr-2" />
          <span>登录密码</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckSquare className="size-3 text-foreground" />
          <span>记住我</span>
        </div>
        <span className="hover:underline cursor-default">忘记密码?</span>
      </div>

      <button type="button" className="mt-2 h-9 w-full rounded-md bg-foreground font-mono text-xs font-bold uppercase text-background">
        立即登录
      </button>
    </div>
  );
}

export function WebStepsFormPreview({ props = {} }: { props?: Props }) {
  const stepTitle = String(val(props, "stepTitle", "第一步：填写基础参数配置"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-border-visible bg-surface p-5 font-sans select-none shadow-md">
      <div className="h-14 border-b border-border pb-2">
        <WebStepsPreview props={props} />
      </div>

      <div className="text-xs font-bold text-foreground my-1.5">{stepTitle}</div>

      <div className="grid grid-cols-2 gap-4 my-2">
        <WebInputPreview props={{ label: "集群服务标识", placeholder: "例如：微服务核心网关" }} />
        <WebSelectPreview props={{ label: "网络方案", selected: "专有网络高级路由" }} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-xs">
        <button type="button" className="rounded-full border border-border-visible px-4 py-1.5 uppercase text-muted-foreground">
          上一步
        </button>
        <button type="button" className="rounded-full bg-foreground px-5 py-1.5 font-bold uppercase text-background">
          下一步: 配置策略
        </button>
      </div>
    </div>
  );
}

export function WebTreeSelectPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "组织树节点"));
  const value = String(val(props, "value", "技术中台 / 架构组"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <div className="flex items-center gap-2 truncate">
          <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{value}</span>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

export function WebAutoCompletePreview({ props = {} }: { props?: Props }) {
  const value = String(val(props, "value", "云原生"));
  const suggestions = parseItems(val(props, "suggestions", "云原生技术中台,云原生微服务网关,云原生容器集群"), ["云原生技术中台", "云原生微服务网关", "云原生容器集群"]);
  const isOpen = props.isOpen === true || props.isOpen === "true";
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col font-sans select-none overflow-hidden">
      <div
        className={cn("flex w-full items-center px-3 text-xs text-foreground shadow-2xs min-h-0", isOpen ? "h-9 shrink-0" : "h-full")}
        style={boxStyle}
      >
        <Search className="size-3.5 text-muted-foreground mr-2 shrink-0" />
        <span className="font-bold text-foreground truncate">{value}</span>
      </div>
      {isOpen && (
        <div className="mt-1 flex-1 min-h-0 overflow-hidden rounded-md border border-border-visible bg-surface p-1 shadow-md text-xs">
          {suggestions.map((sug) => (
            <div key={sug} className="flex h-7 items-center rounded-xs px-2 hover:bg-surface-raised text-foreground truncate">
              {sug}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WebTagInputPreview({ props = {} }: { props?: Props }) {
  const tags = parseItems(val(props, "tags", "前端框架,组件库,桌面端"), ["前端框架", "组件库", "桌面端"]);
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center gap-1.5 px-2.5 font-sans select-none overflow-hidden" style={boxStyle}>
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-xs bg-surface-raised border border-border-visible px-2 py-0.5 font-mono text-[10px] text-foreground shrink-0">
          <span>{t}</span>
          <X className="size-2.5 text-muted-foreground" />
        </span>
      ))}
      <span className="size-2 animate-pulse bg-foreground/70 shrink-0" />
    </div>
  );
}

export function WebDatePickerPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "截止日期"));
  const value = String(val(props, "value", "2026-09-01"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 font-mono text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <span className="truncate">{value}</span>
        <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

export function WebTimePickerPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "执行时间"));
  const value = String(val(props, "value", "14:30:00"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 font-sans select-none overflow-hidden">
      {label && <span className="text-xs font-medium text-foreground shrink-0 leading-none py-0.5 truncate">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 font-mono text-xs text-foreground shadow-2xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={boxStyle}
      >
        <span className="truncate">{value}</span>
        <Clock className="size-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

export function WebRadioGroupPreview({ props = {} }: { props?: Props }) {
  const options = parseItems(val(props, "options", "开发环境,测试环境,生产环境"), ["开发环境", "测试环境", "生产环境"]);
  const selectedIndex = Number(val(props, "selectedIndex", 0));

  return (
    <div className="flex h-full w-full items-center gap-4 px-2 font-sans text-xs select-none overflow-hidden">
      {options.map((opt, i) => (
        <div key={opt} className="flex items-center gap-1.5 cursor-default shrink-0">
          <div className={cn("flex size-3.5 items-center justify-center rounded-full border shrink-0", i === selectedIndex ? "border-foreground" : "border-muted-foreground")}>
            {i === selectedIndex && <div className="size-1.5 rounded-full bg-foreground" />}
          </div>
          <span className={cn("truncate", i === selectedIndex ? "font-bold text-foreground" : "text-muted-foreground")}>{opt}</span>
        </div>
      ))}
    </div>
  );
}

export function WebCheckboxGroupPreview({ props = {} }: { props?: Props }) {
  const options = parseItems(val(props, "options", "站内消息,企业通讯,邮件通知,短信推送"), ["站内消息", "企业通讯", "邮件通知", "短信推送"]);
  const checkedIndices = parseItems(val(props, "checkedIndices", "0,1"), ["0", "1"]).map(Number);

  return (
    <div className="flex h-full w-full items-center gap-4 px-2 font-sans text-xs select-none overflow-hidden">
      {options.map((opt, i) => {
        const isChecked = checkedIndices.includes(i);
        return (
          <div key={opt} className="flex items-center gap-1.5 cursor-default shrink-0">
            <div className={cn("flex size-3.5 items-center justify-center rounded-xs border shrink-0", isChecked ? "border-foreground bg-foreground text-background" : "border-muted-foreground")}>
              {isChecked && <Check className="size-2.5 stroke-[3]" />}
            </div>
            <span className={cn("truncate", isChecked ? "font-bold text-foreground" : "text-muted-foreground")}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

export function WebSwitchPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "自动容灾热备"));
  const checked = props.checked !== false && props.checked !== "false";

  return (
    <div className="flex h-full w-full items-center justify-between px-2 font-sans select-none overflow-hidden">
      <span className="text-xs font-medium text-foreground truncate">{label}</span>
      <div className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors shrink-0", checked ? "bg-foreground" : "bg-muted")}>
        <div className={cn("size-4 rounded-full bg-background transition-transform", checked && "translate-x-4")} />
      </div>
    </div>
  );
}

export function WebSliderPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "带宽限制 (兆/秒)"));
  const value = Number(val(props, "value", 60));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 px-1 font-sans select-none overflow-hidden">
      {label && (
        <div className="flex items-center justify-between text-xs shrink-0 leading-none">
          <span className="text-muted-foreground truncate">{label}</span>
          <span className="font-mono font-bold text-foreground shrink-0 ml-1">{value}</span>
        </div>
      )}
      <div className="relative flex h-2 w-full items-center rounded-full bg-border-visible shrink-0">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${value}%` }} />
        <div className="absolute size-4 -translate-x-1/2 rounded-full border-2 border-foreground bg-background shadow-xs" style={{ left: `${value}%` }} />
      </div>
    </div>
  );
}

export function WebColorPickerPreview({ props = {} }: { props?: Props }) {
  const label = String(val(props, "label", "主题主色"));
  const color = String(val(props, "color", "#0052D9"));
  const boxStyle = computeShapeStyle(props, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });

  return (
    <div className="flex h-full w-full items-center justify-between px-3 font-mono text-xs select-none" style={boxStyle}>
      <span className="font-sans text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="size-4.5 rounded-xs border border-border-visible" style={{ backgroundColor: color }} />
        <span className="font-bold text-foreground">{color}</span>
      </div>
    </div>
  );
}

export function WebButtonGroupPreview({ props = {} }: { props?: Props }) {
  const buttonsStr = String(val(props, "buttons", "主要操作:primary,次要操作:secondary"));
  const items = buttonsStr.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex h-full w-full items-center gap-2 font-mono select-none">
      {items.map((item, idx) => {
        const [btnText, btnVariant = "secondary"] = item.split(":").map((s) => s.trim());
        return (
          <WebButtonPreview
            key={idx}
            props={{
              text: btnText,
              variant: btnVariant,
              size: "md",
              shape: "rectangle",
              isGroupChild: true,
            }}
          />
        );
      })}
    </div>
  );
}

export function WebCardPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "核心服务集群"));
  const tag = String(val(props, "tag", "精选"));
  const text = String(val(props, "text", "提供高可用、弹性伸缩的微服务实例托管与自动化运维管控体系..."));
  const cardStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col justify-between p-4 font-sans select-none" style={cardStyle}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground truncate">{title}</span>
        {tag && (
          <span className="rounded-full border border-border-visible bg-surface-raised px-2 py-0.5 font-mono text-[9px] font-medium text-foreground">
            {tag}
          </span>
        )}
      </div>
      <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground my-2">
        {text}
      </p>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <span className="font-mono text-[10px] text-muted-foreground">状态：运行正常</span>
        <span className="font-mono text-[10px] font-medium text-foreground underline underline-offset-2 cursor-pointer">
          查看详情 →
        </span>
      </div>
    </div>
  );
}

export function WebChartPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "周访问量分析趋势"));
  const seriesStr = String(val(props, "series", "周一:320,周二:420,周三:580,周四:490,周五:720,周六:860,周日:950"));
  const items = seriesStr.split(",").map((s) => s.trim()).filter(Boolean);
  const chartStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  const parsed = items.map((item) => {
    const [name, valStr] = item.split(":").map((s) => s.trim());
    return { name, value: Number(valStr) || 100 };
  });

  const maxVal = Math.max(...parsed.map((p) => p.value), 1000);

  return (
    <div className="flex h-full w-full flex-col justify-between p-3.5 font-sans select-none" style={chartStyle}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <span className="font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          +18.4% 环比增长
        </span>
      </div>
      <div className="flex flex-1 items-end gap-2 pt-4 pb-1">
        {parsed.map((p, idx) => {
          const heightPercent = Math.max(15, Math.round((p.value / maxVal) * 100));
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
              <span className="font-mono text-[8px] text-muted-foreground">{p.value}</span>
              <div className="w-full rounded-xs bg-surface-raised border border-border-visible overflow-hidden flex flex-col justify-end" style={{ height: "65%" }}>
                <div
                  className="w-full bg-foreground transition-all"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              <span className="font-mono text-[8.5px] text-muted-foreground truncate">{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebKanbanPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "需求迭代看板"));
  const col1 = String(val(props, "col1", "待处理(3)"));
  const col2 = String(val(props, "col2", "开发中(5)"));
  const col3 = String(val(props, "col3", "已上线(8)"));
  const kanbanStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col p-3 font-sans select-none" style={kanbanStyle}>
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <span className="font-mono text-[10px] text-muted-foreground">[ 敏捷看板 ]</span>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
        {[
          { label: col1, task: "用户鉴权流程重构", owner: "张三", tag: "高优" },
          { label: col2, task: "高并发缓存层优化", owner: "李四", tag: "常规" },
          { label: col3, task: "数据导出组件封装", owner: "王五", tag: "已结" },
        ].map((col, idx) => (
          <div key={idx} className="flex flex-col rounded-md border border-border bg-background p-2">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-1.5">
              <span className="font-mono text-[10px] font-bold text-foreground truncate">{col.label}</span>
              <span className="size-1.5 rounded-full bg-foreground" />
            </div>
            <div className="rounded border border-border-visible bg-surface p-2 shadow-2xs space-y-1.5">
              <p className="text-[11px] font-medium text-foreground leading-snug">{col.task}</p>
              <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground pt-1 border-t border-border/60">
                <span>负责：{col.owner}</span>
                <span className="rounded-xs border border-border px-1">{col.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WebCalendarPreview({ props = {} }: { props?: Props }) {
  const month = String(val(props, "month", "2026年08月"));
  const currentDay = Number(val(props, "currentDay", 31));
  const calStyle = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  const days = ["一", "二", "三", "四", "五", "六", "日"];
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex h-full w-full flex-col justify-between p-3.5 font-sans select-none" style={calStyle}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="font-mono text-xs font-bold text-foreground">{month}</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground">[ 8月排期 ]</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted-foreground py-1">
        {days.map((d) => (
          <span key={d} className="font-semibold">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] flex-1">
        {daysInMonth.slice(0, 21).map((d) => {
          const isToday = d === currentDay;
          return (
            <div
              key={d}
              className={cn(
                "flex items-center justify-center rounded-xs transition-colors",
                isToday
                  ? "bg-foreground text-background font-bold"
                  : "text-foreground hover:bg-surface-raised"
              )}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebDashboardPagePreview({ props = {} }: { props?: Props }) {
  const dashboardTitle = String(val(props, "dashboardTitle", "企业级运营监控总览"));

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface p-4 font-sans select-none overflow-hidden space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div>
          <h2 className="text-xs font-bold text-foreground tracking-tight">{dashboardTitle}</h2>
          <span className="font-mono text-[9px] text-muted-foreground">统计周期：实时汇聚中</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="rounded-full border border-border-visible bg-surface-raised px-2.5 py-0.5 font-medium text-foreground">
            导出报表
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "活跃用户总数", val: "148,290", change: "+18.4%", positive: true },
          { label: "集群计算负载", val: "68.5%", change: "-2.1%", positive: true },
          { label: "异常中断告警", val: "0 次", change: "正常", positive: true },
        ].map((m, idx) => (
          <div key={idx} className="rounded-md border border-border bg-background p-2.5">
            <span className="font-mono text-[9.5px] uppercase text-muted-foreground">{m.label}</span>
            <div className="mt-1 flex items-baseline justify-between font-mono">
              <span className="text-sm font-bold text-foreground">{m.val}</span>
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Data Bar Chart */}
      <div className="flex-1 rounded-md border border-border bg-background p-3 flex flex-col justify-between min-h-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold text-foreground">服务响应时延分布</span>
          <span className="font-mono text-[9px] text-muted-foreground">单位：毫秒</span>
        </div>
        <div className="flex items-end gap-2 h-16 pt-2">
          {[28, 42, 35, 60, 48, 75, 52, 85, 64, 90, 72, 95].map((v, i) => (
            <div key={i} className="flex-1 bg-surface-raised border border-border-visible rounded-xs overflow-hidden h-full flex flex-col justify-end">
              <div className="w-full bg-foreground" style={{ height: `${v}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WebSettingsPagePreview({ props = {} }: { props?: Props }) {
  const settingsTitle = String(val(props, "settingsTitle", "个人中心与安全配置"));

  return (
    <div className="flex h-full w-full rounded-lg border border-border-visible bg-surface font-sans select-none overflow-hidden">
      <div className="w-1/3 border-r border-border p-3 space-y-1 bg-background">
        <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground px-2">设置目录</span>
        {["个人资料", "账号安全", "团队成员", "消息通知", "审计日志"].map((tab, idx) => (
          <div
            key={tab}
            className={cn(
              "rounded-xs px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              idx === 0 ? "bg-surface text-foreground font-bold border border-border-visible" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <div className="border-b border-border pb-2">
          <h3 className="text-xs font-bold text-foreground">{settingsTitle}</h3>
          <span className="text-[10px] text-muted-foreground">维护您的账户基本资料与访问权限</span>
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          <div>
            <span className="text-muted-foreground block text-[10px] mb-1">用户姓名</span>
            <div className="rounded border border-border-visible bg-background px-2.5 py-1 text-foreground">系统管理员</div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] mb-1">联系邮箱</span>
            <div className="rounded border border-border-visible bg-background px-2.5 py-1 text-foreground">admin@system.local</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <span className="rounded-full border border-border-visible px-3 py-1 font-mono text-[10px] text-muted-foreground">取消</span>
          <span className="rounded-full bg-foreground text-background px-3 py-1 font-mono text-[10px] font-semibold">保存更改</span>
        </div>
      </div>
    </div>
  );
}

export function WebPricingTablePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "服务版本规格与价格方案"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible bg-surface p-4 font-sans select-none">
      <div className="text-center border-b border-border pb-2 mb-2">
        <h2 className="text-xs font-bold text-foreground">{title}</h2>
        <span className="font-mono text-[9px] text-muted-foreground">根据业务规模按需选择最合适方案</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0">
        {[
          { name: "基础版", price: "免费", desc: "适合个人与轻量测试", btn: "立即体验", primary: false },
          { name: "专业版", price: "¥ 199/月", desc: "适合快速成长团队", btn: "选购方案", primary: true },
          { name: "企业版", price: "定制方案", desc: "专属私有化集群部署", btn: "联系顾问", primary: false },
        ].map((plan, idx) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col justify-between rounded-md border p-3 bg-background",
              plan.primary ? "border-foreground ring-1 ring-foreground" : "border-border"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-foreground">{plan.name}</span>
                {plan.primary && <span className="rounded-xs bg-foreground text-background px-1 text-[8px] font-mono">推荐</span>}
              </div>
              <div className="font-mono text-sm font-bold text-foreground my-1.5">{plan.price}</div>
              <p className="text-[9.5px] text-muted-foreground">{plan.desc}</p>
            </div>
            <button
              type="button"
              className={cn(
                "w-full rounded-full py-1 font-mono text-[10px] font-medium tracking-wider transition-colors mt-2",
                plan.primary ? "bg-foreground text-background font-semibold" : "border border-border-visible text-foreground"
              )}
            >
              {plan.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WebFaqSectionPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "常见问题与技术支持解答"));

  const faqs = [
    { q: "支持哪些私有化部署架构？", a: "支持容器化云原生部署、物理服务器集群及私有云环境。" },
    { q: "数据如何保证高可靠与灾备？", a: "内置多副本实时数据同步与自动化快照备份恢复能力。" },
    { q: "是否支持多角色权限控制？", a: "全面支持 RBAC 细粒度权限控制与团队组织架构协同。" },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible bg-surface p-4 font-sans select-none space-y-2.5">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <span className="font-mono text-[9px] text-muted-foreground">[ 帮助指南 ]</span>
      </div>
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-md border border-border bg-background p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">{faq.q}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top-level dispatcher for Web Components
export function renderWebLibraryComponent(
  type: ComponentType,
  props: Props,
  children?: React.ReactNode,
  context?: ComponentRenderContext,
) {
  switch (type) {
    case "web-dropdown": return <WebDropdownPreview props={props} />;
    case "web-top-nav": return <WebTopNavPreview props={props} />;
    case "web-menu": return <WebMenuPreview props={props} />;
    case "web-tabs": return <WebTabsPreview props={props} />;
    case "web-breadcrumb": return <WebBreadcrumbPreview props={props} />;
    case "web-pagination": return <WebPaginationPreview props={props} />;
    case "web-steps": return <WebStepsPreview props={props} />;
    case "web-button": return <WebButtonPreview props={props} isEditing={context?.isEditing} />;
    case "web-button-group": return <WebButtonGroupPreview props={props} />;
    case "web-input": return <WebInputPreview props={props} />;
    case "web-input-number": return <WebInputNumberPreview props={props} />;
    case "web-textarea": return <WebTextareaPreview props={props} />;
    case "web-select": return <WebSelectPreview props={props} />;
    case "web-cascader": return <WebCascaderPreview props={props} />;
    case "web-tree-select": return <WebTreeSelectPreview props={props} />;
    case "web-auto-complete": return <WebAutoCompletePreview props={props} />;
    case "web-tag-input": return <WebTagInputPreview props={props} />;
    case "web-date-picker": return <WebDatePickerPreview props={props} />;
    case "web-date-range-picker": return <WebDateRangePickerPreview props={props} />;
    case "web-time-picker": return <WebTimePickerPreview props={props} />;
    case "web-radio-group": return <WebRadioGroupPreview props={props} />;
    case "web-checkbox-group": return <WebCheckboxGroupPreview props={props} />;
    case "web-switch": return <WebSwitchPreview props={props} />;
    case "web-slider": return <WebSliderPreview props={props} />;
    case "web-transfer": return <WebTransferPreview props={props} />;
    case "web-upload": return <WebUploadPreview props={props} />;
    case "web-color-picker": return <WebColorPickerPreview props={props} />;
    case "web-table": return <WebTablePreview props={props} context={context} />;
    case "web-descriptions": return <WebDescriptionsPreview props={props} />;
    case "web-tree": return <WebTreePreview props={props} />;
    case "web-collapse": return <WebCollapsePreview props={props} />;
    case "web-statistic-card": return <WebStatisticCardPreview props={props} />;
    case "web-tag": return <WebTagPreview props={props} />;
    case "web-timeline": return <WebTimelinePreview props={props} />;
    case "web-badge": return <WebBadgePreview props={props} />;
    case "web-avatar-group": return <WebAvatarGroupPreview props={props} />;
    case "web-card": return <WebCardPreview props={props} />;
    case "web-chart": return <WebChartPreview props={props} />;
    case "web-kanban": return <WebKanbanPreview props={props} />;
    case "web-calendar": return <WebCalendarPreview props={props} />;
    case "web-modal": return <WebModalPreview props={props} />;
    case "web-drawer": return <WebDrawerPreview props={props} />;
    case "web-alert": return <WebAlertPreview props={props} />;
    case "web-popconfirm": return <WebPopconfirmPreview props={props} />;
    case "web-notification": return <WebNotificationPreview props={props} />;
    case "web-tips": return <WebTipsPreview props={props} />;
    case "web-message": return <WebMessagePreview props={props} />;
    case "web-skeleton": return <WebSkeletonPreview props={props} />;
    case "web-empty-state": return <WebEmptyStatePreview props={props} />;
    case "web-admin-layout": return <WebAdminLayoutPreview props={props} />;
    case "web-filter-bar": return <WebFilterBarPreview props={props} />;
    case "web-crud-table": return <WebCrudTablePreview props={props} />;
    case "web-form-layout": return <WebFormLayoutPreview props={props} />;
    case "web-login-card": return <WebLoginCardPreview props={props} />;
    case "web-steps-form": return <WebStepsFormPreview props={props} />;
    case "web-dashboard-page": return <WebDashboardPagePreview props={props} />;
    case "web-settings-page": return <WebSettingsPagePreview props={props} />;
    case "web-pricing-table": return <WebPricingTablePreview props={props} />;
    case "web-faq-section": return <WebFaqSectionPreview props={props} />;
    default:
      return null;
  }
}


