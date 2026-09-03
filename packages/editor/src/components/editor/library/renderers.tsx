import { useState, useRef, useEffect } from "react";
import type { ComponentType, EditorElement } from "../types";
import { cn } from "@bluepen/editor/lib/utils";
import { renderWebLibraryComponent } from "./web-renderers";
import { renderAgentLibraryComponent } from "./agent-renderers";
import { FileListPreview } from "./file-list-renderer";

export interface ComponentRenderContext {
  elementId?: string;
  zoom?: number;
  onSelect?: (id: string | null) => void;
  onUpdateProps?: (patch: Record<string, string | number | boolean>) => void;
  onUpdateElement?: (id: string, patch: Partial<EditorElement>) => void;
  previewing?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
}
import {
  SkeletonText,
  SkeletonImage,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonIcon,
  SkeletonInput,
  SkeletonLine,
  SkeletonChip,
  SkeletonBars,
} from "../canvas/elements/placeholder";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Check,
  Mail,
  Lock,
  Users,
  Home,
  Settings,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ImageIcon,
  Package,
  CircleDollarSign,
  ShoppingBag,
  Megaphone,
  Globe,
  MoreHorizontal,
  Star,
  Play,
  Upload,
  CalendarDays,
  Camera,
  MapPin,
  Phone,
  Quote as QuoteIcon,
  Send,
  MessageCircle,
  ChevronsRight,
  ChevronsUpDown,
  AlignLeft,
  Tag,
  Link as LinkIcon,
  PackageOpen,
  FileText,
  Zap,
  Shield,
  Palette,
  User,
  Trash,
  Smartphone,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  ListOrdered,
  Minus,
  Grid2X2,
  Columns,
  Maximize2,
  GitBranch,
  BookOpen,
  Braces,
  AlertTriangle,
  Gauge,
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

export function renderLibraryComponent(
  type: ComponentType,
  props: Props,
  children?: React.ReactNode,
  context?: ComponentRenderContext,
) {
  if (type.startsWith("web-")) {
    const webRes = renderWebLibraryComponent(type, props, children, context);
    if (webRes) return webRes;
  }

  if (type.startsWith("agent-")) {
    const agentRes = renderAgentLibraryComponent(type, props, children, context);
    if (agentRes) return agentRes;
  }

  switch (type) {
    // Group container
    case "group":
      return <div className="relative size-full overflow-visible pointer-events-none">{children}</div>;

    // Basic Wireframe
    case "text": return <TextPreview props={props} isEditing={context?.isEditing} />;
    case "rectangle": return <RectanglePreview props={props} isEditing={context?.isEditing} />;
    case "circle": return <CirclePreview props={props} isEditing={context?.isEditing} />;
    case "line": return <LinePreview props={props} />;
    case "arrow": return <ArrowPreview props={props} />;
    case "image": return <ImagePreview props={props} />;
    case "hotspot": return <HotspotPreview props={props} />;
    case "button": return <ButtonPreview props={props} isEditing={context?.isEditing} />;
    case "button-primary": return <ButtonPrimaryPreview props={props} isEditing={context?.isEditing} />;
    case "placeholder": return <PlaceholderPreview props={props} isEditing={context?.isEditing} />;
    case "table": return <TablePreview props={props} context={context} />;
    case "file-list": return <FileListPreview props={props} context={context} />;
    case "sticky-note": return <StickyNotePreview props={props} />;
    case "pin-note": return <PinNotePreview props={props} />;
    case "scroll-panel": return <ScrollPanelPreview props={props} />;
    case "modal-dialog": return <ModalDialogPreview props={props} />;
    case "mind-map": return <MindMapPreview props={props} />;
    case "document": return <DocumentPreview props={props} />;
    case "code-block": return <CodeBlockPreview props={props} />;
    case "ai-component": return <AiComponentPreview props={props} />;

    // Flowchart & Connectors
    case "connector": return <ConnectorPreview props={props} />;
    case "flow-process":
    case "flow-decision":
    case "flow-start-end":
    case "flow-document":
    case "flow-data":
    case "flow-subprocess":
    case "flow-external-data":
    case "flow-internal-storage":
    case "flow-queue":
    case "flow-database":
    case "flow-manual-input":
    case "flow-card":
    case "flow-tape":
    case "flow-display":
    case "flow-manual-op":
    case "flow-preparation":
    case "flow-loop-limit":
      return <FlowchartShapePreview type={type} props={props} isEditing={context?.isEditing} />;

    // Form
    case "input": return <InputPreview props={props} />;
    case "textarea": return <TextareaPreview props={props} />;
    case "select": return <SelectPreview props={props} />;
    case "file-upload": return <FileUploadPreview props={props} />;
    case "radio": return <RadioPreview props={props} />;
    case "checkbox": return <CheckboxPreview props={props} />;
    case "switch-android": return <SwitchAndroidPreview props={props} />;
    case "switch-ios": return <SwitchIosPreview props={props} />;
    case "switch": return <SwitchIosPreview props={props} />;
    case "slider": return <SliderPreview props={props} />;
    case "stepper": return <StepperPreview props={props} />;
    case "date-picker": return <DatePickerPreview props={props} />;
    case "search": return <SearchPreview props={props} />;

    // Navigation
    case "dropdown-menu": return <DropdownMenuPreview props={props} />;
    case "popup-menu": return <PopupMenuPreview props={props} />;
    case "navbar": return <NavbarPreview props={props} />;
    case "tabs": return <TabsPreview props={props} />;
    case "pagination": return <PaginationPreview props={props} />;
    case "breadcrumb": return <BreadcrumbPreview props={props} />;
    case "stepper-nav": return <StepperNavPreview props={props} />;

    // Containers & Devices
    case "mobile-frame": return <MobileFramePreview props={props}>{children}</MobileFramePreview>;
    case "browser-frame": return <BrowserFramePreview props={props}>{children}</BrowserFramePreview>;
    case "card": return <CardPreview props={props} />;
    case "sidebar": return <SidebarPreview />;
    case "header": return <HeaderPreview />;
    case "footer": return <FooterPreview />;

    // Display & Feedback
    case "badge": return <BadgePreview props={props} />;
    case "chip": return <ChipPreview props={props} />;
    case "avatar": return <AvatarPreview props={props} />;
    case "avatar-group": return <AvatarGroupPreview />;
    case "alert": return <AlertPreview props={props} />;
    case "stat": return <StatPreview props={props} />;
    case "progress": return <ProgressPreview props={props} />;
    case "empty-state": return <EmptyStatePreview props={props} />;
    case "rating": return <RatingPreview props={props} />;
    case "divider": return <DividerPreview props={props} />;
    case "link": return <LinkPreview props={props} />;

    // Templates / Sections
    case "hero": return <HeroPreview />;
    case "features": return <FeaturesPreview />;
    case "testimonials": return <TestimonialsPreview />;
    case "pricing": return <PricingPreview />;
    case "faq": return <FaqPreview />;
    case "stats": return <StatsPreview />;
    case "logos": return <LogosPreview />;
    case "team": return <TeamPreview />;
    case "contact": return <ContactPreview />;
    case "newsletter": return <NewsletterPreview />;
    case "blog-post": return <BlogPostPreview />;
    case "quote": return <QuotePreview />;
    case "cta": return <CtaPreview />;
    case "login": return <LoginPreview />;
    case "register": return <RegisterPreview />;
    case "dashboard": return <DashboardPreview />;
    case "settings-page": return <SettingsPagePreview />;
    case "profile-page": return <ProfilePagePreview />;
    case "list": return <ListPreview />;
    case "grid": return <GridPreview />;
    case "timeline": return <TimelinePreview />;
    case "kanban": return <KanbanPreview />;
    case "calendar": return <CalendarPreview />;
    case "chart": return <ChartPreview />;
    case "modal": return <ModalPreview />;
    case "toast": return <ToastPreview />;
    case "drawer": return <DrawerPreview />;
    case "sheet": return <SheetPreview />;
    case "popover": return <PopoverPreview />;
    case "tooltip": return <TooltipPreview />;
    case "dropdown": return <DropdownPreview />;
    case "command": return <CommandPreview />;
    case "form": return <FormPreview />;
    case "icon-button": return <IconButtonPreview props={props} />;
    case "video": return <VideoPreview />;
    case "spinner": return <SpinnerPreview />;
    default:
      return <SkeletonImage className="h-full w-full rounded-none border-0" />;
  }
}

function Logo({ className = "size-4" }: { className?: string }) {
  return (
    <div className={`relative flex shrink-0 items-center justify-center rounded-[5px] bg-neutral-900 ${className}`}>
      <span className="size-[45%] rounded-[2px] bg-white" />
    </div>
  );
}

/* ---------------- LAYOUT ---------------- */

function NavbarPreview({ props }: { props?: Props }) {
  const p = props || {};
  const logoText = String(val(p, "logoText", "LOGO"));
  const linksStr = val(p, "links", "首页,功能,定价,帮助");
  const links = parseItems(linksStr, ["首页", "功能", "定价", "帮助"]);
  const loginText = String(val(p, "loginText", "登录"));
  const signupText = String(val(p, "signupText", "免费注册"));

  return (
    <div className="flex h-full w-full items-center justify-between border-b border-border bg-surface px-5 font-sans select-none">
      <div className="flex min-w-0 items-center gap-6">
        <div className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="text-[11px] font-bold tracking-tight text-foreground">{logoText}</span>
        </div>
        <div className="flex min-w-0 items-center gap-4">
          {links.map((l) => (
            <span key={l} className="shrink-0 text-[9px] font-medium text-muted-foreground hover:text-foreground cursor-default">{l}</span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {loginText && <SkeletonButton variant="ghost" label={loginText} />}
        {signupText && <SkeletonButton label={signupText} className="px-3.5" />}
      </div>
    </div>
  );
}

function SidebarPreview() {
  const items = [
    { icon: Home, label: "Overview", active: true },
    { icon: LayoutDashboard, label: "Projects" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Users, label: "Team" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-surface font-sans select-none">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <Logo />
        <span className="text-[11px] font-bold tracking-tight text-foreground">Acme Inc</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-2.5">
        {items.map(({ icon, label, active }) => (
          <div key={label} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${active ? "bg-surface-raised border border-border-visible font-bold text-foreground" : "text-muted-foreground"}`}>
            <SkeletonIcon icon={icon} className={active ? "text-foreground" : "text-muted-foreground"} />
            <span className="text-[9px] font-medium truncate">{label}</span>
            {active && <span className="ml-auto size-1.5 rounded-full bg-foreground" />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <SkeletonAvatar initials="JD" size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[9px] font-semibold text-foreground">Jane Doe</div>
          <div className="truncate text-[8px] text-muted-foreground">jane@acme.com</div>
        </div>
        <SkeletonIcon icon={MoreHorizontal} />
      </div>
    </div>
  );
}

function HeaderPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between border-b border-border bg-surface px-5 font-sans select-none">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="text-[9px] text-muted-foreground">Projects</span>
        <SkeletonIcon icon={ChevronRight} className="size-2.5 text-muted-foreground" />
        <span className="truncate text-[11px] font-semibold text-foreground">Annual Report</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-surface-raised">
          <Search aria-hidden="true" className="size-3 text-muted-foreground" />
        </div>
        <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-surface-raised">
          <Bell aria-hidden="true" className="size-3 text-muted-foreground" />
        </div>
        <SkeletonAvatar initials="JD" size="sm" />
      </div>
    </div>
  );
}

function FooterPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-surface border-t border-border font-sans select-none">
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-6 px-10 py-6">
        {[
          { title: "Product", links: ["Features", "Pricing", "Changelog"] },
          { title: "Company", links: ["About", "Blog", "Careers"] },
          { title: "Resources", links: ["Docs", "Guides", "API"] },
          { title: "Legal", links: ["Privacy", "Terms"] },
        ].map((col) => (
          <div key={col.title} className="flex min-w-0 flex-col gap-2">
            <SkeletonText variant="caption" width="40%" className="mb-0.5 bg-neutral-400" />
            {col.links.map((l) => (
              <span key={l} className="truncate text-[8px] text-neutral-500">{l}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border px-10 py-3">
        <span className="text-[8px] text-muted-foreground">© 2026 Acme Inc.</span>
        <div className="flex gap-3">
          <SkeletonIcon icon={Globe} className="size-3" />
          <SkeletonIcon icon={Megaphone} className="size-3" />
          <SkeletonIcon icon={ShoppingBag} className="size-3" />
        </div>
      </div>
    </div>
  );
}

function TabsPreview({ props }: { props?: Props }) {
  const p = props || {};
  const rawTabs = p.tabs ?? (p.tab1 ? `${p.tab1},${p.tab2 || ""},${p.tab3 || ""}` : "全部,待处理,已完成");
  const tabs = parseItems(rawTabs, ["全部", "待处理", "已完成"]);
  const activeIndex = Number(val(p, "activeIndex", 0));

  return (
    <div className="flex h-full w-full items-center justify-center gap-1 rounded-lg border border-border-visible bg-surface-raised p-1.5">
      {tabs.map((t, i) => (
        <div key={`${t}-${i}`} className={`flex h-6 flex-1 items-center justify-center rounded-md transition-all ${i === activeIndex ? "bg-surface border border-border-visible shadow-xs" : ""}`}>
          <span className={`text-[9px] font-medium truncate px-1.5 ${i === activeIndex ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function BreadcrumbPreview({ props }: { props?: Props }) {
  const p = props || {};
  const pathStr = String(val(p, "path", "首页 / 系统管理 / 用户列表"));
  const items = pathStr.includes("/") ? pathStr.split("/").map((s) => s.trim()).filter(Boolean) : parseItems(pathStr, ["首页", "系统管理", "用户列表"]);

  return (
    <div className="flex h-full w-full items-center gap-1.5 px-3">
      {items.map((it, idx) => (
        <div key={`${it}-${idx}`} className="flex items-center gap-1.5">
          <span className={`text-[9px] truncate ${idx === items.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {it}
          </span>
          {idx < items.length - 1 && (
            <ChevronsRight aria-hidden="true" className="size-2.5 text-muted-foreground/60" />
          )}
        </div>
      ))}
    </div>
  );
}

function PaginationPreview({ props }: { props?: Props }) {
  const p = props || {};
  const current = Number(val(p, "current", 1));
  const total = Number(val(p, "total", 10));
  const pagesToShow = total <= 5
    ? Array.from({ length: total }, (_, i) => String(i + 1))
    : current <= 3
    ? ["1", "2", "3", "…", String(total)]
    : current >= total - 2
    ? ["1", "…", String(total - 2), String(total - 1), String(total)]
    : ["1", "…", String(current), "…", String(total)];

  return (
    <div className="flex h-full w-full items-center justify-center gap-1">
      <div className="flex size-6 items-center justify-center rounded-md border border-border-visible bg-surface cursor-default">
        <ChevronsRight aria-hidden="true" className="size-3 rotate-180 text-muted-foreground" />
      </div>
      {pagesToShow.map((n, i) => (
        <div key={`${n}-${i}`} className={`flex size-6 items-center justify-center rounded-md text-[9px] font-medium ${n === String(current) ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>
          {n}
        </div>
      ))}
      <div className="flex size-6 items-center justify-center rounded-md border border-border-visible bg-surface cursor-default">
        <ChevronsRight aria-hidden="true" className="size-3 text-muted-foreground" />
      </div>
    </div>
  );
}

function DividerPreview({ props }: { props?: Props }) {
  const text = props ? String(val(props, "text", "OR")) : "OR";
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 px-4">
      <SkeletonLine className="flex-1" />
      {text && <span className="text-[8px] text-neutral-400">{text}</span>}
      <SkeletonLine className="flex-1" />
    </div>
  );
}

function LinkPreview({ props }: { props?: Props }) {
  const text = props ? String(val(props, "text", "查阅文档与说明")) : "查阅文档与说明";
  return (
    <div className="flex h-full w-full items-center gap-1 px-2">
      <LinkIcon aria-hidden="true" className="size-3 text-neutral-500" />
      <span className="text-[10px] font-medium text-neutral-700 underline underline-offset-2 truncate">{text}</span>
      <ArrowRight aria-hidden="true" className="size-2.5 text-neutral-400" />
    </div>
  );
}

/* ---------------- SECTIONS ---------------- */

function HeroPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background px-10 text-center">
      <div className="flex items-center gap-1.5 rounded-full border border-border-visible bg-surface px-2.5 py-1 shadow-xs">
        <Sparkles aria-hidden="true" className="size-2.5 text-muted-foreground" />
        <span className="text-[8px] font-semibold text-foreground">New: version 2.0</span>
      </div>
      <SkeletonText variant="title" width="55%" className="h-4" />
      <SkeletonText variant="title" width="35%" className="h-4" />
      <SkeletonText variant="body" width="45%" />
      <div className="flex items-center gap-2.5">
        <SkeletonButton label="Get started" className="px-4" />
        <SkeletonButton variant="secondary" label="Learn more" />
      </div>
      <SkeletonImage className="mt-2 h-24 w-[70%] rounded-lg" />
    </div>
  );
}

function FeaturesPreview() {
  const feats = [
    { icon: Zap, title: "Lightning fast", w: "52%" },
    { icon: Shield, title: "Secure by default", w: "48%" },
    { icon: Palette, title: "Beautiful design", w: "56%" },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-surface px-10 py-6 font-sans select-none">
      <SkeletonText variant="title" width="38%" className="h-4" />
      <SkeletonText variant="body" width="52%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {feats.map((f) => (
          <div key={f.title} className="flex flex-col items-center gap-2 rounded-xl border border-border-visible bg-background p-4 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-surface-raised border border-border-visible">
              <f.icon aria-hidden="true" className="size-4 text-foreground" />
            </div>
            <span className="text-[10px] font-semibold text-foreground">{f.title}</span>
            <SkeletonText variant="caption" width="80%" />
            <SkeletonText variant="caption" width="60%" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-background px-10 py-5 font-sans select-none">
      <SkeletonText variant="heading" width="32%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {["AC", "LM", "RS"].map((ini) => (
          <div key={ini} className="flex flex-col gap-2 rounded-xl border border-border-visible bg-surface p-4">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} aria-hidden="true" className="size-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <SkeletonText variant="body" width="94%" />
            <SkeletonText variant="body" width="70%" />
            <div className="mt-auto flex items-center gap-2 pt-2">
              <SkeletonAvatar initials={ini} size="sm" />
              <div className="flex flex-col gap-0.5">
                <SkeletonText variant="caption" width="70%" />
                <SkeletonText variant="caption" width="50%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPreview() {
  const plans = [
    { name: "Starter", price: "$0", pop: false },
    { name: "Pro", price: "$12", pop: true },
    { name: "Team", price: "$39", pop: false },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-background px-10 py-6 font-sans select-none">
      <SkeletonText variant="title" width="30%" className="h-4" />
      <SkeletonText variant="body" width="45%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {plans.map((pl) => (
          <div key={pl.name} className={`flex flex-col gap-2 rounded-xl border p-4 ${pl.pop ? "border-foreground bg-surface text-foreground shadow-lg ring-1 ring-foreground" : "border-border-visible bg-surface"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-foreground">{pl.name}</span>
              {pl.pop && <SkeletonChip label="Popular" tone="success" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">{pl.price}</span>
              <span className="text-[8px] text-muted-foreground">/month</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-2.5 text-emerald-500" />
                <SkeletonText variant="caption" width={`${70 - i * 15}%`} />
              </div>
            ))}
            <div className={`mt-auto flex h-6 items-center justify-center rounded-md text-[9px] font-semibold ${pl.pop ? "bg-foreground text-background" : "border border-border-visible text-foreground"}`}>
              Choose plan
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPreview() {
  const stats = [
    { v: "$48K", l: "Revenue", d: "+12%" },
    { v: "2,847", l: "Users", d: "+3%" },
    { v: "1,204", l: "Orders", d: "−1%" },
    { v: "98.2%", l: "Uptime", d: "+0.4%" },
  ];
  return (
    <div className="grid h-full w-full grid-cols-4 gap-3 bg-background px-8 py-4 font-sans select-none">
      {stats.map((s) => (
        <div key={s.l} className="flex flex-col justify-center gap-1 rounded-xl border border-border-visible bg-surface px-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-foreground">{s.v}</span>
            <SkeletonChip label={s.d} tone={s.d.startsWith("+") ? "success" : "danger"} />
          </div>
          <span className="text-[8px] text-muted-foreground">{s.l}</span>
        </div>
      ))}
    </div>
  );
}

function LogosPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface px-8 font-sans select-none">
      <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">Trusted by teams at</span>
      <div className="flex w-full items-center justify-between gap-4">
        {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map((c) => (
          <div key={c} className="flex items-center gap-1.5 opacity-70">
            <div className="size-4 rounded-[5px] bg-surface-raised border border-border-visible" />
            <span className="text-[10px] font-bold tracking-tight text-muted-foreground">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-background px-10 py-5 font-sans select-none">
      <SkeletonText variant="heading" width="28%" />
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3">
        {["AR", "GM", "AL", "KB"].map((ini) => (
          <div key={ini} className="flex flex-col items-center gap-1.5 rounded-xl border border-border-visible bg-surface p-3">
            <SkeletonAvatar initials={ini} size="lg" className="size-10" />
            <SkeletonText variant="caption" width="70%" />
            <span className="text-[7px] text-muted-foreground">Product Designer</span>
            <div className="flex gap-1 pt-0.5">
              <div className="flex size-4 items-center justify-center rounded border border-border-visible"><Globe aria-hidden="true" className="size-2 text-muted-foreground" /></div>
              <div className="flex size-4 items-center justify-center rounded border border-border-visible"><Mail aria-hidden="true" className="size-2 text-muted-foreground" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-6 overflow-y-auto bg-surface px-10 py-6 font-sans select-none">
      <div className="flex flex-col gap-4">
        <SkeletonText variant="title" width="50%" className="h-4" />
        <SkeletonText variant="body" width="85%" />
        {[
          { icon: Mail, label: "hello@bluepen.app" },
          { icon: Phone, label: "+1 (555) 013-2480" },
          { icon: MapPin, label: "San Francisco, CA" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-surface-raised border border-border-visible">
              <r.icon aria-hidden="true" className="size-3 text-foreground" />
            </div>
            <span className="text-[9px] font-medium text-foreground">{r.label}</span>
          </div>
        ))}
        <div className="flex gap-2">
          {[Globe, Send, MessageCircle].map((I, i) => (
            <div key={i} className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-surface-raised">
              <I aria-hidden="true" className="size-3 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <SkeletonInput placeholder="First name" />
          <SkeletonInput placeholder="Last name" />
        </div>
        <SkeletonInput icon={<SkeletonIcon icon={Mail} className="size-3" />} placeholder="you@company.com" />
        <div className="flex h-16 w-full rounded-md border border-border-visible bg-background px-2.5 py-2 text-[10px] text-muted-foreground">Your message…</div>
        <SkeletonButton label="Send message" className="h-8" />
      </div>
    </div>
  );
}

function NewsletterPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface border border-border-visible rounded-xl px-8 font-sans select-none">
      <SkeletonText variant="heading" width="40%" className="h-3.5" />
      <SkeletonText variant="caption" width="55%" />
      <div className="flex w-full max-w-70 gap-2">
        <div className="flex h-8 flex-1 items-center gap-1.5 rounded-md border border-border-visible bg-background px-2.5">
          <Mail aria-hidden="true" className="size-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground">you@company.com</span>
        </div>
        <div className="flex h-8 items-center justify-center rounded-md bg-foreground px-4 text-[9px] font-semibold text-background">
          Subscribe <Send aria-hidden="true" className="ml-1 size-2.5" />
        </div>
      </div>
    </div>
  );
}

function BlogPostPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-surface px-10 py-6 font-sans select-none">
      <div className="flex items-center gap-2">
        <SkeletonChip label="Design" tone="neutral" />
        <SkeletonChip label="Tutorial" tone="success" />
        <span className="text-[8px] text-muted-foreground">· 8 min read</span>
      </div>
      <SkeletonText variant="title" width="80%" className="h-4" />
      <SkeletonText variant="title" width="55%" className="h-4" />
      <SkeletonText variant="body" width="65%" />
      <SkeletonImage className="h-28 w-full rounded-lg" />
      <SkeletonText variant="body" width="95%" />
      <SkeletonText variant="body" width="88%" />
      <SkeletonText variant="body" width="72%" />
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <SkeletonAvatar initials="AR" size="sm" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-foreground">Ada Lovelace</span>
          <span className="text-[8px] text-muted-foreground">Staff Designer · Feb 2026</span>
        </div>
      </div>
    </div>
  );
}

function QuotePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface border border-border-visible rounded-xl px-10 font-sans select-none">
      <QuoteIcon aria-hidden="true" className="size-6 text-muted-foreground" />
      <SkeletonText variant="heading" width="75%" className="h-3.5" />
      <SkeletonText variant="heading" width="50%" className="h-3.5" />
      <div className="flex items-center gap-2">
        <SkeletonAvatar initials="JD" size="sm" />
        <SkeletonText variant="caption" width="70%" />
      </div>
    </div>
  );
}

function CtaPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between gap-4 rounded-xl border border-border-visible bg-surface px-8 font-sans select-none">
      <div className="flex min-w-0 flex-col gap-1.5">
        <SkeletonText variant="heading" width="65%" className="h-3.5" />
        <SkeletonText variant="caption" width="45%" />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="flex h-7 items-center justify-center rounded-md bg-foreground px-4 text-[9px] font-semibold text-background">
          Get started <ArrowRight aria-hidden="true" className="ml-1 size-2.5" />
        </div>
        <div className="flex h-7 items-center justify-center rounded-md border border-border-visible px-4 text-[9px] font-semibold text-foreground">
          Contact sales
        </div>
      </div>
    </div>
  );
}

/* ---------------- DATA ---------------- */

function CardPreview({ props }: { props: Props }) {
  const title = String(val(props, "title", "卡片标题"));
  const tag = String(val(props, "tag", "推荐"));
  const text = String(val(props, "text", "这里是卡片的详细说明文本或业务说明..."));
  const style = computeShapeStyle(props, {
    fill: "var(--surface)",
    stroke: "var(--border-visible)",
    borderWidth: 1,
    radius: 8,
  });
  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 shadow-xs overflow-hidden" style={style}>
      <SkeletonImage className="h-14 w-full rounded-md shrink-0" />
      <div className="flex items-center gap-1.5 min-w-0">
        {tag && <SkeletonChip label={tag} tone="success" />}
        <span className="text-[10px] font-semibold text-foreground truncate">{title}</span>
      </div>
      <p className="line-clamp-2 text-[9px] text-muted-foreground leading-relaxed">{text}</p>
      <div className="mt-auto flex items-center gap-2 pt-1 border-t border-border shrink-0">
        <SkeletonAvatar initials="PM" size="xs" />
        <SkeletonText variant="caption" width="30%" />
        <span className="ml-auto text-[8px] text-muted-foreground">刚刚</span>
      </div>
    </div>
  );
}

function DataTablePreview() {
  const rows = [
    { name: "Acme Corp", status: "Active" as const, amount: "$12,400" },
    { name: "Globex Inc", status: "Pending" as const, amount: "$8,120" },
    { name: "Initech", status: "Active" as const, amount: "$5,990" },
    { name: "Umbrella Co", status: "Draft" as const, amount: "$1,240" },
  ];
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface font-sans select-none">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="text-[10px] font-semibold text-foreground">Customers</span>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-24 items-center gap-1.5 rounded-md border border-border-visible bg-surface-raised px-2">
            <Search aria-hidden="true" className="size-2.5 text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Search…</span>
          </div>
          <SkeletonButton label="Add" className="h-6 px-2.5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-border bg-surface-raised px-3.5 py-1.5">
        {["Company", "Status", "Amount"].map((h) => (
          <span key={h} className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</span>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {rows.map((r, i) => (
          <div key={r.name} className={`grid grid-cols-3 items-center gap-2 px-3.5 py-2 ${i !== rows.length - 1 ? "border-b border-border" : ""}`}>
            <span className="truncate text-[9px] font-medium text-foreground">{r.name}</span>
            <div>
              <SkeletonChip label={r.status} tone={r.status === "Active" ? "success" : r.status === "Pending" ? "warning" : "neutral"} />
            </div>
            <span className="text-[9px] font-semibold text-foreground">{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListPreview() {
  const items = [
    { name: "Ada Lovelace", note: "Commented on Landing page", time: "2m" },
    { name: "Grace Hopper", note: "Assigned you to Navbar", time: "1h" },
    { name: "Alan Turing", note: "Approved Hero section", time: "3h" },
    { name: "Katherine Johnson", note: "Shared Export settings", time: "1d" },
  ];
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface font-sans select-none">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="text-[10px] font-semibold text-foreground">Activity</span>
        <SkeletonIcon icon={MoreHorizontal} className="size-3 text-muted-foreground" />
      </div>
      <div className="min-h-0 flex-1 px-1.5 py-1">
        {items.map((it, i) => (
          <div key={it.name} className={`flex items-center gap-2.5 px-2 py-2 ${i !== items.length - 1 ? "border-b border-border" : ""}`}>
            <SkeletonAvatar initials={it.name.split(" ").map((w) => w[0]).join("")} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-[9px] font-semibold text-foreground">{it.name}</span>
                <span className="shrink-0 text-[8px] text-muted-foreground">{it.time}</span>
              </div>
              <div className="truncate text-[8px] text-muted-foreground">{it.note}</div>
            </div>
            <SkeletonIcon icon={ChevronRight} className="size-3 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GridPreview() {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-2.5 p-3 font-sans select-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border-visible bg-surface p-2">
          <SkeletonImage className="h-8 w-full rounded-md" />
          <SkeletonText variant="caption" width="70%" />
          <SkeletonText variant="caption" width="50%" />
        </div>
      ))}
    </div>
  );
}

function TimelinePreview() {
  const items = [
    { t: "Design review", d: "Today, 9:00", done: true },
    { t: "User testing", d: "Today, 14:30", done: true },
    { t: "Developer handoff", d: "Tomorrow", done: false },
    { t: "Launch", d: "Fri, Mar 20", done: false },
  ];
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-surface border border-border-visible rounded-lg px-5 py-4 font-sans select-none">
      <span className="text-[10px] font-semibold text-foreground">Milestones</span>
      <div className="min-h-0 flex-1">
        {items.map((it, i) => (
          <div key={it.t} className="relative flex gap-3 pb-4 last:pb-0">
            {i !== items.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
            <span className={`relative mt-1 size-[11px] shrink-0 rounded-full border-2 ${it.done ? "border-foreground bg-foreground" : "border-border-visible bg-surface-raised"}`} />
            <div className="min-w-0">
              <span className={`block text-[9px] font-semibold ${it.done ? "text-foreground" : "text-muted-foreground"}`}>{it.t}</span>
              <span className="text-[8px] text-muted-foreground">{it.d}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanPreview() {
  const cols = [
    { name: "To do", cards: ["Navbar states", "Empty state"] },
    { name: "In progress", cards: ["Export modal"] },
    { name: "Done", cards: ["Login form", "Pricing grid"] },
  ];
  return (
    <div className="flex h-full w-full gap-3 overflow-x-auto bg-background p-3 font-sans select-none">
      {cols.map((c, ci) => (
        <div key={c.name} className="flex w-1/3 min-w-32 flex-col gap-2 rounded-lg bg-surface-raised border border-border-visible p-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">{c.name}</span>
            <span className="flex size-4 items-center justify-center rounded bg-surface border border-border text-[8px] font-semibold text-muted-foreground">{c.cards.length}</span>
          </div>
          {c.cards.map((card) => (
            <div key={card} className="rounded-md border border-border bg-surface p-2.5 shadow-xs">
              <div className="text-[9px] font-medium text-foreground">{card}</div>
              <div className="mt-2 flex items-center gap-1">
                <SkeletonChip label={`${ci + 1} pts`} tone={ci === 0 ? "neutral" : ci === 1 ? "warning" : "success"} />
                <SkeletonAvatar initials="AR" size="xs" className="ml-auto" />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1 px-1 text-[8px] text-muted-foreground">
            <Plus aria-hidden="true" className="size-2.5" /> Add card
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarPreview() {
  const days = Array.from({ length: 7 }).map((_, i) => ["S", "M", "T", "W", "T", "F", "S"][i]);
  const marks = [4, 9, 14, 17, 22];
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface p-3 font-sans select-none">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChevronsRight aria-hidden="true" className="size-3 rotate-180 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-foreground">March 2026</span>
          <ChevronsRight aria-hidden="true" className="size-3 text-muted-foreground" />
        </div>
        <div className="flex size-5 items-center justify-center rounded-md border border-border-visible bg-surface-raised">
          <Plus aria-hidden="true" className="size-2.5 text-muted-foreground" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map((d, i) => (
          <span key={i} className="py-0.5 text-[7px] font-semibold text-muted-foreground">{d}</span>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 2;
          const marked = marks.includes(day);
          return (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-md text-[8px] ${day < 1 || day > 31 ? "text-muted-foreground/30" : day === 14 ? "bg-foreground font-bold text-background" : "text-muted-foreground"}`}>
              {day >= 1 && day <= 31 ? day : ""}
              {marked && <span className="absolute mb-6 size-1 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPreview({ props }: { props?: Props }) {
  const value = props ? String(val(props, "value", "¥ 88,240")) : "¥ 88,240";
  const label = props ? String(val(props, "label", "今日成交金额")) : "今日成交金额";
  const change = props ? String(val(props, "change", "+15.2%")) : "+15.2%";
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-xl border border-border-visible bg-surface p-4 font-sans select-none">
      <div className="flex items-center justify-between">
        <SkeletonIcon icon={CircleDollarSign} className="size-3.5 text-muted-foreground" />
        <SkeletonChip label={change} tone={change.startsWith("+") ? "success" : "danger"} />
      </div>
      <span className="text-base font-bold tracking-tight text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <div className="mt-1 h-6">
        <SkeletonBars values={[30, 45, 38, 60, 52, 70, 64]} />
      </div>
    </div>
  );
}

function ChartPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-2 rounded-xl border border-border-visible bg-surface p-4 font-sans select-none">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-foreground">Monthly revenue</div>
          <div className="text-[8px] text-muted-foreground">Jan — Mar 2026</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[8px] text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground" /> This year</span>
          <span className="flex items-center gap-1 text-[8px] text-muted-foreground/60"><span className="size-1.5 rounded-full bg-muted-foreground" /> Last year</span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex flex-col justify-between">
          {["$40k", "$30k", "$20k", "$10k", "$0"].map((l) => (
            <div key={l} className="flex items-center gap-2">
              <span className="w-6 text-right text-[7px] text-muted-foreground">{l}</span>
              <SkeletonLine />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-end gap-1 pl-10">
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-xs bg-surface-raised"><div className="h-[60%] rounded-t-xs bg-muted-foreground/30" /></div>
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-xs bg-surface-raised"><div className="h-[75%] rounded-t-xs bg-muted-foreground/30" /></div>
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-xs bg-surface-raised"><div className="h-[48%] rounded-t-xs bg-foreground" /></div>
        </div>
      </div>
      <div className="flex justify-between px-2 pt-1">
        {["Jan", "Feb", "Mar"].map((m) => (
          <span key={m} className="text-[7px] text-muted-foreground">{m}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyStatePreview({ props }: { props?: Props }) {
  const title = String(val(props || {}, "title", "暂无数据"));
  const text = String(val(props || {}, "text", "点击下方按钮创建第一条记录"));
  const buttonText = String(val(props || {}, "buttonText", "立即创建"));
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border-visible bg-surface px-8 text-center font-sans select-none">
      <div className="flex size-10 items-center justify-center rounded-xl border border-border-visible bg-surface-raised shadow-xs">
        <PackageOpen aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <span className="text-[10px] font-semibold text-foreground">{title}</span>
      <span className="text-[8.5px] text-muted-foreground max-w-50 line-clamp-2">{text}</span>
      {buttonText && <SkeletonButton label={buttonText} className="mt-1" />}
    </div>
  );
}

/* ---------------- OVERLAY ---------------- */

function ModalPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black/60 font-sans select-none">
      <div className="flex h-[78%] w-[82%] flex-col overflow-hidden rounded-xl border border-border-visible bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[10px] font-semibold text-foreground">Export project</div>
            <div className="text-[8px] text-muted-foreground">Choose a format and options</div>
          </div>
          <div className="flex size-6 items-center justify-center rounded-md hover:bg-surface-raised cursor-default">
            <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border-visible bg-surface-raised px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <SkeletonIcon icon={i === 0 ? ImageIcon : i === 1 ? Package : BarChart3} className="size-3.5 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-foreground">{["PNG — 2× export", "PDF — vector", "JSON — data"][i]}</span>
                  <span className="text-[8px] text-muted-foreground">{["Retina quality", "Print ready", "Raw project"][i]}</span>
                </div>
              </div>
              <Check aria-hidden="true" className="size-3.5 text-emerald-500" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <SkeletonButton variant="secondary" label="Cancel" />
          <SkeletonButton label="Export" />
        </div>
      </div>
    </div>
  );
}

function AlertPreview({ props }: { props?: Props }) {
  const title = props ? String(val(props, "title", "提示信息")) : "提示信息";
  const text = props ? String(val(props, "text", "这里是系统操作的提示说明文本")) : "这里是系统操作的提示说明文本";
  const fill = props ? String(val(props, "fill", "var(--surface)")) : "var(--surface)";
  const stroke = props ? String(val(props, "stroke", "var(--border-visible)")) : "var(--border-visible)";
  const strokeEnabled = props ? (props.strokeEnabled !== false && props.strokeEnabled !== "false") : true;
  const borderWidth = props ? Number(val(props, "borderWidth", 1)) : 1;
  const radius = props ? Number(val(props, "radius", 8)) : 8;
  return (
    <div
      className="flex h-full w-full items-center gap-3 px-4 font-sans select-none"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "none",
        borderRadius: radius,
      }}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle aria-hidden="true" className="size-3.5 text-amber-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-foreground">{title}</span>
        </div>
        <div className="mt-0.5 truncate text-[8px] text-muted-foreground">
          {text}
        </div>
      </div>
    </div>
  );
}

function ToastPreview() {
  return (
    <div className="flex h-full w-full items-center gap-3 rounded-lg border border-border-visible bg-surface px-4 shadow-lg font-sans select-none">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <Check aria-hidden="true" className="size-3.5 text-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold text-foreground">Project exported</div>
        <div className="mt-0.5 truncate text-[8px] text-muted-foreground">landing-page.png · 1.2 MB</div>
      </div>
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-raised">
        <X aria-hidden="true" className="size-2.5 text-muted-foreground" />
      </div>
    </div>
  );
}

function DrawerPreview() {
  return (
    <div className="relative flex h-full w-full justify-end bg-black/60 font-sans select-none">
      <div className="flex h-full w-[85%] flex-col border-l border-border-visible bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[10px] font-semibold text-foreground">Notifications</span>
          <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {["AR", "GM", "AL"].map((ini, i) => (
            <div key={ini} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-raised p-2.5">
              <SkeletonAvatar initials={ini} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-[9px] font-semibold text-foreground">{["Ada commented", "Grace mentioned you", "Alan approved"][i]}</span>
                  <span className="shrink-0 text-[7px] text-muted-foreground">2m</span>
                </div>
                <div className="truncate text-[8px] text-muted-foreground">{["on the hero section", "in #general", "your wireframe"][i]}</div>
              </div>
              {i === 0 && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SheetPreview() {
  return (
    <div className="relative flex h-full w-full items-end bg-black/60 font-sans select-none">
      <div className="flex h-[80%] w-full flex-col rounded-t-xl border border-b-0 border-border-visible bg-surface">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-visible" />
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[10px] font-semibold text-foreground">Share</span>
          <X aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-1 gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-border-visible bg-surface-raised">
              <SkeletonIcon icon={i === 0 ? Mail : i === 1 ? LinkIcon : Send} className="size-4 text-foreground" />
              <span className="text-[8px] font-semibold text-foreground">{["Email", "Copy link", "Slack"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PopoverPreview() {
  return (
    <div className="relative flex h-full w-full items-start justify-center pt-6 font-sans select-none">
      <div className="flex w-[70%] flex-col rounded-xl border border-border-visible bg-surface p-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <SkeletonAvatar initials="GM" size="sm" />
            <div>
              <div className="text-[9px] font-semibold text-foreground">Grace Hopper</div>
              <div className="text-[7px] text-muted-foreground">Admin · online</div>
            </div>
          </div>
          <X aria-hidden="true" className="size-3 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2 py-2.5">
          <SkeletonText variant="body" width="90%" />
          <SkeletonText variant="body" width="60%" />
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
          <SkeletonButton label="Message" className="h-6 px-2.5" />
          <SkeletonButton variant="secondary" label="Profile" className="h-6 px-2.5" />
        </div>
      </div>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="relative flex h-full w-full items-start justify-center pt-4 font-sans select-none">
      <div className="relative">
        <div className="flex size-8 items-center justify-center rounded-md border border-border-visible bg-surface">
          <Home aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-[8px] font-mono font-medium text-background uppercase tracking-wider">
          Go to home
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function DropdownPreview() {
  const items = [
    { icon: Users, label: "Share" },
    { icon: Star, label: "Favourite" },
    { icon: Package, label: "Archive" },
    { icon: Trash, label: "Delete", danger: true },
  ];
  return (
    <div className="relative flex h-full w-full justify-end pr-4 pt-4 font-sans select-none">
      <div className="flex w-[70%] flex-col gap-0.5 rounded-xl border border-border-visible bg-surface p-1.5 shadow-xl">
        {items.map((it) => (
          <div key={it.label} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${it.danger ? "text-rose-500" : "text-foreground"} hover:bg-surface-raised`}>
            <it.icon aria-hidden="true" className="size-3" />
            <span className="text-[9px] font-medium">{it.label}</span>
            {it.danger && <Trash aria-hidden="true" className="ml-auto size-2.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandPreview() {
  const items = [
    { icon: Search, label: "Go to Dashboard", k: "G D" },
    { icon: FileText, label: "Open: Landing page", k: "↵" },
    { icon: Users, label: "Invite teammate", k: "I" },
    { icon: Settings, label: "Preferences", k: "P" },
  ];
  return (
    <div className="flex h-full w-full items-start justify-center pt-5 font-sans select-none">
      <div className="flex w-[86%] flex-col overflow-hidden rounded-xl border border-border-visible bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
          <Search aria-hidden="true" className="size-3.5 text-muted-foreground" />
          <span className="flex-1 text-[10px] text-muted-foreground">Search or jump to…</span>
          <div className="rounded border border-border-visible bg-surface-raised px-1 py-0.5 text-[7px] font-mono font-semibold text-muted-foreground">ESC</div>
        </div>
        <div className="flex flex-col p-1.5">
          <span className="px-2.5 py-1 text-[7px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Suggestions</span>
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 first-of-type:bg-surface-raised">
              <it.icon aria-hidden="true" className="size-3 text-muted-foreground" />
              <span className="flex-1 text-[9px] font-medium text-foreground">{it.label}</span>
              <div className="rounded border border-border-visible bg-surface-raised px-1 py-0.5 text-[7px] font-mono font-semibold text-muted-foreground">{it.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- INPUT ---------------- */

function AuthShell({ fields, title }: { fields: number; title: string }) {
  const labels = ["Full name", "Email address", "Password"];
  const icons = [User, Mail, Lock];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-surface border border-border-visible rounded-xl px-10 font-sans select-none">
      <div className="flex flex-col items-center gap-2">
        <Logo className="size-7 rounded-lg" />
        <SkeletonText variant="heading" width="70%" />
      </div>
      <div className="flex w-full max-w-55 flex-col gap-2.5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[8px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">{labels[i]}</span>
            <SkeletonInput
              icon={<SkeletonIcon icon={icons[i]} className="size-3" />}
              placeholder={i === 1 ? "you@company.com" : "••••••••"}
            />
          </div>
        ))}
        <SkeletonButton label={title} className="mt-1 h-8" />
        <div className="flex items-center gap-2 py-0.5">
          <SkeletonLine className="flex-1" />
          <span className="text-[8px] text-muted-foreground">or</span>
          <SkeletonLine className="flex-1" />
        </div>
        <div className="flex gap-2">
          <div className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-visible bg-surface-raised text-[9px] font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-muted-foreground" /> Google
          </div>
          <div className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-visible bg-surface-raised text-[9px] font-medium text-foreground">
            <span className="size-2.5 rounded-full bg-foreground" /> GitHub
          </div>
        </div>
      </div>
      <span className="text-[8px] text-muted-foreground">{title === "Sign in" ? "No account?" : "Have an account?"} <span className="font-semibold text-foreground">Click here</span></span>
    </div>
  );
}

function LoginPreview() {
  return <AuthShell fields={2} title="Sign in" />;
}

function RegisterPreview() {
  return <AuthShell fields={3} title="Create account" />;
}

function FormPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-lg border border-border-visible bg-surface p-4 font-sans select-none">
      <div>
        <SkeletonText variant="heading" width="45%" />
        <SkeletonText variant="caption" width="70%" className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">First name</span>
          <SkeletonInput placeholder="Ada" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">Last name</span>
          <SkeletonInput placeholder="Lovelace" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
        <SkeletonInput icon={<SkeletonIcon icon={Mail} className="size-3" />} placeholder="ada@company.com" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">Project</span>
        <div className="flex h-8 items-center justify-between rounded-md border border-border-visible bg-background px-2.5">
          <span className="text-[10px] text-foreground">Wireframe kit</span>
          <SkeletonIcon icon={ChevronDown} className="size-3" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex size-3.5 items-center justify-center rounded-[4px] border border-border-visible bg-background">
          <Check aria-hidden="true" className="size-2 text-foreground" />
        </div>
        <span className="text-[8px] text-muted-foreground">Send me product updates</span>
      </div>
      <SkeletonButton label="Submit" className="mt-auto h-8" />
    </div>
  );
}

function AvatarPreview({ props }: { props?: Props }) {
  const initials = props ? String(val(props, "initials", "PM")) : "PM";
  const fill = props ? String(val(props, "fill", "var(--surface-raised)")) : "var(--surface-raised)";
  const stroke = props ? String(val(props, "stroke", "var(--border-visible)")) : "var(--border-visible)";
  const strokeEnabled = props ? Boolean(props.strokeEnabled) : true;
  const borderWidth = props ? Number(val(props, "borderWidth", 1)) : 1;
  return (
    <div className="flex h-full w-full items-center justify-center font-mono select-none">
      <div
        className="flex size-full items-center justify-center rounded-full text-xs font-bold text-foreground border border-border-visible shadow-xs"
        style={{
          backgroundColor: fill,
          border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "none",
        }}
      >
        {initials}
      </div>
    </div>
  );
}

function AvatarGroupPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex -space-x-1.5">
        {["AR", "GM", "AL"].map((ini) => (
          <SkeletonAvatar key={ini} initials={ini} size="sm" className="ring-2 ring-white" />
        ))}
        <div className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-[8px] font-bold text-white ring-2 ring-white">
          +9
        </div>
      </div>
    </div>
  );
}

function BadgePreview({ props }: { props: Props }) {
  const style = computeShapeStyle(props, {
    fill: "#18181B",
    stroke: "#18181B",
    borderWidth: 1,
    radius: 6,
  });
  const text = String(val(props, "text", "New"));
  const textColor = String(val(props, "textColor", "#FFFFFF"));
  const textOpacity = Number(val(props, "textOpacity", 100));
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="flex h-[70%] max-h-7 min-h-4 items-center justify-center px-3 text-[10px] font-bold select-none"
        style={{
          ...style,
          color: hexToRgba(textColor, textOpacity),
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ChipPreview({ props }: { props: Props }) {
  const style = computeShapeStyle(props, {
    fill: "#EFF6FF",
    stroke: "#BFDBFE",
    borderWidth: 1,
    radius: 9999,
  });
  const text = String(val(props, "text", "状态标签"));
  const textColor = String(val(props, "textColor", "#2563EB"));
  const textOpacity = Number(val(props, "textOpacity", 100));
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="flex h-[70%] max-h-7 min-h-4 items-center gap-1.5 px-3 text-[10px] font-medium select-none"
        style={{
          ...style,
          color: hexToRgba(textColor, textOpacity),
        }}
      >
        <Tag aria-hidden="true" className="size-2.5 opacity-70 shrink-0" />
        <span className="truncate">{text}</span>
        <X aria-hidden="true" className="size-2.5 opacity-50 shrink-0" />
      </div>
    </div>
  );
}

function ProgressPreview({ props }: { props?: Props }) {
  const percent = props ? Number(val(props, "percent", 70)) : 70;
  return (
    <div className="flex h-full w-full items-center gap-3 px-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-neutral-600">{percent}%</span>
    </div>
  );
}

function SpinnerPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-border-visible border-t-foreground" />
    </div>
  );
}

function CodeBlockPreview({ props }: { props?: Props }) {
  const p = props || {};
  const filename = String(val(p, "filename", "app.ts"));
  const codeStr = String(val(p, "code", "const app = new Bluepen();\napp.setMode('wireframe');\napp.export('png', { scale: 2 });"));
  const fill = String(val(p, "fill", "#1E293B"));
  const textColor = String(val(p, "textColor", "#38BDF8"));
  const stroke = String(val(p, "stroke", "#334155"));
  const strokeEnabled = p.strokeEnabled !== false && p.strokeEnabled !== "false";
  const borderWidth = Number(val(p, "borderWidth", 1));
  const radius = Number(val(p, "radius", 8));
  const lines = codeStr.split("\n");

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden shadow-md"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "none",
        borderRadius: radius,
      }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 shrink-0 bg-black/20">
        <span className="size-2 rounded-full bg-rose-400/80" />
        <span className="size-2 rounded-full bg-amber-400/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[8.5px] font-mono text-neutral-400">{filename}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-start gap-1 overflow-y-auto px-3.5 py-2.5 font-mono text-[9px]">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-2.5 leading-relaxed">
            <span className="w-4 shrink-0 select-none text-right text-[8px] text-neutral-500/70">{i + 1}</span>
            <span className="truncate" style={{ color: textColor }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingPreview({ props }: { props?: Props }) {
  const score = Number(val(props || {}, "score", 4.8));
  const count = Number(val(props || {}, "count", 312));
  return (
    <div className="flex h-full w-full items-center justify-center gap-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star key={s} aria-hidden="true" className={`size-4 ${s < Math.floor(score) ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
        ))}
      </div>
      <span className="text-[9px] font-semibold text-neutral-600">{score}</span>
      <span className="text-[8px] text-neutral-400">({count})</span>
    </div>
  );
}

function ImagePreview({ props }: { props: Props }) {
  const src = props.src ? String(props.src) : "";
  const label = String(val(props, "label", "图片占位"));
  const fit = String(val(props, "fit", "cover")) as "cover" | "contain" | "fill" | "none" | "scale-down";
  const radius = Number(val(props, "radius", 6));
  const fill = String(val(props, "fill", "var(--surface-raised)"));
  const stroke = String(val(props, "stroke", "var(--border-visible)"));
  const strokeEnabled = Boolean(props.strokeEnabled);
  const strokeStyle = String(val(props, "strokeStyle", "solid"));
  const borderWidth = Number(val(props, "borderWidth", 1));

  if (src) {
    return (
      <div
        className="relative size-full overflow-hidden select-none"
        style={{
          borderRadius: radius,
          border: strokeEnabled ? `${borderWidth}px ${strokeStyle} ${stroke}` : "none",
          backgroundColor: fill === "transparent" ? undefined : fill,
        }}
      >
        <img
          src={src}
          alt={label || "Image"}
          className="size-full pointer-events-none select-none block"
          style={{
            objectFit: fit,
            borderRadius: radius > 0 ? Math.max(0, radius - (strokeEnabled ? borderWidth : 0)) : 0,
          }}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full items-center justify-center overflow-hidden select-none"
      style={{
        backgroundColor: fill,
        border: (props.strokeEnabled !== false && props.strokeEnabled !== "false") ? `${borderWidth}px ${props.strokeStyle || "dashed"} ${stroke}` : "none",
        borderRadius: radius,
      }}
    >
      <ImageIcon className="size-5 text-neutral-400 mb-1" />
      <span className="absolute bottom-2 text-[9px] font-medium text-neutral-500 bg-white/80 px-2 py-0.5 rounded shadow-2xs backdrop-blur-xs">
        {label}
      </span>
    </div>
  );
}

function VideoPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border-visible bg-surface">
      <div className="absolute inset-0 flex items-center justify-center">
        <Camera aria-hidden="true" className="size-6 text-muted-foreground" />
      </div>
      <div className="relative flex h-10 w-14 items-center justify-center rounded-xl bg-surface-raised border border-border-visible shadow-lg">
        <Play aria-hidden="true" className="ml-0.5 size-4 fill-foreground text-foreground" />
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[7px] font-semibold text-white">0:42</span>
      <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[7px] font-semibold text-white">
        <span className="size-1.5 rounded-full bg-accent" /> LIVE
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD / PAGES ---------------- */

function DashboardPreview() {
  const stats = [
    { icon: CircleDollarSign, label: "Revenue", value: "$48,290", delta: "+12.4%", up: true },
    { icon: Users, label: "Active users", value: "2,847", delta: "+3.1%", up: true },
    { icon: ShoppingBag, label: "Orders", value: "1,204", delta: "−0.8%", up: false },
  ];
  return (
    <div className="flex h-full w-full flex-col gap-3 bg-background p-4 font-sans select-none">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-foreground">Overview</div>
          <div className="text-[8px] text-muted-foreground">March 2026 · last 30 days</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-20 items-center gap-1.5 rounded-md border border-border-visible bg-surface px-2">
            <Search aria-hidden="true" className="size-2.5 text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Search…</span>
          </div>
          <SkeletonAvatar initials="JD" size="sm" />
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border-visible bg-surface p-3">
            <div className="flex items-center justify-between">
              <SkeletonIcon icon={s.icon} className="size-3 text-muted-foreground" />
              <SkeletonChip label={s.delta} tone={s.up ? "success" : "danger"} />
            </div>
            <div className="mt-2 text-[12px] font-bold tracking-tight text-foreground">{s.value}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
        <div className="col-span-3 flex flex-col rounded-lg border border-border-visible bg-surface p-3">
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-[9px] font-semibold text-foreground">Revenue</span>
            <div className="flex items-center gap-1 text-[8px] text-[#4A9E5C]">
              <TrendingUp aria-hidden="true" className="size-2.5" />
              <span className="font-semibold">+12.4%</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 pt-2">
            <SkeletonBars values={[35, 48, 42, 58, 52, 66, 61, 74, 68, 82, 76, 88, 72, 80, 92]} />
          </div>
        </div>
        <div className="col-span-2 flex flex-col rounded-lg border border-border-visible bg-surface p-3">
          <span className="shrink-0 text-[9px] font-semibold text-foreground">Top pages</span>
          <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
            {[
              { label: "landing", value: "34%", w: "w-[86%]" },
              { label: "pricing", value: "22%", w: "w-[58%]" },
              { label: "docs", value: "15%", w: "w-[42%]" },
              { label: "blog", value: "9%", w: "w-[28%]" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-10 truncate text-[8px] text-muted-foreground">{r.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                  <div className={`h-full rounded-full bg-muted-foreground/40 ${r.w}`} />
                </div>
                <span className="w-7 text-right text-[8px] font-semibold text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPagePreview() {
  const sections = ["Profile", "Account", "Billing", "Team", "Notifications"];
  return (
    <div className="flex h-full w-full bg-background font-sans select-none">
      <div className="flex w-[30%] shrink-0 flex-col gap-0.5 border-r border-border bg-surface p-3">
        {sections.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${i === 0 ? "bg-surface-raised border border-border-visible font-semibold text-foreground" : "text-muted-foreground"}`}>
            <Settings aria-hidden="true" className={`size-3 ${i === 0 ? "text-foreground" : "text-muted-foreground"}`} />
            <span className={`text-[9px] ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
        <div>
          <div className="text-[11px] font-semibold text-foreground">Profile</div>
          <div className="text-[8px] text-muted-foreground">Update your personal information</div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonAvatar initials="JD" size="lg" />
          <div>
            <SkeletonButton variant="secondary" label="Change photo" className="h-6 px-2.5" />
            <div className="mt-1 text-[8px] text-muted-foreground">JPG, PNG — max 2 MB</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
            <SkeletonInput placeholder="Jane Doe" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
            <SkeletonInput icon={<SkeletonIcon icon={Mail} className="size-3" />} placeholder="jane@acme.com" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border-visible bg-surface p-3">
          <div>
            <div className="text-[9px] font-semibold text-foreground">Two-factor auth</div>
            <div className="text-[8px] text-muted-foreground">Protect your account with an extra layer</div>
          </div>
          <div className="flex w-9 items-center rounded-full bg-primary p-0.5">
            <span className="ml-auto size-3.5 rounded-full bg-primary-foreground shadow-xs" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <SkeletonButton variant="secondary" label="Cancel" />
          <SkeletonButton label="Save changes" />
        </div>
      </div>
    </div>
  );
}

function ProfilePagePreview() {
  return (
    <div className="flex h-full w-full flex-col bg-background font-sans select-none">
      <div className="relative h-[30%] shrink-0 bg-surface-raised border-b border-border">
        <div className="absolute bottom-3 left-5 flex items-end gap-3">
          <SkeletonAvatar initials="JD" size="lg" className="size-14 rounded-xl ring-2 ring-border-visible" />
          <div className="pb-1">
            <div className="text-[12px] font-bold text-foreground">Jane Doe</div>
            <div className="text-[8px] text-muted-foreground">Product Designer · @janedoe</div>
          </div>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-y-auto p-4">
        <div className="col-span-2 flex flex-col gap-3">
          <div className="rounded-lg border border-border-visible bg-surface p-4">
            <span className="text-[9px] font-semibold text-foreground">About</span>
            <SkeletonText variant="body" width="95%" className="mt-2" />
            <SkeletonText variant="body" width="80%" className="mt-1.5" />
          </div>
          <div className="flex-1 rounded-lg border border-border-visible bg-surface p-4">
            <span className="text-[9px] font-semibold text-foreground">Recent activity</span>
            <div className="mt-2 flex flex-col gap-2">
              {["Commented on Landing page", "Approved Hero section", "Shared wireframe v3"].map((a, i) => (
                <div key={a} className="flex items-center gap-2">
                  <span className={`size-1.5 shrink-0 rounded-full ${i === 0 ? "bg-[#4A9E5C]" : "bg-muted-foreground"}`} />
                  <span className="truncate text-[8px] text-muted-foreground">{a}</span>
                  <span className="ml-auto shrink-0 text-[7px] text-muted-foreground">{["2h", "1d", "3d"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border-visible bg-surface p-4">
            <span className="text-[9px] font-semibold text-foreground">Details</span>
            <div className="mt-2 flex flex-col gap-2">
              {[
                { icon: Mail, v: "jane@acme.com" },
                { icon: MapPin, v: "Buenos Aires" },
                { icon: CalendarDays, v: "Joined Jan 2024" },
              ].map((r) => (
                <div key={r.v} className="flex items-center gap-2">
                  <r.icon aria-hidden="true" className="size-3 text-muted-foreground" />
                  <span className="truncate text-[8px] text-muted-foreground">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border-visible bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-foreground">Projects</span>
              <span className="text-[8px] font-semibold text-muted-foreground">12</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <SkeletonText variant="caption" width="80%" />
              <SkeletonText variant="caption" width="60%" />
              <SkeletonText variant="caption" width="70%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- OLD KEEPERS ---------------- */

function FaqPreview() {
  const items = [
    { q: "How do I export my project?", w: "56%" },
    { q: "Can I collaborate in real time?", w: "62%" },
    { q: "Is there a free plan?", w: "44%" },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-surface border border-border-visible rounded-xl px-8 py-5 font-sans select-none">
      <SkeletonText variant="heading" width="38%" />
      <SkeletonText variant="caption" width="52%" />
      <div className="mt-1 flex w-full flex-col">
        {items.map((it, i) => (
          <div key={it.q} className={`flex flex-col gap-2 py-3 ${i !== items.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[10px] font-medium text-foreground">{it.q}</span>
              <div className="flex size-4 shrink-0 items-center justify-center rounded border border-border-visible bg-surface-raised">
                <Plus aria-hidden="true" className="size-2.5 text-muted-foreground" />
              </div>
            </div>
            <SkeletonText variant="body" width={it.w} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- UTILS & SHAPE STYLING (P0, P1, P2) ---------------- */
export { hexToRgba, computeShapeStyle, ShapeTextRenderer } from "../utils/shape-styles";
import { hexToRgba, computeShapeStyle, ShapeTextRenderer } from "../utils/shape-styles";


function RectanglePreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  const style = computeShapeStyle(props, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });
  return (
    <div className="relative h-full w-full overflow-hidden" style={style}>
      <ShapeTextRenderer props={props} isEditing={isEditing} />
    </div>
  );
}

function TextPreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  if (isEditing) {
    return <div className="h-full w-full" />;
  }
  const text = String(val(props, "text", ""));
  const textColor = String(val(props, "textColor", "var(--foreground)"));
  const textOpacity = Number(val(props, "textOpacity", 100));
  const color = textColor.startsWith("#") ? hexToRgba(textColor, textOpacity) : textColor;
  const fontSize = Number(val(props, "fontSize", 14));
  const fontWeight = Number(val(props, "fontWeight", 400));
  const fontFamily = props.fontFamily ? String(props.fontFamily) : undefined;
  const align = String(val(props, "textAlign", val(props, "align", "left"))) as "left" | "center" | "right" | "justify";
  const textVerticalAlign = String(val(props, "textVerticalAlign", "top"));
  const lineHeight = props.lineHeight ? `${props.lineHeight}px` : "1.4";
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
    align === "left" ? "justify-start" : align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  const itemsClass =
    textVerticalAlign === "middle" || textVerticalAlign === "center"
      ? "items-center"
      : textVerticalAlign === "bottom"
      ? "items-end"
      : "items-start";

  if (text) {
    return (
      <div className={cn("flex h-full w-full px-1 overflow-hidden", justifyClass, itemsClass)}>
        <span
          className="w-full whitespace-pre-wrap break-words"
          style={{
            color,
            fontSize,
            fontWeight,
            fontFamily,
            textAlign: align,
            lineHeight,
            letterSpacing,
            fontStyle,
            textDecoration,
          }}
        >
          {text}
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center px-1 text-muted-foreground/60 italic text-xs select-none">
      双击输入文本内容...
    </div>
  );
}

function CirclePreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  const style = computeShapeStyle(props, { fill: "var(--surface-raised)", stroke: "var(--border-visible)", borderWidth: 1, isCircle: true });
  return (
    <div className="relative h-full w-full overflow-hidden" style={style}>
      <ShapeTextRenderer props={props} isEditing={isEditing} />
    </div>
  );
}


function LinePreview({ props }: { props: Props }) {
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const stroke = strokeEnabled ? String(val(props, "stroke", "var(--border-visible)")) : "transparent";
  const strokeStyle = String(val(props, "strokeStyle", "solid"));
  const borderWidth = Number(val(props, "borderWidth", 1.5));
  const strokeDash = strokeStyle === "dashed" ? "6 4" : strokeStyle === "dotted" ? "2 3" : undefined;
  return (
    <div className="relative flex h-full w-full items-center justify-center pointer-events-none">
      <svg className="h-full w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={stroke}
          strokeWidth={borderWidth}
          strokeDasharray={strokeDash}
          strokeLinecap="butt"
        />
      </svg>
    </div>
  );
}

function ArrowPreview({ props }: { props: Props }) {
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const stroke = strokeEnabled ? String(val(props, "stroke", "var(--foreground)")) : "transparent";
  const strokeStyle = String(val(props, "strokeStyle", "solid"));
  const borderWidth = Number(val(props, "borderWidth", 1.5));
  const strokeDash = strokeStyle === "dashed" ? "6 4" : strokeStyle === "dotted" ? "2 3" : undefined;
  const markerId = `arrowhead-${stroke.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="relative flex h-full w-full items-center justify-center pointer-events-none">
      <svg className="h-full w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0.5, 7 3.5, 0 6.5" fill={stroke} />
          </marker>
        </defs>
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={stroke}
          strokeWidth={borderWidth}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
    </div>
  );
}


function HotspotPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "var(--accent-subtle)"));
  const stroke = String(val(props, "stroke", "var(--accent)"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const strokeStyle = String(val(props, "strokeStyle", "dashed"));
  const borderWidth = Number(val(props, "borderWidth", 1.5));
  const radius = Number(val(props, "radius", 4));
  const label = String(val(props, "label", "热区 / Hotspot"));
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-1.5 font-mono text-[10px] font-medium px-2 truncate select-none"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px ${strokeStyle} ${stroke}` : "none",
        color: stroke,
        borderRadius: radius,
      }}
    >
      <Zap aria-hidden="true" className="size-3.5 fill-current opacity-80 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function ButtonPreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  const text = String(val(props, "text", "次要操作"));
  const textColor = String(val(props, "textColor", "var(--foreground)"));
  const textOpacity = Number(val(props, "textOpacity", 100));
  const style = computeShapeStyle(props, {
    fill: "transparent",
    stroke: "var(--border-visible)",
    borderWidth: 1,
    radius: 999,
  });
  const fontSize = Number(val(props, "fontSize", 12));
  const fontWeight = Number(val(props, "fontWeight", 500));
  const fontFamily = props.fontFamily ? String(props.fontFamily) : "var(--font-mono)";
  const textAlign = String(val(props, "textAlign", "center"));
  const letterSpacing =
    props.letterSpacing !== undefined
      ? typeof props.letterSpacing === "number"
        ? `${props.letterSpacing}px`
        : String(props.letterSpacing)
      : "0.06em";
  const lineHeight = props.lineHeight ? `${props.lineHeight}px` : undefined;
  const italic = Boolean(props.italic);
  const underline = Boolean(props.underline);
  const strikethrough = Boolean(props.strikethrough);
  const textDecoration =
    underline && strikethrough
      ? "underline line-through"
      : underline
      ? "underline"
      : strikethrough
      ? "line-through"
      : undefined;

  const justifyClass =
    textAlign === "left"
      ? "justify-start"
      : textAlign === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <div
      className={cn("flex h-full w-full items-center px-4 select-none", justifyClass)}
      style={{
        ...style,
        color: hexToRgba(textColor, textOpacity),
        fontSize: `${fontSize}px`,
        fontWeight,
        fontFamily,
        letterSpacing,
        lineHeight,
        fontStyle: italic ? "italic" : undefined,
        textDecoration,
      }}
    >
      {!isEditing && <span className="truncate uppercase">{text}</span>}
    </div>
  );
}

function ButtonPrimaryPreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  const text = String(val(props, "text", "主要操作"));
  const textColor = String(val(props, "textColor", "var(--primary-foreground)"));
  const textOpacity = Number(val(props, "textOpacity", 100));
  const style = computeShapeStyle(props, {
    fill: "var(--primary)",
    stroke: "var(--primary)",
    borderWidth: 1,
    radius: 999,
  });
  const fontSize = Number(val(props, "fontSize", 12));
  const fontWeight = Number(val(props, "fontWeight", 600));
  const fontFamily = props.fontFamily ? String(props.fontFamily) : "var(--font-mono)";
  const textAlign = String(val(props, "textAlign", "center"));
  const letterSpacing =
    props.letterSpacing !== undefined
      ? typeof props.letterSpacing === "number"
        ? `${props.letterSpacing}px`
        : String(props.letterSpacing)
      : "0.06em";
  const lineHeight = props.lineHeight ? `${props.lineHeight}px` : undefined;
  const italic = Boolean(props.italic);
  const underline = Boolean(props.underline);
  const strikethrough = Boolean(props.strikethrough);
  const textDecoration =
    underline && strikethrough
      ? "underline line-through"
      : underline
      ? "underline"
      : strikethrough
      ? "line-through"
      : undefined;

  const justifyClass =
    textAlign === "left"
      ? "justify-start"
      : textAlign === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <div
      className={cn("flex h-full w-full items-center px-4 select-none", justifyClass)}
      style={{
        ...style,
        color: hexToRgba(textColor, textOpacity),
        fontSize: `${fontSize}px`,
        fontWeight,
        fontFamily,
        letterSpacing,
        lineHeight,
        fontStyle: italic ? "italic" : undefined,
        textDecoration,
      }}
    >
      {!isEditing && <span className="truncate uppercase">{text}</span>}
    </div>
  );
}

function PlaceholderPreview({ props, isEditing }: { props: Props; isEditing?: boolean }) {
  const label = String(val(props, "label", "内容结构占位"));
  const fill = String(val(props, "fill", "var(--surface-raised)"));
  const stroke = String(val(props, "stroke", "var(--border-visible)"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const strokeStyle = String(val(props, "strokeStyle", "solid"));
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 0));
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden font-mono select-none"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px ${strokeStyle} ${stroke}` : "none",
        borderRadius: radius ? `${radius}px` : undefined,
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100%" y2="100%" stroke={strokeEnabled ? stroke : "#CCCCCC"} strokeWidth={strokeEnabled ? borderWidth : 1} />
        <line x1="0" y1="100%" x2="100%" y2="0" stroke={strokeEnabled ? stroke : "#CCCCCC"} strokeWidth={strokeEnabled ? borderWidth : 1} />
      </svg>
      {!isEditing && (
        <div className="relative rounded-xs border border-border-visible bg-surface px-2.5 py-1 text-[10px] font-mono font-medium text-foreground tracking-wider uppercase">
          [ {label} ]
        </div>
      )}
    </div>
  );
}

function TablePreview({ props, context }: { props: Props; context?: ComponentRenderContext }) {
  const headersStr = String(val(props, "headers", "编号,用户名称,所属部门,状态"));
  const rawHeaders = parseItems(headersStr, ["编号", "用户名称", "所属部门", "状态"]);
  const rows = Math.max(2, Number(val(props, "rows", 4)));
  const cols = Math.max(1, Math.max(rawHeaders.length, Number(val(props, "cols", 4))));
  const headerBg = typeof props.headerBg === "string" && props.headerBg.trim() ? props.headerBg : "";

  const headers = Array.from({ length: cols }, (_, i) => rawHeaders[i] || `列头 ${i + 1}`);
  const bodyRowCount = Math.max(1, rows - 1);

  // Parse colWidths
  const rawColWidthsStr = typeof props.colWidths === "string" ? props.colWidths : "";
  const parsedColWidths: number[] = rawColWidthsStr
    ? rawColWidthsStr.split(",").map((n) => Math.max(36, Number(n.trim()))).filter((n) => !isNaN(n))
    : [];

  const colWidths: number[] = Array.from({ length: cols }, (_, i) => {
    if (parsedColWidths[i] && parsedColWidths[i] >= 30) {
      return parsedColWidths[i];
    }
    if (i === 0) return 60;
    if (i === cols - 1) return 76;
    return 120;
  });

  const [localColWidths, setLocalColWidths] = useState<number[]>(colWidths);
  useEffect(() => {
    setLocalColWidths(colWidths);
  }, [rawColWidthsStr, cols]);

  // Parse custom cell matrix
  const defaultPreset = [
    ["01", "张三", "用户体验设计部", "正常"],
    ["02", "李四", "技术架构中台", "正常"],
    ["03", "王五", "数据智能平台", "离线"],
    ["04", "赵六", "核心研发团队", "正常"],
  ];

  let parsedCells: string[][] | null = null;
  if (typeof props.cells === "string" && props.cells.trim()) {
    try {
      const json = JSON.parse(props.cells);
      if (Array.isArray(json)) {
        parsedCells = json.map((r) => (Array.isArray(r) ? r.map(String) : []));
      }
    } catch {
      parsedCells = props.cells.split("\n").map((line) => line.split(/[,，]/).map((c) => c.trim()));
    }
  }

  const custom = parsedCells;
  const cellMatrix: string[][] = Array.from({ length: bodyRowCount }, (_, r) => {
    return Array.from({ length: cols }, (_, c) => {
      if (custom !== null) {
        return custom[r]?.[c] !== undefined ? custom[r][c] : "";
      }
      if (defaultPreset[r] && defaultPreset[r][c] !== undefined) {
        return defaultPreset[r][c];
      }
      return c === 0 ? String(r + 1).padStart(2, "0") : c === cols - 1 ? (r % 3 === 2 ? "离线" : "正常") : `数据项 ${r + 1}-${c}`;
    });
  });

  const [selectedCell, setSelectedCell] = useState<{ type: "header" | "data"; row?: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    type: "header" | "data";
    row?: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (!context?.isSelected) {
      setSelectedCell(null);
      if (editingCell) {
        commitEdit();
        setEditingCell(null);
      }
    }
  }, [context?.isSelected]);

  const commitEdit = (currentEditing = editingCell, valueToSave = editValue) => {
    if (!currentEditing) return;
    if (currentEditing.type === "header") {
      const newHeaders = [...headers];
      while (newHeaders.length < cols) {
        newHeaders.push(`列头 ${newHeaders.length + 1}`);
      }
      newHeaders[currentEditing.col] = valueToSave;
      context?.onUpdateProps?.({ headers: newHeaders.join(",") });
    } else if (currentEditing.type === "data" && currentEditing.row !== undefined) {
      const newMatrix = cellMatrix.map((r) => [...r]);
      if (!newMatrix[currentEditing.row]) {
        newMatrix[currentEditing.row] = [];
      }
      newMatrix[currentEditing.row][currentEditing.col] = valueToSave;
      context?.onUpdateProps?.({ cells: JSON.stringify(newMatrix) });
    }
  };

  const startEditing = (type: "header" | "data", col: number, row?: number, initialVal?: string) => {
    setEditingCell({ type, col, row });
    setEditValue(initialVal ?? "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      if (editingCell?.type === "header") {
        if (bodyRowCount > 0) {
          setEditingCell({ type: "data", row: 0, col: editingCell.col });
          setEditValue(cellMatrix[0]?.[editingCell.col] ?? "");
        } else {
          setEditingCell(null);
        }
      } else if (editingCell?.type === "data" && editingCell.row !== undefined) {
        const nextRow = editingCell.row + 1;
        if (nextRow < bodyRowCount) {
          setEditingCell({ type: "data", row: nextRow, col: editingCell.col });
          setEditValue(cellMatrix[nextRow]?.[editingCell.col] ?? "");
        } else {
          setEditingCell(null);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      if (!e.shiftKey) {
        if (editingCell?.type === "header") {
          const nextCol = editingCell.col + 1;
          if (nextCol < cols) {
            setEditingCell({ type: "header", col: nextCol });
            setEditValue(headers[nextCol] ?? "");
          } else if (bodyRowCount > 0) {
            setEditingCell({ type: "data", row: 0, col: 0 });
            setEditValue(cellMatrix[0]?.[0] ?? "");
          } else {
            setEditingCell(null);
          }
        } else if (editingCell?.type === "data" && editingCell.row !== undefined) {
          let nextRow = editingCell.row;
          let nextCol = editingCell.col + 1;
          if (nextCol >= cols) {
            nextRow += 1;
            nextCol = 0;
          }
          if (nextRow < bodyRowCount) {
            setEditingCell({ type: "data", row: nextRow, col: nextCol });
            setEditValue(cellMatrix[nextRow]?.[nextCol] ?? "");
          } else {
            setEditingCell(null);
          }
        }
      } else {
        if (editingCell?.type === "header") {
          const prevCol = editingCell.col - 1;
          if (prevCol >= 0) {
            setEditingCell({ type: "header", col: prevCol });
            setEditValue(headers[prevCol] ?? "");
          } else {
            setEditingCell(null);
          }
        } else if (editingCell?.type === "data" && editingCell.row !== undefined) {
          let prevRow = editingCell.row;
          let prevCol = editingCell.col - 1;
          if (prevCol < 0) {
            prevRow -= 1;
            prevCol = cols - 1;
          }
          if (prevRow >= 0) {
            setEditingCell({ type: "data", row: prevRow, col: prevCol });
            setEditValue(cellMatrix[prevRow]?.[prevCol] ?? "");
          } else {
            setEditingCell({ type: "header", col: cols - 1 });
            setEditValue(headers[cols - 1] ?? "");
          }
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  // Column Resizing Logic
  const handleStartColResize = (e: React.MouseEvent, colIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...localColWidths];
    const zoom = context?.zoom ?? 1;

    const handlePointerMove = (moveEv: PointerEvent) => {
      const delta = (moveEv.clientX - startX) / zoom;
      const newWidth = Math.max(36, Math.round(startWidths[colIndex] + delta));
      const nextWidths = [...startWidths];
      nextWidths[colIndex] = newWidth;
      setLocalColWidths(nextWidths);
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      const delta = (upEv.clientX - startX) / zoom;
      const newWidth = Math.max(36, Math.round(startWidths[colIndex] + delta));
      const nextWidths = [...startWidths];
      nextWidths[colIndex] = newWidth;
      setLocalColWidths(nextWidths);
      context?.onUpdateProps?.({ colWidths: nextWidths.join(",") });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="group/table relative flex h-full w-full flex-col overflow-hidden rounded-xs border border-border-visible bg-surface font-mono text-xs select-none">
      {/* Table Content Area with clean overflow handling */}
      <div className="flex-1 w-full overflow-hidden">
        <table className="w-full border-collapse table-fixed text-left font-mono">
          <colgroup>
            {localColWidths.map((w, i) => (
              <col key={i} style={{ width: `${w}px` }} />
            ))}
          </colgroup>

          {/* Table Header */}
          <thead>
            <tr
              className={cn(
                "border-b border-border-visible",
                !headerBg && "bg-surface-raised/60"
              )}
              style={headerBg ? { backgroundColor: headerBg } : undefined}
            >
              {headers.map((headerText, c) => {
                const isEditing = editingCell?.type === "header" && editingCell.col === c;
                const isSelected = Boolean(context?.isSelected) && selectedCell?.type === "header" && selectedCell.col === c;
                return (
                  <th
                    key={c}
                    style={{ width: `${localColWidths[c]}px` }}
                    className={cn(
                      "relative border-r border-border-visible p-0 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground last:border-r-0 transition-colors select-none",
                      isSelected && "ring-1 ring-inset ring-foreground bg-surface-raised text-foreground",
                      !isEditing && "hover:bg-surface-raised/80 hover:text-foreground cursor-pointer"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (context?.elementId && context?.onSelect) {
                        context.onSelect(context.elementId);
                      }
                      setSelectedCell({ type: "header", col: c });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startEditing("header", c, undefined, headerText);
                    }}
                  >
                    <div className="relative flex h-8 items-center px-2.5 min-w-0">
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            commitEdit();
                            setEditingCell(null);
                          }}
                          onKeyDown={handleKeyDown}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          className="h-6 w-full rounded-2xs border border-foreground bg-background px-1 font-mono text-[11px] font-medium uppercase tracking-wider text-foreground outline-none ring-1 ring-border-visible"
                        />
                      ) : (
                        <span className="truncate">{headerText}</span>
                      )}
                    </div>

                    {/* Column Divider Resizer */}
                    <div
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize z-20 group/resizer flex items-center justify-center -mr-1.5"
                      title="拖拽调节此列宽度"
                      onMouseDown={(e) => handleStartColResize(e, c)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <div className="h-full w-0.5 bg-transparent group-hover/resizer:bg-foreground transition-colors" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {cellMatrix.map((row, r) => (
              <tr
                key={r}
                className="border-b border-border/80 transition-colors bg-transparent"
              >
                {row.map((cellText, c) => {
                  const isEditing = editingCell?.type === "data" && editingCell.row === r && editingCell.col === c;
                  const isSelected = Boolean(context?.isSelected) && selectedCell?.type === "data" && selectedCell.row === r && selectedCell.col === c;
                  const isStatusCol = c === cols - 1 && (cellText === "正常" || cellText === "离线" || cellText === "待处理" || cellText === "运行中" || cellText === "Active" || cellText === "Offline");
                  const isSuccess = cellText === "正常" || cellText === "运行中" || cellText === "Active";
                  const isWarning = cellText === "待处理" || cellText === "排队中";
                  const isDanger = cellText === "离线" || cellText === "已停止" || cellText === "Offline";

                  return (
                    <td
                      key={c}
                      style={{ width: `${localColWidths[c]}px` }}
                      className={cn(
                        "relative border-r border-border p-0 font-mono text-xs text-foreground last:border-r-0 transition-colors select-none",
                        isSelected && "ring-1 ring-inset ring-foreground/80 bg-surface-raised/40",
                        !isEditing && "hover:bg-surface-raised/60 cursor-pointer"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (context?.elementId && context?.onSelect) {
                          context.onSelect(context.elementId);
                        }
                        setSelectedCell({ type: "data", row: r, col: c });
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startEditing("data", c, r, cellText);
                      }}
                    >
                      <div className="relative flex h-8 items-center px-2.5 min-w-0">
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              commitEdit();
                              setEditingCell(null);
                            }}
                            onKeyDown={handleKeyDown}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="h-6 w-full rounded-2xs border border-foreground bg-background px-1 font-mono text-xs text-foreground outline-none ring-1 ring-border-visible"
                          />
                        ) : isStatusCol ? (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-2xs px-1.5 py-0.5 font-mono text-[10px] font-medium border leading-none tracking-wide",
                              isSuccess && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
                              isWarning && "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5",
                              isDanger && "border-border-visible text-muted-foreground bg-surface-raised/40",
                              !isSuccess && !isWarning && !isDanger && "border-border-visible text-muted-foreground bg-surface-raised/40"
                            )}
                          >
                            {cellText}
                          </span>
                        ) : (
                          <span className="truncate">{cellText}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StickyNotePreview({ props }: { props: Props }) {
  const title = String(val(props, "title", "需求批注"));
  const text = String(val(props, "text", "此处记录业务逻辑说明与交互原型备注信息..."));
  const fill = String(val(props, "fill", "#FFFBEB"));
  const textColor = String(val(props, "textColor", "#78350F"));
  const stroke = String(val(props, "stroke", "#D97706"));
  const strokeEnabled = Boolean(props.strokeEnabled);
  const borderWidth = Number(val(props, "borderWidth", 1));
  return (
    <div
      className="relative flex h-full w-full flex-col p-3 overflow-hidden font-sans select-none"
      style={{
        backgroundColor: fill,
        color: textColor,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "1px solid rgba(0,0,0,0.06)",
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)",
      }}
    >
      <div
        className="absolute top-0 right-0 size-3.5 opacity-60"
        style={{
          background: "linear-gradient(135deg, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.08) 50%)",
        }}
      />
      <div className="mb-1.5 flex items-center gap-1 opacity-80 shrink-0 font-mono">
        <FileText aria-hidden="true" className="size-3" />
        <span className="text-[10px] font-bold tracking-wider uppercase truncate">[ {title} ]</span>
      </div>
      <p className="line-clamp-5 text-xs leading-relaxed whitespace-pre-wrap font-sans opacity-90">{text}</p>
    </div>
  );
}

function PinNotePreview({ props }: { props: Props }) {
  const index = String(val(props, "index", "1"));
  const fill = String(val(props, "fill", "#D71921"));
  const textColor = String(val(props, "textColor", "#FFFFFF"));
  return (
    <div className="flex h-full w-full items-center justify-center select-none">
      <div
        className="flex size-7 items-center justify-center rounded-full font-mono font-bold ring-2 ring-background shadow-xs select-none"
        style={{ backgroundColor: fill, color: textColor, fontSize: "11px" }}
      >
        {index}
      </div>
    </div>
  );
}

function ScrollPanelPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#FFFFFF"));
  const stroke = String(val(props, "stroke", "#CCCCCC"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 6));
  return (
    <div
      className="relative flex h-full w-full p-3 font-sans select-none"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "1px solid var(--border)",
        borderRadius: radius,
      }}
    >
      <div className="flex-1 overflow-hidden">
        <div className="space-y-2">
          <div className="h-3.5 w-3/4 rounded-xs bg-surface-raised border border-border" />
          <div className="h-2.5 w-full rounded-xs bg-surface-raised" />
          <div className="h-2.5 w-5/6 rounded-xs bg-surface-raised" />
          <div className="h-2.5 w-2/3 rounded-xs bg-surface-raised" />
        </div>
      </div>
      <div className="absolute top-1.5 right-1.5 bottom-1.5 w-1 rounded-full bg-border">
        <div className="h-8 w-full rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  );
}

function ModalDialogPreview({ props }: { props: Props }) {
  const title = String(val(props, "title", "操作提示浮层"));
  const text = String(val(props, "text", "这里是弹窗说明文本，用于关键确认或信息录入"));
  const confirmText = String(val(props, "confirmText", "确定"));
  const cancelText = String(val(props, "cancelText", "取消"));
  const fill = String(val(props, "fill", "#FFFFFF"));
  const stroke = String(val(props, "stroke", "#CCCCCC"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 8));
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden font-sans select-none"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "1px solid var(--border-visible)",
        borderRadius: radius,
      }}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5 font-mono">
        <span className="text-xs font-bold tracking-wider uppercase text-foreground truncate">[ {title} ]</span>
        <div className="flex size-5 items-center justify-center rounded-xs text-muted-foreground hover:bg-surface hover:text-foreground">
          <X aria-hidden="true" className="size-3.5" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-3 text-xs text-foreground/80">
        <p className="line-clamp-3 leading-relaxed">{text}</p>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-raised/40 px-4 py-2.5 font-mono">
        {cancelText && (
          <div className="rounded-full border border-border-visible bg-surface px-4 py-1 text-[10px] font-medium text-foreground tracking-wider uppercase">
            {cancelText}
          </div>
        )}
        {confirmText && (
          <div className="rounded-full bg-foreground px-4 py-1 text-[10px] font-semibold text-background tracking-wider uppercase">
            {confirmText}
          </div>
        )}
      </div>
    </div>
  );
}

function MindMapPreview({ props }: { props: Props }) {
  const rootTitle = String(val(props, "rootTitle", "中心核心主题"));
  const nodesStr = String(val(props, "nodes", "分支节点一,分支节点二,分支节点三"));
  const nodes = parseItems(nodesStr, ["分支节点一", "分支节点二", "分支节点三"]);

  return (
    <div className="flex h-full w-full items-center justify-center gap-4 rounded-lg border border-border-visible bg-surface p-3 overflow-hidden font-sans select-none">
      <div className="rounded-full border border-foreground bg-foreground text-background px-3 py-1.5 font-mono text-xs font-bold tracking-wider truncate max-w-[45%]">
        {rootTitle}
      </div>
      <div className="flex flex-col gap-2 border-l border-border-visible pl-3 min-w-0 flex-1">
        {nodes.map((node, i) => (
          <div key={`${node}-${i}`} className="rounded-full border border-border-visible bg-surface-raised px-3 py-1 font-mono text-[10px] text-foreground truncate">
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPreview({ props }: { props: Props }) {
  const title = String(val(props, "title", "产品需求规格文档"));
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface p-4 font-sans select-none">
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <BookOpen aria-hidden="true" className="size-4 text-foreground" />
        <span className="font-mono text-xs font-bold tracking-wider uppercase text-foreground truncate">[ {title} ]</span>
      </div>
      <div className="mt-3 space-y-2 text-[10px] text-muted-foreground">
        <div className="h-3 w-1/3 rounded-xs bg-surface-raised border border-border" />
        <div className="h-2.5 w-full rounded-xs bg-surface-raised" />
        <div className="h-2.5 w-5/6 rounded-xs bg-surface-raised" />
        <div className="h-2.5 w-4/6 rounded-xs bg-surface-raised" />
      </div>
    </div>
  );
}

function AiComponentPreview({ props }: { props: Props }) {
  const prompt = String(val(props, "prompt", "智能原型助手"));
  const hint = String(val(props, "hint", "输入自然语言提示词，自动推演生成交互原型"));
  const fill = String(val(props, "fill", ""));
  const stroke = String(val(props, "stroke", "#CCCCCC"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 8));
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center font-sans select-none",
        !fill && "bg-surface"
      )}
      style={{
        backgroundColor: fill || undefined,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "1px solid var(--border-visible)",
        borderRadius: radius,
      }}
    >
      <div className="flex size-7 items-center justify-center rounded-full border border-border-visible bg-surface-raised text-foreground">
        <Sparkles aria-hidden="true" className="size-3.5" />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground line-clamp-1">[ {prompt} ]</span>
      {hint && <span className="text-[10px] text-muted-foreground line-clamp-1">{hint}</span>}
    </div>
  );
}

function InputPreview({ props }: { props?: Props }) {
  const p = props || {};
  const label = String(val(p, "label", ""));
  const placeholder = String(val(p, "placeholder", "请输入内容..."));
  const style = computeShapeStyle(p, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 overflow-hidden font-sans select-none">
      {label && <span className="text-[11px] font-medium text-foreground/80 truncate shrink-0 leading-none py-0.5">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center px-3 text-xs text-muted-foreground shadow-xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={style}
      >
        <span className="truncate">{placeholder}</span>
      </div>
    </div>
  );
}

function TextareaPreview({ props }: { props?: Props }) {
  const p = props || {};
  const label = String(val(p, "label", ""));
  const placeholder = String(val(p, "placeholder", "请输入详细多行说明..."));
  const style = computeShapeStyle(p, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div className="flex h-full w-full flex-col gap-1 overflow-hidden font-sans select-none">
      {label && <span className="text-[11px] font-medium text-foreground/80 truncate shrink-0 leading-none py-0.5">{label}</span>}
      <div
        className="flex flex-1 min-h-0 p-2.5 text-xs text-muted-foreground shadow-xs"
        style={style}
      >
        <span className="truncate">{placeholder}</span>
      </div>
    </div>
  );
}

function SelectPreview({ props }: { props?: Props }) {
  const p = props || {};
  const label = String(val(p, "label", ""));
  const placeholder = String(val(p, "placeholder", "请选择..."));
  const style = computeShapeStyle(p, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div className="flex h-full w-full flex-col justify-between gap-1 overflow-hidden font-sans select-none">
      {label && <span className="text-[11px] font-medium text-foreground/80 truncate shrink-0 leading-none py-0.5">{label}</span>}
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 text-xs text-foreground shadow-xs min-h-0",
          label ? "flex-1 min-h-6" : "h-full"
        )}
        style={style}
      >
        <span className="truncate">{placeholder}</span>
        <ChevronsUpDown aria-hidden="true" className="size-3.5 text-muted-foreground shrink-0 ml-1" />
      </div>
    </div>
  );
}

function FileUploadPreview({ props }: { props?: Props }) {
  const p = props || {};
  const text = String(val(p, "text", "点击或将文件拖拽到这里上传"));
  const hint = String(val(p, "hint", "支持 png, jpg, pdf 格式"));
  const style = computeShapeStyle(p, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 border-dashed p-3 text-center font-sans select-none"
      style={style}
    >
      <Upload aria-hidden="true" className="size-5 text-muted-foreground" />
      <span className="text-xs font-medium text-foreground line-clamp-1">{text}</span>
      {hint && <span className="text-[10px] text-muted-foreground line-clamp-1">{hint}</span>}
    </div>
  );
}

function RadioPreview({ props }: { props?: Props }) {
  const p = props || {};
  const rawOptions = p.options ?? (p.option1 ? `${p.option1},${p.option2 || ""}` : "选项 A (已选),选项 B");
  const options = parseItems(rawOptions, ["选项 A (已选)", "选项 B"]);
  const selectedIndex = Number(val(p, "selectedIndex", 0));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 text-xs text-foreground py-1 font-sans select-none">
      {options.map((opt, i) => {
        const isChecked = i === selectedIndex;
        return (
          <div key={`${opt}-${i}`} className="flex items-center gap-2 min-w-0">
            <div className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${isChecked ? "border-foreground bg-surface-raised" : "border-border-visible bg-surface"}`}>
              {isChecked && <div className="size-2 rounded-full bg-foreground" />}
            </div>
            <span className={`truncate ${isChecked ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function CheckboxPreview({ props }: { props?: Props }) {
  const p = props || {};
  const rawOptions = p.options ?? (p.option1 ? `${p.option1},${p.option2 || ""}` : "我已阅读并同意条款,记住登录状态");
  const options = parseItems(rawOptions, ["我已阅读并同意条款", "记住登录状态"]);
  const checkedIndices = String(val(p, "checkedIndices", "0")).split(",").map((n) => Number(n.trim()));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 text-xs text-foreground py-1 font-sans select-none">
      {options.map((opt, i) => {
        const isChecked = checkedIndices.includes(i);
        return (
          <div key={`${opt}-${i}`} className="flex items-center gap-2 min-w-0">
            <div className={`flex size-4 shrink-0 items-center justify-center rounded border ${isChecked ? "border-foreground bg-foreground text-background" : "border-border-visible bg-surface"}`}>
              {isChecked && <Check aria-hidden="true" className="size-3 stroke-[3]" />}
            </div>
            <span className={`truncate ${isChecked ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{opt}</span>
          </div>
        );
      })}
    </div>
  );
}

function SwitchAndroidPreview({ props }: { props?: Props }) {
  const label = props ? String(val(props, "label", "开启通知")) : "开启通知";
  const checked = props ? (props.checked !== false && props.checked !== "false") : true;
  return (
    <div className="flex h-full w-full items-center justify-between px-2 text-xs text-foreground gap-2 font-sans select-none">
      <span className="truncate">{label}</span>
      <div className={`relative h-4 w-8 shrink-0 rounded-full border border-border-visible transition-colors ${checked ? "bg-surface-raised" : "bg-surface"}`}>
        <div className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full shadow-xs transition-all ${checked ? "right-0.5 bg-foreground" : "left-0.5 bg-muted-foreground"}`} />
      </div>
    </div>
  );
}

function SwitchIosPreview({ props }: { props?: Props }) {
  const label = props ? String(val(props, "label", "自动同步")) : "自动同步";
  const checked = props ? (props.checked !== false && props.checked !== "false") : true;
  return (
    <div className="flex h-full w-full items-center justify-between px-2 text-xs text-foreground gap-2 font-sans select-none">
      <span className="truncate">{label}</span>
      <div className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 border border-border-visible transition-colors ${checked ? "bg-foreground" : "bg-surface-raised"}`}>
        <div className={`size-4.5 rounded-full shadow-xs transition-all ${checked ? "translate-x-5 bg-background" : "translate-x-0 bg-foreground"}`} />
      </div>
    </div>
  );
}

function SliderPreview({ props }: { props?: Props }) {
  const value = props ? Number(val(props, "value", 65)) : 65;
  return (
    <div className="flex h-full w-full items-center px-2 font-sans select-none">
      <div className="relative h-1.5 w-full rounded-full bg-surface-raised border border-border">
        <div className="h-full rounded-full bg-foreground" style={{ width: `${value}%` }} />
        <div
          className="absolute top-1/2 size-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full border border-border-visible bg-surface shadow-xs"
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StepperPreview({ props }: { props?: Props }) {
  const value = props ? String(val(props, "value", "1")) : "1";
  return (
    <div className="flex h-full w-full items-center overflow-hidden rounded-md border border-border-visible bg-surface text-xs font-mono select-none">
      <div className="flex size-8 items-center justify-center border-r border-border bg-surface-raised text-foreground hover:bg-surface transition-colors cursor-default">
        <Minus aria-hidden="true" className="size-3" />
      </div>
      <div className="flex flex-1 items-center justify-center font-bold text-foreground">
        {value}
      </div>
      <div className="flex size-8 items-center justify-center border-l border-border bg-surface-raised text-foreground hover:bg-surface transition-colors cursor-default">
        <Plus aria-hidden="true" className="size-3" />
      </div>
    </div>
  );
}

function SearchPreview({ props }: { props?: Props }) {
  const p = props || {};
  const placeholder = String(val(p, "placeholder", "搜索关键词..."));
  const style = computeShapeStyle(p, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div
      className="flex h-full w-full items-center gap-2 px-3 text-xs text-muted-foreground shadow-xs font-sans select-none"
      style={style}
    >
      <Search aria-hidden="true" className="size-3.5 text-muted-foreground shrink-0" />
      <span className="truncate">{placeholder}</span>
    </div>
  );
}

function DropdownMenuPreview({ props }: { props?: Props }) {
  const p = props || {};
  const itemsStr = String(val(p, "items", "个人中心,账号设置,退出登录"));
  const items = parseItems(itemsStr, ["个人中心", "账号设置", "退出登录"]);
  const style = computeShapeStyle(p, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div className="flex h-full w-full flex-col overflow-hidden py-1 shadow-lg text-xs font-sans select-none" style={style}>
      {items.map((it, i) => (
        <div key={`${it}-${i}`} className="flex items-center px-3 py-1.5 text-foreground hover:bg-surface-raised truncate">
          {it}
        </div>
      ))}
    </div>
  );
}

function PopupMenuPreview({ props }: { props?: Props }) {
  const p = props || {};
  const title = String(val(p, "title", "更多操作"));
  const itemsStr = String(val(p, "items", "配置详情,分享项目,删除项目"));
  const items = parseItems(itemsStr, ["配置详情", "分享项目", "删除项目"]);
  const style = computeShapeStyle(p, { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 8 });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden shadow-xl text-xs font-sans select-none" style={style}>
      <div className="border-b border-border-visible bg-surface-raised px-3 py-2 font-semibold text-foreground truncate">
        {title}
      </div>
      <div className="p-1 space-y-0.5 overflow-y-auto">
        {items.map((it, i) => {
          const isDanger = it.includes("删除") || it.includes("销毁");
          return (
            <div
              key={`${it}-${i}`}
              className={`flex items-center gap-2 rounded px-2.5 py-1.5 truncate ${
                isDanger ? "text-[#D71921] hover:bg-[#D71921]/10 font-medium" : "text-foreground hover:bg-surface-raised"
              }`}
            >
              {isDanger ? (
                <Trash aria-hidden="true" className="size-3.5 shrink-0" />
              ) : (
                <Settings aria-hidden="true" className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{it}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepperNavPreview({ props }: { props?: Props }) {
  const p = props || {};
  const rawSteps = p.steps ?? (p.step1 ? `${p.step1},${p.step2 || ""},${p.step3 || ""}` : "填写信息,确认订单,完成");
  const steps = parseItems(rawSteps, ["填写信息", "确认订单", "完成"]);
  const currentStep = Number(val(p, "currentStep", 2));

  return (
    <div className="flex h-full w-full items-center justify-between px-4 text-xs">
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={`${s}-${i}`} className="flex items-center gap-2 min-w-0">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold ${
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                  ? "border border-foreground bg-surface-raised text-foreground font-bold"
                  : "border border-border-visible bg-surface text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="size-3 stroke-[3]" /> : stepNum}
            </div>
            <span className={`truncate font-medium ${isCurrent ? "text-foreground font-bold" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className="mx-2 h-0.5 w-8 shrink-0 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function MobileFramePreview({ props, children }: { props: Props; children?: React.ReactNode }) {
  const time = String(val(props, "time", "9:41"));
  const title = String(val(props, "title", "iPhone 16"));
  const fill = String(val(props, "fill", "var(--surface)"));
  const stroke = String(val(props, "stroke", "var(--border-visible)"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 44));
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden shadow-2xl"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "none",
        borderRadius: radius,
      }}
    >
      {/* Top Status Bar & Dynamic Island */}
      <div className="flex h-10 w-full shrink-0 items-center justify-between px-6 pt-1 select-none">
        <span className="font-mono text-[11px] font-bold text-foreground">{time}</span>
        <div className="h-4 w-20 rounded-full bg-foreground flex items-center justify-center">
          <span className="font-mono text-[8px] text-background truncate px-1">{title !== "iPhone 16" ? title : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-foreground">
          <span className="text-[10px] font-bold">5G</span>
          <div className="h-2.5 w-4 rounded-xs border border-border-visible bg-foreground" />
        </div>
      </div>
      {/* Viewport Content */}
      <div className="relative flex-1 overflow-hidden">
        {children}
      </div>
      {/* Bottom Home Indicator */}
      <div className="flex h-6 w-full shrink-0 items-center justify-center pb-1">
        <div className="h-1 w-28 rounded-full bg-foreground/40" />
      </div>
    </div>
  );
}

function BrowserFramePreview({ props, children }: { props: Props; children?: React.ReactNode }) {
  const url = String(val(props, "url", "https://wireframe.design/app"));
  const fill = String(val(props, "fill", "#FFFFFF"));
  const stroke = String(val(props, "stroke", "#E4E4E7"));
  const strokeEnabled = props.strokeEnabled !== false && props.strokeEnabled !== "false";
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 8));
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden shadow-xl"
      style={{
        backgroundColor: fill,
        border: strokeEnabled ? `${borderWidth}px solid ${stroke}` : "none",
        borderRadius: radius,
      }}
    >
      {/* Window Title Bar */}
      <div className="flex h-10 w-full shrink-0 items-center gap-3 border-b border-border bg-surface-raised px-3.5">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-border-visible" />
          <div className="size-2.5 rounded-full bg-border-visible" />
          <div className="size-2.5 rounded-full bg-border-visible" />
        </div>
        <div className="flex h-6 max-w-sm flex-1 items-center rounded-md border border-border-visible bg-background px-2.5 font-mono text-[10px] text-muted-foreground shadow-xs">
          <span className="truncate">{url}</span>
        </div>
      </div>
      {/* Viewport Content */}
      <div className="relative flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function DatePickerPreview({ props }: { props?: Props }) {
  const p = props || {};
  const placeholder = String(val(p, "placeholder", "2026-08-30"));
  const style = computeShapeStyle(p, { fill: "var(--background)", stroke: "var(--border-visible)", borderWidth: 1, radius: 6 });
  return (
    <div
      className="flex h-full w-full items-center justify-between px-3 text-xs text-foreground shadow-xs font-sans select-none"
      style={style}
    >
      <span>{placeholder}</span>
      <CalendarDays aria-hidden="true" className="size-3.5 text-muted-foreground shrink-0" />
    </div>
  );
}

function IconButtonPreview({ props }: { props?: Props }) {
  const p = props || {};
  const style = computeShapeStyle(p, {
    fill: "var(--surface)",
    stroke: "var(--border-visible)",
    borderWidth: 1,
    radius: 6,
  });
  return (
    <div className="flex h-full w-full items-center justify-center shadow-xs select-none" style={style}>
      <Plus aria-hidden="true" className="size-4 text-foreground" />
    </div>
  );
}

function getFlowchartNormalizedPath(type: ComponentType): string {
  switch (type) {
    case "flow-process":
      return "M 0 0 H 100 V 100 H 0 Z";
    case "flow-decision":
      return "M 50 0 L 100 50 L 50 100 L 0 50 Z";
    case "flow-start-end":
      return "M 25 0 H 75 A 25 50 0 0 1 75 100 H 25 A 25 50 0 0 1 25 0 Z";
    case "flow-document":
      return "M 0 0 H 100 V 82 Q 75 98 50 82 T 0 82 Z";
    case "flow-data":
      return "M 18 0 L 100 0 L 82 100 L 0 100 Z";
    case "flow-subprocess":
      return "M 0 0 H 100 V 100 H 0 Z";
    case "flow-external-data":
      return "M 0 0 H 85 A 15 50 0 0 1 85 100 H 0 A 15 50 0 0 0 0 0 Z";
    case "flow-internal-storage":
      return "M 0 0 H 100 V 100 H 0 Z";
    case "flow-queue":
      return "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z";
    case "flow-database":
      return "M 0 18 A 50 18 0 0 1 100 18 V 82 A 50 18 0 0 1 0 82 Z";
    case "flow-manual-input":
      return "M 0 20 L 100 0 L 100 100 L 0 100 Z";
    case "flow-card":
      return "M 16 0 L 100 0 L 100 100 L 0 100 L 0 16 Z";
    case "flow-tape":
      return "M 0 12 Q 25 0 50 12 T 100 12 V 88 Q 75 100 50 88 T 0 88 Z";
    case "flow-display":
      return "M 20 0 H 80 L 100 50 L 80 100 H 20 Q 0 50 20 0 Z";
    case "flow-manual-op":
      return "M 0 0 L 100 0 L 82 100 L 18 100 Z";
    case "flow-preparation":
      return "M 18 0 L 82 0 L 100 50 L 82 100 L 18 100 L 0 50 Z";
    case "flow-loop-limit":
      return "M 18 0 L 82 0 L 100 25 L 100 100 L 0 100 L 0 25 Z";
    default:
      return "M 0 0 H 100 V 100 H 0 Z";
  }
}

function FlowchartShapePreview({ type, props, isEditing }: { type: ComponentType; props: Props; isEditing?: boolean }) {
  const p = props || {};
  const fillEnabled = p.fillEnabled !== false && p.fillEnabled !== "false";
  const strokeEnabled = p.strokeEnabled !== false && p.strokeEnabled !== "false";
  const rawFill = String(val(p, "fill", "var(--surface)"));
  const fillOpacity = Number(p.fillOpacity ?? 100);
  const fill = fillEnabled ? (rawFill === "transparent" || rawFill === "none" ? "none" : hexToRgba(rawFill, fillOpacity)) : "none";

  const rawStroke = String(val(p, "stroke", "var(--border-visible)"));
  const strokeOpacity = Number(p.strokeOpacity ?? 100);
  const stroke = strokeEnabled ? hexToRgba(rawStroke, strokeOpacity) : "none";
  const borderWidth = Number(val(p, "borderWidth", 1.5));
  const strokeStyle = String(p.strokeStyle || "solid");
  const strokeDasharray = strokeStyle === "dashed" ? "5 4" : strokeStyle === "dotted" ? "2 3" : undefined;

  return (
    <div className="relative size-full overflow-hidden select-none">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={getFlowchartNormalizedPath(type)}
          fill={fill}
          stroke={stroke}
          strokeWidth={borderWidth}
          strokeDasharray={strokeDasharray}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {type === "flow-subprocess" && (
          <>
            <line x1="12" y1="0" x2="12" y2="100" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
            <line x1="88" y1="0" x2="88" y2="100" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
          </>
        )}
        {type === "flow-internal-storage" && (
          <>
            <line x1="0" y1="18" x2="100" y2="18" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
            <line x1="18" y1="0" x2="18" y2="100" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
          </>
        )}
        {type === "flow-database" && (
          <ellipse cx="50" cy="18" rx="50" ry="18" fill="none" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
        )}
        {type === "flow-queue" && (
          <line x1="50" y1="100" x2="100" y2="100" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
        )}
        {type === "flow-external-data" && (
          <path d="M 0 0 A 15 50 0 0 1 0 100" fill="none" stroke={stroke} strokeWidth={borderWidth} strokeDasharray={strokeDasharray} vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <ShapeTextRenderer props={p} isEditing={isEditing} />
    </div>
  );
}

function ConnectorPreview({ props }: { props: Props }) {
  const stroke = String(val(props, "stroke", "#71717A"));
  const strokeWidth = Number(val(props, "borderWidth", 1.5));
  const strokeStyle = String(props.strokeStyle || "solid");
  const strokeDasharray = strokeStyle === "dashed" ? "5 4" : strokeStyle === "dotted" ? "2 3" : undefined;
  const startArrow = String(props.startArrow || "none");
  const endArrow = String(props.endArrow || "arrow");
  const text = String(props.text || "");
  const routing = String(props.routing || "orthogonal");

  const d = routing === "straight"
    ? "M 10 70 L 150 10"
    : routing === "curved"
    ? "M 10 70 C 50 70, 110 10, 150 10"
    : "M 10 70 L 70 70 Q 80 70 80 60 L 80 20 Q 80 10 90 10 L 150 10";

  return (
    <div className="relative size-full overflow-visible">
      <svg className="size-full overflow-visible">
        <defs>
          <marker id="conn-lib-arrow-end" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 1 1 L 7 4 L 1 7 Z" fill={stroke} />
          </marker>
          <marker id="conn-lib-arrow-start" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
            <path d="M 7 1 L 1 4 L 7 7 Z" fill={stroke} />
          </marker>
          <marker id="conn-lib-circle" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="3" fill={stroke} />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          markerStart={startArrow === "arrow" ? "url(#conn-lib-arrow-start)" : startArrow === "circle" ? "url(#conn-lib-circle)" : undefined}
          markerEnd={endArrow === "arrow" ? "url(#conn-lib-arrow-end)" : endArrow === "circle" ? "url(#conn-lib-circle)" : undefined}
        />
      </svg>
      {text && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono font-medium text-foreground shadow-xs border border-border-visible">
          {text}
        </div>
      )}
    </div>
  );
}



