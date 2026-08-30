import type { ComponentType } from "../types";
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
} from "lucide-react";

type Props = Record<string, string | number | boolean>;
const val = (props: Props, key: string, fallback: string | number | boolean) =>
  props[key] ?? fallback;

export function renderLibraryComponent(
  type: ComponentType,
  props: Props,
  children?: React.ReactNode,
) {
  switch (type) {
    case "navbar": return <NavbarPreview />;
    case "sidebar": return <SidebarPreview />;
    case "header": return <HeaderPreview />;
    case "footer": return <FooterPreview />;
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
    case "card": return <CardPreview props={props} />;
    case "table": return <TablePreview />;
    case "list": return <ListPreview />;
    case "grid": return <GridPreview />;
    case "timeline": return <TimelinePreview />;
    case "kanban": return <KanbanPreview />;
    case "calendar": return <CalendarPreview />;
    case "stat": return <StatPreview />;
    case "chart": return <ChartPreview />;
    case "empty-state": return <EmptyStatePreview />;
    case "modal": return <ModalPreview />;
    case "alert": return <AlertPreview />;
    case "toast": return <ToastPreview />;
    case "drawer": return <DrawerPreview />;
    case "sheet": return <SheetPreview />;
    case "popover": return <PopoverPreview />;
    case "tooltip": return <TooltipPreview />;
    case "dropdown": return <DropdownPreview />;
    case "command": return <CommandPreview />;
    case "form": return <FormPreview />;
    case "search": return <SearchPreview />;
    case "input": return <InputPreview />;
    case "textarea": return <TextareaPreview />;
    case "select": return <SelectPreview />;
    case "checkbox": return <CheckboxPreview />;
    case "radio": return <RadioPreview />;
    case "switch": return <SwitchPreview />;
    case "slider": return <SliderPreview />;
    case "file-upload": return <FileUploadPreview />;
    case "date-picker": return <DatePickerPreview />;
    case "stepper": return <StepperPreview />;
    case "button": return <ButtonPreview props={props} />;
    case "icon-button": return <IconButtonPreview props={props} />;
    case "avatar": return <AvatarPreview />;
    case "avatar-group": return <AvatarGroupPreview />;
    case "badge": return <BadgePreview props={props} />;
    case "chip": return <ChipPreview props={props} />;
    case "breadcrumb": return <BreadcrumbPreview />;
    case "pagination": return <PaginationPreview />;
    case "tabs": return <TabsPreview />;
    case "link": return <LinkPreview />;
    case "divider": return <DividerPreview />;
    case "progress": return <ProgressPreview />;
    case "spinner": return <SpinnerPreview />;
    case "code-block": return <CodeBlockPreview />;
    case "rating": return <RatingPreview />;
    case "image": return <ImagePreview props={props} />;
    case "video": return <VideoPreview />;
    case "frame": return <FramePreview props={props}>{children}</FramePreview>;
    case "rectangle": return <RectanglePreview props={props} />;
    case "text": return <TextPreview props={props} />;
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

function NavbarPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between border-b border-neutral-200 bg-white px-5">
      <div className="flex min-w-0 items-center gap-6">
        <div className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="text-[11px] font-bold tracking-tight text-neutral-900">Logo</span>
        </div>
        <div className="flex min-w-0 items-center gap-4">
          {["Product", "Pricing", "Docs", "About"].map((l) => (
            <span key={l} className="shrink-0 text-[9px] font-medium text-neutral-500">{l}</span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SkeletonButton variant="ghost" label="Log in" />
        <SkeletonButton label="Sign up" className="px-3.5" />
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
    <div className="flex h-full w-full flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3.5">
        <Logo />
        <span className="text-[11px] font-bold tracking-tight text-neutral-900">Acme Inc</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-2.5">
        {items.map(({ icon, label, active }) => (
          <div key={label} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${active ? "bg-neutral-100" : ""}`}>
            <SkeletonIcon icon={icon} className={active ? "text-neutral-900" : "text-neutral-400"} />
            <span className={`text-[9px] font-medium ${active ? "font-semibold text-neutral-900" : "text-neutral-500"}`}>{label}</span>
            {active && <span className="ml-auto size-1.5 rounded-full bg-neutral-900" />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3">
        <SkeletonAvatar initials="JD" size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[9px] font-semibold text-neutral-800">Jane Doe</div>
          <div className="truncate text-[8px] text-neutral-400">jane@acme.com</div>
        </div>
        <SkeletonIcon icon={MoreHorizontal} />
      </div>
    </div>
  );
}

function HeaderPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between border-b border-neutral-200 bg-white px-5">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="text-[9px] text-neutral-400">Projects</span>
        <SkeletonIcon icon={ChevronRight} className="size-2.5 text-neutral-300" />
        <span className="truncate text-[11px] font-semibold text-neutral-900">Annual Report</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex size-7 items-center justify-center rounded-md border border-neutral-200 bg-white">
          <Search aria-hidden="true" className="size-3 text-neutral-400" />
        </div>
        <div className="flex size-7 items-center justify-center rounded-md border border-neutral-200 bg-white">
          <Bell aria-hidden="true" className="size-3 text-neutral-400" />
        </div>
        <SkeletonAvatar initials="JD" size="sm" />
      </div>
    </div>
  );
}

function FooterPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-neutral-50">
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
      <div className="flex items-center justify-between border-t border-neutral-200 px-10 py-3">
        <span className="text-[8px] text-neutral-400">© 2026 Acme Inc.</span>
        <div className="flex gap-3">
          <SkeletonIcon icon={Globe} className="size-3" />
          <SkeletonIcon icon={Megaphone} className="size-3" />
          <SkeletonIcon icon={ShoppingBag} className="size-3" />
        </div>
      </div>
    </div>
  );
}

function FramePreview({ props, children }: { props: Props; children?: React.ReactNode }) {
  const fill = String(val(props, "fill", "#FFFFFF"));
  const stroke = String(val(props, "stroke", "#E4E4E7"));
  const radius = Number(val(props, "radius", 8));
  const borderWidth = Number(val(props, "borderWidth", 1));
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        background: fill,
        border: `${borderWidth}px solid ${stroke}`,
        borderRadius: radius,
      }}
    >
      {children}
    </div>
  );
}

function TabsPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1.5">
      {["Overview", "Analytics", "Reports"].map((t, i) => (
        <div key={t} className={`flex h-6 flex-1 items-center justify-center rounded-md ${i === 0 ? "bg-white shadow-xs" : ""}`}>
          <span className={`text-[9px] font-medium ${i === 0 ? "text-neutral-900" : "text-neutral-400"}`}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function BreadcrumbPreview() {
  return (
    <div className="flex h-full w-full items-center gap-1.5 px-3">
      <span className="text-[9px] text-neutral-400">Home</span>
      <ChevronsRight aria-hidden="true" className="size-2.5 text-neutral-300" />
      <span className="text-[9px] text-neutral-400">Projects</span>
      <ChevronsRight aria-hidden="true" className="size-2.5 text-neutral-300" />
      <span className="text-[9px] font-semibold text-neutral-800">Wireframe</span>
    </div>
  );
}

function PaginationPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-1">
      <div className="flex size-6 items-center justify-center rounded-md border border-neutral-200 bg-white">
        <ChevronsRight aria-hidden="true" className="size-3 rotate-180 text-neutral-400" />
      </div>
      {["1", "2", "3", "…", "9"].map((n, i) => (
        <div key={n} className={`flex size-6 items-center justify-center rounded-md text-[9px] font-medium ${i === 1 ? "bg-neutral-900 text-white" : "text-neutral-500"}`}>
          {n}
        </div>
      ))}
      <div className="flex size-6 items-center justify-center rounded-md border border-neutral-200 bg-white">
        <ChevronsRight aria-hidden="true" className="size-3 text-neutral-400" />
      </div>
    </div>
  );
}

function DividerPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 px-4">
      <SkeletonLine className="flex-1" />
      <span className="text-[8px] text-neutral-400">OR</span>
      <SkeletonLine className="flex-1" />
    </div>
  );
}

function LinkPreview() {
  return (
    <div className="flex h-full w-full items-center gap-1 px-2">
      <LinkIcon aria-hidden="true" className="size-3 text-neutral-500" />
      <span className="text-[10px] font-medium text-neutral-700 underline underline-offset-2">Read the docs</span>
      <ArrowRight aria-hidden="true" className="size-2.5 text-neutral-400" />
    </div>
  );
}

/* ---------------- SECTIONS ---------------- */

function HeroPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-neutral-50 to-white px-10 text-center">
      <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 shadow-xs">
        <Sparkles aria-hidden="true" className="size-2.5 text-neutral-500" />
        <span className="text-[8px] font-semibold text-neutral-600">New: version 2.0</span>
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
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-white px-10 py-6">
      <SkeletonText variant="title" width="38%" className="h-4" />
      <SkeletonText variant="body" width="52%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {feats.map((f) => (
          <div key={f.title} className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 p-4 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-100">
              <f.icon aria-hidden="true" className="size-4 text-neutral-600" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-800">{f.title}</span>
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
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-neutral-50 px-10 py-5">
      <SkeletonText variant="heading" width="32%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {["AC", "LM", "RS"].map((ini) => (
          <div key={ini} className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4">
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
                <SkeletonText variant="caption" width="70%" className="bg-neutral-300" />
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
    <div className="flex h-full w-full flex-col items-center gap-4 overflow-y-auto bg-white px-10 py-6">
      <SkeletonText variant="title" width="30%" className="h-4" />
      <SkeletonText variant="body" width="45%" />
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        {plans.map((pl) => (
          <div key={pl.name} className={`flex flex-col gap-2 rounded-xl border p-4 ${pl.pop ? "border-neutral-900 bg-neutral-900 text-white shadow-lg" : "border-neutral-200"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-semibold ${pl.pop ? "text-white" : "text-neutral-700"}`}>{pl.name}</span>
              {pl.pop && <SkeletonChip label="Popular" tone="success" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold ${pl.pop ? "text-white" : "text-neutral-900"}`}>{pl.price}</span>
              <span className={`text-[8px] ${pl.pop ? "text-neutral-300" : "text-neutral-400"}`}>/month</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check aria-hidden="true" className={`size-2.5 ${pl.pop ? "text-emerald-400" : "text-emerald-500"}`} />
                <SkeletonText variant="caption" width={`${70 - i * 15}%`} className={pl.pop ? "bg-neutral-500" : ""} />
              </div>
            ))}
            <div className={`mt-auto flex h-6 items-center justify-center rounded-md text-[9px] font-semibold ${pl.pop ? "bg-white text-neutral-900" : "bg-neutral-100 text-neutral-700"}`}>
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
    <div className="grid h-full w-full grid-cols-4 gap-3 bg-white px-8 py-4">
      {stats.map((s) => (
        <div key={s.l} className="flex flex-col justify-center gap-1 rounded-xl border border-neutral-200 px-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-neutral-900">{s.v}</span>
            <SkeletonChip label={s.d} tone={s.d.startsWith("+") ? "success" : "danger"} />
          </div>
          <span className="text-[8px] text-neutral-400">{s.l}</span>
        </div>
      ))}
    </div>
  );
}

function LogosPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-white px-8">
      <span className="text-[8px] font-semibold uppercase tracking-widest text-neutral-400">Trusted by teams at</span>
      <div className="flex w-full items-center justify-between gap-4">
        {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map((c) => (
          <div key={c} className="flex items-center gap-1.5 opacity-70">
            <div className="size-4 rounded-[5px] bg-neutral-300" />
            <span className="text-[10px] font-bold tracking-tight text-neutral-500">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-white px-10 py-5">
      <SkeletonText variant="heading" width="28%" />
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3">
        {["AR", "GM", "AL", "KB"].map((ini) => (
          <div key={ini} className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 p-3">
            <SkeletonAvatar initials={ini} size="lg" className="size-10" />
            <SkeletonText variant="caption" width="70%" className="bg-neutral-300" />
            <span className="text-[7px] text-neutral-400">Product Designer</span>
            <div className="flex gap-1 pt-0.5">
              <div className="flex size-4 items-center justify-center rounded border border-neutral-200"><Globe aria-hidden="true" className="size-2 text-neutral-400" /></div>
              <div className="flex size-4 items-center justify-center rounded border border-neutral-200"><Mail aria-hidden="true" className="size-2 text-neutral-400" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPreview() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-6 overflow-y-auto bg-white px-10 py-6">
      <div className="flex flex-col gap-4">
        <SkeletonText variant="title" width="50%" className="h-4" />
        <SkeletonText variant="body" width="85%" />
        {[
          { icon: Mail, label: "hello@outlin.app" },
          { icon: Phone, label: "+1 (555) 013-2480" },
          { icon: MapPin, label: "San Francisco, CA" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-neutral-100">
              <r.icon aria-hidden="true" className="size-3 text-neutral-600" />
            </div>
            <span className="text-[9px] font-medium text-neutral-700">{r.label}</span>
          </div>
        ))}
        <div className="flex gap-2">
          {[Globe, Send, MessageCircle].map((I, i) => (
            <div key={i} className="flex size-7 items-center justify-center rounded-md border border-neutral-200">
              <I aria-hidden="true" className="size-3 text-neutral-500" />
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
        <div className="flex h-16 w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-[10px] text-neutral-400">Your message…</div>
        <SkeletonButton label="Send message" className="h-8" />
      </div>
    </div>
  );
}

function NewsletterPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-neutral-900 to-neutral-800 px-8">
      <SkeletonText variant="heading" width="40%" className="h-3.5 bg-neutral-400" />
      <SkeletonText variant="caption" width="55%" className="bg-neutral-500" />
      <div className="flex w-full max-w-70 gap-2">
        <div className="flex h-8 flex-1 items-center gap-1.5 rounded-md border border-neutral-600 bg-neutral-800 px-2.5">
          <Mail aria-hidden="true" className="size-3 text-neutral-400" />
          <span className="text-[9px] text-neutral-500">you@company.com</span>
        </div>
        <div className="flex h-8 items-center justify-center rounded-md bg-white px-4 text-[9px] font-semibold text-neutral-900">
          Subscribe <Send aria-hidden="true" className="ml-1 size-2.5" />
        </div>
      </div>
    </div>
  );
}

function BlogPostPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-white px-10 py-6">
      <div className="flex items-center gap-2">
        <SkeletonChip label="Design" tone="neutral" />
        <SkeletonChip label="Tutorial" tone="success" />
        <span className="text-[8px] text-neutral-400">· 8 min read</span>
      </div>
      <SkeletonText variant="title" width="80%" className="h-4" />
      <SkeletonText variant="title" width="55%" className="h-4" />
      <SkeletonText variant="body" width="65%" />
      <SkeletonImage className="h-28 w-full rounded-lg" />
      <SkeletonText variant="body" width="95%" />
      <SkeletonText variant="body" width="88%" />
      <SkeletonText variant="body" width="72%" />
      <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
        <SkeletonAvatar initials="AR" size="sm" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold text-neutral-800">Ada Lovelace</span>
          <span className="text-[8px] text-neutral-400">Staff Designer · Feb 2026</span>
        </div>
      </div>
    </div>
  );
}

function QuotePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-50 px-10">
      <QuoteIcon aria-hidden="true" className="size-6 text-neutral-300" />
      <SkeletonText variant="heading" width="75%" className="h-3.5" />
      <SkeletonText variant="heading" width="50%" className="h-3.5" />
      <div className="flex items-center gap-2">
        <SkeletonAvatar initials="JD" size="sm" />
        <SkeletonText variant="caption" width="70%" className="bg-neutral-300" />
      </div>
    </div>
  );
}

function CtaPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between gap-4 rounded-xl bg-neutral-900 px-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <SkeletonText variant="heading" width="65%" className="h-3.5 bg-neutral-400" />
        <SkeletonText variant="caption" width="45%" className="bg-neutral-500" />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="flex h-7 items-center justify-center rounded-md bg-white px-4 text-[9px] font-semibold text-neutral-900">
          Get started <ArrowRight aria-hidden="true" className="ml-1 size-2.5" />
        </div>
        <div className="flex h-7 items-center justify-center rounded-md border border-neutral-600 px-4 text-[9px] font-semibold text-neutral-200">
          Contact sales
        </div>
      </div>
    </div>
  );
}

/* ---------------- DATA ---------------- */

function CardPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#FFFFFF"));
  const radius = Number(val(props, "radius", 12));
  return (
    <div className="flex h-full w-full flex-col gap-2.5 border border-neutral-200 bg-white p-3" style={{ background: fill, borderRadius: radius }}>
      <SkeletonImage className="h-14 w-full rounded-md" />
      <div className="flex items-center gap-1.5">
        <SkeletonChip label="Pro" tone="success" />
        <span className="text-[9px] font-semibold text-neutral-800">Launch plan</span>
      </div>
      <SkeletonText variant="body" width="92%" />
      <SkeletonText variant="body" width="65%" />
      <div className="mt-auto flex items-center gap-2 pt-1">
        <SkeletonAvatar initials="AR" size="xs" />
        <SkeletonText variant="caption" width="30%" />
        <span className="ml-auto text-[8px] text-neutral-400">2d ago</span>
      </div>
    </div>
  );
}

function TablePreview() {
  const rows = [
    { name: "Acme Corp", status: "Active" as const, amount: "$12,400" },
    { name: "Globex Inc", status: "Pending" as const, amount: "$8,120" },
    { name: "Initech", status: "Active" as const, amount: "$5,990" },
    { name: "Umbrella Co", status: "Draft" as const, amount: "$1,240" },
  ];
  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3.5 py-2.5">
        <span className="text-[10px] font-semibold text-neutral-800">Customers</span>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-24 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2">
            <Search aria-hidden="true" className="size-2.5 text-neutral-400" />
            <span className="text-[8px] text-neutral-400">Search…</span>
          </div>
          <SkeletonButton label="Add" className="h-6 px-2.5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-neutral-200 bg-neutral-50 px-3.5 py-1.5">
        {["Company", "Status", "Amount"].map((h) => (
          <span key={h} className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">{h}</span>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {rows.map((r, i) => (
          <div key={r.name} className={`grid grid-cols-3 items-center gap-2 px-3.5 py-2 ${i !== rows.length - 1 ? "border-b border-neutral-100" : ""}`}>
            <span className="truncate text-[9px] font-medium text-neutral-800">{r.name}</span>
            <div>
              <SkeletonChip label={r.status} tone={r.status === "Active" ? "success" : r.status === "Pending" ? "warning" : "neutral"} />
            </div>
            <span className="text-[9px] font-semibold text-neutral-700">{r.amount}</span>
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
    <div className="flex h-full w-full flex-col rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3.5 py-2.5">
        <span className="text-[10px] font-semibold text-neutral-800">Activity</span>
        <SkeletonIcon icon={MoreHorizontal} className="size-3" />
      </div>
      <div className="min-h-0 flex-1 px-1.5 py-1">
        {items.map((it, i) => (
          <div key={it.name} className={`flex items-center gap-2.5 px-2 py-2 ${i !== items.length - 1 ? "border-b border-neutral-100" : ""}`}>
            <SkeletonAvatar initials={it.name.split(" ").map((w) => w[0]).join("")} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-[9px] font-semibold text-neutral-800">{it.name}</span>
                <span className="shrink-0 text-[8px] text-neutral-400">{it.time}</span>
              </div>
              <div className="truncate text-[8px] text-neutral-500">{it.note}</div>
            </div>
            <SkeletonIcon icon={ChevronRight} className="size-3 text-neutral-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GridPreview() {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-2.5 p-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white p-2">
          <SkeletonImage className="h-8 w-full rounded-md" />
          <SkeletonText variant="caption" width="70%" className="bg-neutral-300" />
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
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto bg-white px-5 py-4">
      <span className="text-[10px] font-semibold text-neutral-800">Milestones</span>
      <div className="min-h-0 flex-1">
        {items.map((it, i) => (
          <div key={it.t} className="relative flex gap-3 pb-4 last:pb-0">
            {i !== items.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-neutral-200" />}
            <span className={`relative mt-1 size-[11px] shrink-0 rounded-full border-2 ${it.done ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white"}`} />
            <div className="min-w-0">
              <span className={`block text-[9px] font-semibold ${it.done ? "text-neutral-800" : "text-neutral-400"}`}>{it.t}</span>
              <span className="text-[8px] text-neutral-400">{it.d}</span>
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
    <div className="flex h-full w-full gap-3 overflow-x-auto bg-neutral-100 p-3">
      {cols.map((c, ci) => (
        <div key={c.name} className="flex w-1/3 min-w-32 flex-col gap-2 rounded-lg bg-neutral-100 p-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-500">{c.name}</span>
            <span className="flex size-4 items-center justify-center rounded bg-neutral-200 text-[8px] font-semibold text-neutral-500">{c.cards.length}</span>
          </div>
          {c.cards.map((card) => (
            <div key={card} className="rounded-md border border-neutral-200 bg-white p-2.5 shadow-xs">
              <div className="text-[9px] font-medium text-neutral-800">{card}</div>
              <div className="mt-2 flex items-center gap-1">
                <SkeletonChip label={`${ci + 1} pts`} tone={ci === 0 ? "neutral" : ci === 1 ? "warning" : "success"} />
                <SkeletonAvatar initials="AR" size="xs" className="ml-auto" />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1 px-1 text-[8px] text-neutral-400">
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
    <div className="flex h-full w-full flex-col rounded-lg border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChevronsRight aria-hidden="true" className="size-3 rotate-180 text-neutral-400" />
          <span className="text-[10px] font-semibold text-neutral-800">March 2026</span>
          <ChevronsRight aria-hidden="true" className="size-3 text-neutral-400" />
        </div>
        <div className="flex size-5 items-center justify-center rounded-md border border-neutral-200">
          <Plus aria-hidden="true" className="size-2.5 text-neutral-500" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map((d, i) => (
          <span key={i} className="py-0.5 text-[7px] font-semibold text-neutral-400">{d}</span>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 2;
          const marked = marks.includes(day);
          return (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-md text-[8px] ${day < 1 || day > 31 ? "text-neutral-300" : day === 14 ? "bg-neutral-900 font-bold text-white" : "text-neutral-600"}`}>
              {day >= 1 && day <= 31 ? day : ""}
              {marked && <span className="absolute mb-6 size-1 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPreview() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <SkeletonIcon icon={CircleDollarSign} className="size-3.5 text-neutral-500" />
        <SkeletonChip label="+12.4%" tone="success" />
      </div>
      <span className="text-lg font-bold tracking-tight text-neutral-900">$48,290</span>
      <span className="text-[8px] text-neutral-400">Total revenue</span>
      <div className="mt-1 h-6">
        <SkeletonBars values={[30, 45, 38, 60, 52, 70, 64]} />
      </div>
    </div>
  );
}

function ChartPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-neutral-800">Monthly revenue</div>
          <div className="text-[8px] text-neutral-400">Jan — Mar 2026</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[8px] text-neutral-500"><span className="size-1.5 rounded-full bg-neutral-900" /> This year</span>
          <span className="flex items-center gap-1 text-[8px] text-neutral-400"><span className="size-1.5 rounded-full bg-neutral-200" /> Last year</span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex flex-col justify-between">
          {["$40k", "$30k", "$20k", "$10k", "$0"].map((l) => (
            <div key={l} className="flex items-center gap-2">
              <span className="w-6 text-right text-[7px] text-neutral-400">{l}</span>
              <SkeletonLine className="bg-neutral-100" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-end gap-1 pl-10">
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-sm bg-neutral-100"><div className="h-[60%] rounded-t-sm bg-neutral-300" /></div>
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-sm bg-neutral-100"><div className="h-[75%] rounded-t-sm bg-neutral-300" /></div>
          <div className="flex h-[72%] flex-1 flex-col justify-end rounded-t-sm bg-neutral-100"><div className="h-[48%] rounded-t-sm bg-neutral-900" /></div>
        </div>
      </div>
      <div className="flex justify-between px-2 pt-1">
        {["Jan", "Feb", "Mar"].map((m) => (
          <span key={m} className="text-[7px] text-neutral-400">{m}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyStatePreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
        <PackageOpen aria-hidden="true" className="size-5 text-neutral-400" />
      </div>
      <span className="text-[10px] font-semibold text-neutral-800">No projects yet</span>
      <SkeletonText variant="caption" width="70%" />
      <SkeletonButton label="Create project" className="mt-1" />
    </div>
  );
}

/* ---------------- OVERLAY ---------------- */

function ModalPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-neutral-900/30">
      <div className="flex h-[78%] w-[82%] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div>
            <div className="text-[10px] font-semibold text-neutral-800">Export project</div>
            <div className="text-[8px] text-neutral-400">Choose a format and options</div>
          </div>
          <div className="flex size-6 items-center justify-center rounded-md hover:bg-neutral-100">
            <X aria-hidden="true" className="size-3.5 text-neutral-400" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <SkeletonIcon icon={i === 0 ? ImageIcon : i === 1 ? Package : BarChart3} className="size-3.5 text-neutral-500" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-neutral-800">{["PNG — 2× export", "PDF — vector", "JSON — data"][i]}</span>
                  <span className="text-[8px] text-neutral-400">{["Retina quality", "Print ready", "Raw project"][i]}</span>
                </div>
              </div>
              <Check aria-hidden="true" className="size-3.5 text-emerald-500" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3">
          <SkeletonButton variant="secondary" label="Cancel" />
          <SkeletonButton label="Export" />
        </div>
      </div>
    </div>
  );
}

function AlertPreview() {
  return (
    <div className="flex h-full w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Megaphone aria-hidden="true" className="size-3.5 text-amber-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-amber-900">Storage almost full</span>
        </div>
        <div className="mt-0.5 truncate text-[8px] text-amber-700">
          You've used 92% of your 2 GB workspace quota.
        </div>
      </div>
      <button className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 text-[8px] font-semibold text-white">
        Upgrade
      </button>
    </div>
  );
}

function ToastPreview() {
  return (
    <div className="flex h-full w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 shadow-lg">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <Check aria-hidden="true" className="size-3.5 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold text-neutral-900">Project exported</div>
        <div className="mt-0.5 truncate text-[8px] text-neutral-500">landing-page.png · 1.2 MB</div>
      </div>
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <X aria-hidden="true" className="size-2.5 text-neutral-400" />
      </div>
    </div>
  );
}

function DrawerPreview() {
  return (
    <div className="relative flex h-full w-full justify-end bg-neutral-900/30">
      <div className="flex h-full w-[85%] flex-col border-l border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <span className="text-[10px] font-semibold text-neutral-800">Notifications</span>
          <X aria-hidden="true" className="size-3.5 text-neutral-400" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {["AR", "GM", "AL"].map((ini, i) => (
            <div key={ini} className="flex items-start gap-2.5 rounded-lg border border-neutral-100 p-2.5">
              <SkeletonAvatar initials={ini} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-[9px] font-semibold text-neutral-800">{["Ada commented", "Grace mentioned you", "Alan approved"][i]}</span>
                  <span className="shrink-0 text-[7px] text-neutral-400">2m</span>
                </div>
                <div className="truncate text-[8px] text-neutral-500">{["on the hero section", "in #general", "your wireframe"][i]}</div>
              </div>
              {i === 0 && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-orange-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SheetPreview() {
  return (
    <div className="relative flex h-full w-full items-end bg-neutral-900/30">
      <div className="flex h-[80%] w-full flex-col rounded-t-xl border border-b-0 border-neutral-200 bg-white">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-200" />
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[10px] font-semibold text-neutral-800">Share</span>
          <X aria-hidden="true" className="size-3.5 text-neutral-400" />
        </div>
        <div className="flex flex-1 gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50">
              <SkeletonIcon icon={i === 0 ? Mail : i === 1 ? LinkIcon : Send} className="size-4 text-neutral-600" />
              <span className="text-[8px] font-semibold text-neutral-700">{["Email", "Copy link", "Slack"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PopoverPreview() {
  return (
    <div className="relative flex h-full w-full items-start justify-center pt-6">
      <div className="flex w-[70%] flex-col rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2">
            <SkeletonAvatar initials="GM" size="sm" />
            <div>
              <div className="text-[9px] font-semibold text-neutral-800">Grace Hopper</div>
              <div className="text-[7px] text-neutral-400">Admin · online</div>
            </div>
          </div>
          <X aria-hidden="true" className="size-3 text-neutral-300" />
        </div>
        <div className="flex flex-col gap-2 py-2.5">
          <SkeletonText variant="body" width="90%" />
          <SkeletonText variant="body" width="60%" />
        </div>
        <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-2.5">
          <SkeletonButton label="Message" className="h-6 px-2.5" />
          <SkeletonButton variant="secondary" label="Profile" className="h-6 px-2.5" />
        </div>
      </div>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="relative flex h-full w-full items-start justify-center pt-4">
      <div className="relative">
        <div className="flex size-8 items-center justify-center rounded-md border border-neutral-200 bg-white">
          <Home aria-hidden="true" className="size-3.5 text-neutral-500" />
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1 text-[8px] font-medium text-white">
          Go to home
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-neutral-900" />
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
    <div className="relative flex h-full w-full justify-end pr-4 pt-4">
      <div className="flex w-[70%] flex-col gap-0.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
        {items.map((it) => (
          <div key={it.label} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${it.danger ? "text-rose-600" : "text-neutral-700"} hover:bg-neutral-100`}>
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
    <div className="flex h-full w-full items-start justify-center pt-5">
      <div className="flex w-[86%] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-3.5 py-2.5">
          <Search aria-hidden="true" className="size-3.5 text-neutral-400" />
          <span className="flex-1 text-[10px] text-neutral-500">Search or jump to…</span>
          <div className="rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 text-[7px] font-semibold text-neutral-400">ESC</div>
        </div>
        <div className="flex flex-col p-1.5">
          <span className="px-2.5 py-1 text-[7px] font-semibold uppercase tracking-widest text-neutral-400">Suggestions</span>
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 first-of-type:bg-neutral-100">
              <it.icon aria-hidden="true" className="size-3 text-neutral-500" />
              <span className="flex-1 text-[9px] font-medium text-neutral-700">{it.label}</span>
              <div className="rounded border border-neutral-200 bg-white px-1 py-0.5 text-[7px] font-semibold text-neutral-400">{it.k}</div>
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-white px-10">
      <div className="flex flex-col items-center gap-2">
        <Logo className="size-7 rounded-lg" />
        <SkeletonText variant="heading" width="70%" />
      </div>
      <div className="flex w-full max-w-55 flex-col gap-2.5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">{labels[i]}</span>
            <SkeletonInput
              icon={<SkeletonIcon icon={icons[i]} className="size-3" />}
              placeholder={i === 1 ? "you@company.com" : "••••••••"}
            />
          </div>
        ))}
        <SkeletonButton label={title} className="mt-1 h-8" />
        <div className="flex items-center gap-2 py-0.5">
          <SkeletonLine className="flex-1" />
          <span className="text-[8px] text-neutral-400">or</span>
          <SkeletonLine className="flex-1" />
        </div>
        <div className="flex gap-2">
          <div className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white text-[9px] font-medium text-neutral-600">
            <span className="size-2.5 rounded-full bg-neutral-300" /> Google
          </div>
          <div className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white text-[9px] font-medium text-neutral-600">
            <span className="size-2.5 rounded-full bg-neutral-900" /> GitHub
          </div>
        </div>
      </div>
      <span className="text-[8px] text-neutral-400">{title === "Sign in" ? "No account?" : "Have an account?"} <span className="font-semibold text-neutral-700">Click here</span></span>
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
    <div className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
      <div>
        <SkeletonText variant="heading" width="45%" />
        <SkeletonText variant="caption" width="70%" className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">First name</span>
          <SkeletonInput placeholder="Ada" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">Last name</span>
          <SkeletonInput placeholder="Lovelace" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">Email</span>
        <SkeletonInput icon={<SkeletonIcon icon={Mail} className="size-3" />} placeholder="ada@company.com" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">Project</span>
        <div className="flex h-8 items-center justify-between rounded-md border border-neutral-200 bg-white px-2.5">
          <span className="text-[10px] text-neutral-600">Wireframe kit</span>
          <SkeletonIcon icon={ChevronDown} className="size-3" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex size-3.5 items-center justify-center rounded-[4px] border border-neutral-300 bg-white">
          <Check aria-hidden="true" className="size-2 text-neutral-500" />
        </div>
        <span className="text-[8px] text-neutral-500">Send me product updates</span>
      </div>
      <SkeletonButton label="Submit" className="mt-auto h-8" />
    </div>
  );
}

function SearchPreview() {
  return (
    <div className="flex h-full w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 shadow-xs">
      <Search aria-hidden="true" className="size-3.5 shrink-0 text-neutral-400" />
      <span className="min-w-0 flex-1 truncate text-[10px] text-neutral-400">Search anything…</span>
      <div className="flex shrink-0 items-center gap-0.5 rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 text-[7px] font-semibold text-neutral-400">⌘K</div>
    </div>
  );
}

function InputPreview() {
  return (
    <div className="flex h-full w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3">
      <SkeletonIcon icon={Mail} className="size-3" />
      <span className="truncate text-[10px] text-neutral-400">you@company.com</span>
    </div>
  );
}

function TextareaPreview() {
  return (
    <div className="flex h-full w-full flex-col gap-1.5 rounded-md border border-neutral-200 bg-white p-2.5">
      <span className="text-[9px] text-neutral-400">Tell us about your project…</span>
      <SkeletonLine className="mt-1 bg-neutral-100" />
      <SkeletonLine className="bg-neutral-100" />
      <SkeletonLine className="w-2/3 bg-neutral-100" />
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[7px] text-neutral-300">0/500</span>
        <SkeletonIcon icon={AlignLeft} className="size-3 text-neutral-400" />
      </div>
    </div>
  );
}

function SelectPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3">
      <div className="flex flex-col">
        <span className="text-[7px] font-semibold uppercase tracking-wide text-neutral-400">Plan</span>
        <span className="text-[10px] font-medium text-neutral-800">Pro</span>
      </div>
      <ChevronsUpDown aria-hidden="true" className="size-3 text-neutral-400" />
    </div>
  );
}

function CheckboxPreview() {
  return (
    <div className="flex h-full w-full items-center gap-2 px-3">
      <div className="flex size-4 items-center justify-center rounded-[5px] border border-neutral-900 bg-neutral-900">
        <Check aria-hidden="true" className="size-2.5 text-white" />
      </div>
      <span className="text-[10px] text-neutral-700">Accept terms</span>
    </div>
  );
}

function RadioPreview() {
  const options = ["Starter", "Pro", "Enterprise"];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2.5 px-3">
      {options.map((o, i) => (
        <div key={o} className="flex items-center gap-2">
          <span className={`flex size-3.5 items-center justify-center rounded-full border ${i === 1 ? "border-neutral-900" : "border-neutral-300"}`}>
            {i === 1 && <span className="size-1.5 rounded-full bg-neutral-900" />}
          </span>
          <span className={`text-[10px] ${i === 1 ? "font-medium text-neutral-800" : "text-neutral-400"}`}>{o}</span>
        </div>
      ))}
    </div>
  );
}

function SwitchPreview() {
  return (
    <div className="flex h-full w-full items-center justify-between px-3">
      <span className="text-[10px] font-medium text-neutral-700">Dark mode</span>
      <div className="flex w-9 items-center rounded-full bg-neutral-900 p-0.5">
        <span className="ml-auto size-3.5 rounded-full bg-white shadow-xs" />
      </div>
    </div>
  );
}

function SliderPreview() {
  return (
    <div className="flex h-full w-full items-center gap-3 px-3">
      <span className="text-[9px] text-neutral-500">Volume</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-neutral-200">
        <div className="absolute inset-y-0 left-0 w-[65%] rounded-full bg-neutral-900" />
        <span className="absolute left-[65%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neutral-900 bg-white shadow-xs" />
      </div>
      <span className="w-6 text-right text-[9px] font-semibold text-neutral-700">65</span>
    </div>
  );
}

function FileUploadPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50">
      <div className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white">
        <Upload aria-hidden="true" className="size-4 text-neutral-500" />
      </div>
      <span className="text-[9px] font-semibold text-neutral-700">Drop files here</span>
      <span className="text-[8px] text-neutral-400">PNG, JPG or PDF · max 10 MB</span>
      <SkeletonButton variant="secondary" label="Browse files" className="mt-1 h-6 px-3" />
    </div>
  );
}

function DatePickerPreview() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ChevronsRight aria-hidden="true" className="size-3 rotate-180 text-neutral-400" />
          <span className="text-[9px] font-semibold text-neutral-800">March 2026</span>
          <ChevronsRight aria-hidden="true" className="size-3 text-neutral-400" />
        </div>
        <CalendarDays aria-hidden="true" className="size-3 text-neutral-400" />
      </div>
      <div className="grid flex-1 grid-cols-7 gap-0.5 p-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="py-0.5 text-center text-[7px] font-semibold text-neutral-400">{d}</span>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const day = i - 2;
          return (
            <div key={i} className={`flex aspect-square items-center justify-center rounded-md text-[8px] ${day < 1 || day > 31 ? "text-neutral-300" : day === 14 ? "bg-neutral-900 font-bold text-white" : "text-neutral-600"}`}>
              {day >= 1 && day <= 31 ? day : ""}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2">
        <SkeletonButton variant="ghost" label="Today" className="h-6 text-[8px]" />
        <SkeletonButton label="Apply" className="h-6 px-2.5" />
      </div>
    </div>
  );
}

function StepperPreview() {
  const steps = ["Design", "Build", "Review", "Ship"];
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-5">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${i <= 1 ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-400"}`}>
            {i <= 1 ? <Check aria-hidden="true" className="size-2.5" /> : i + 1}
          </div>
          <span className={`hidden shrink-0 text-[8px] font-medium sm:block ${i <= 1 ? "text-neutral-800" : "text-neutral-400"}`}>{s}</span>
          {i !== steps.length - 1 && <SkeletonLine className="flex-1 bg-neutral-200" />}
        </div>
      ))}
    </div>
  );
}

function ButtonPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#18181B"));
  const text = String(val(props, "text", "Button"));
  const textColor = String(val(props, "textColor", "#FFFFFF"));
  const radius = Number(val(props, "radius", 8));
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-1.5 text-[10px] font-semibold tracking-wide"
      style={{ background: fill, color: textColor, borderRadius: radius }}
    >
      {text} <ArrowRight aria-hidden="true" className="size-3" />
    </div>
  );
}

function IconButtonPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#FFFFFF"));
  const radius = Number(val(props, "radius", 8));
  return (
    <div className="flex h-full w-full items-center justify-center border border-neutral-200" style={{ background: fill, borderRadius: radius }}>
      <Plus aria-hidden="true" className="size-3.5 text-neutral-700" />
    </div>
  );
}

function AvatarPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SkeletonAvatar initials="AR" size="lg" className="size-full rounded-full" />
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
  const fill = String(val(props, "fill", "#18181B"));
  const text = String(val(props, "text", "New"));
  const textColor = String(val(props, "textColor", "#FFFFFF"));
  const radius = Number(val(props, "radius", 6));
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex h-[70%] max-h-7 min-h-4 items-center justify-center px-3 text-[10px] font-bold" style={{ background: fill, color: textColor, borderRadius: radius }}>
        {text}
      </div>
    </div>
  );
}

function ChipPreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#F4F4F5"));
  const text = String(val(props, "text", "Category"));
  const textColor = String(val(props, "textColor", "#3F3F46"));
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex h-[70%] max-h-7 min-h-4 items-center gap-1.5 rounded-full px-3 text-[10px] font-medium" style={{ background: fill, color: textColor }}>
        <Tag aria-hidden="true" className="size-2.5 opacity-70" />
        {text}
        <X aria-hidden="true" className="size-2.5 opacity-50" />
      </div>
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="flex h-full w-full items-center gap-3 px-3">
      <span className="text-[9px] text-neutral-500">Uploading</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full w-[72%] rounded-full bg-neutral-900" />
      </div>
      <span className="text-[9px] font-semibold text-neutral-600">72%</span>
    </div>
  );
}

function SpinnerPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
    </div>
  );
}

function CodeBlockPreview() {
  const lines = ["const app = new Outlin();", "app.setMode('wireframe');", "app.export('png', { scale: 2 });"];
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
        <span className="size-2 rounded-full bg-rose-400/80" />
        <span className="size-2 rounded-full bg-amber-400/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-[8px] text-neutral-500">app.ts</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3 font-mono">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-3 shrink-0 text-right text-[8px] text-neutral-700">{i + 1}</span>
            <span className="truncate text-[8.5px] text-neutral-300">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star key={s} aria-hidden="true" className={`size-4 ${s < 4 ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
        ))}
      </div>
      <span className="text-[9px] font-semibold text-neutral-600">4.8</span>
      <span className="text-[8px] text-neutral-400">(312)</span>
    </div>
  );
}

function ImagePreview({ props }: { props: Props }) {
  const radius = Number(val(props, "radius", 8));
  return (
    <SkeletonImage className="h-full w-full" />
  );
}

function VideoPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900">
      <div className="absolute inset-0 flex items-center justify-center">
        <Camera aria-hidden="true" className="size-6 text-neutral-600" />
      </div>
      <div className="relative flex h-10 w-14 items-center justify-center rounded-xl bg-white/90 shadow-lg">
        <Play aria-hidden="true" className="ml-0.5 size-4 fill-neutral-900 text-neutral-900" />
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[7px] font-semibold text-white">0:42</span>
      <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[7px] font-semibold text-white">
        <span className="size-1.5 rounded-full bg-rose-500" /> LIVE
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
    <div className="flex h-full w-full flex-col gap-3 bg-neutral-50 p-4">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold text-neutral-900">Overview</div>
          <div className="text-[8px] text-neutral-400">March 2026 · last 30 days</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-20 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2">
            <Search aria-hidden="true" className="size-2.5 text-neutral-400" />
            <span className="text-[8px] text-neutral-400">Search…</span>
          </div>
          <SkeletonAvatar initials="JD" size="sm" />
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <SkeletonIcon icon={s.icon} className="size-3 text-neutral-500" />
              <SkeletonChip label={s.delta} tone={s.up ? "success" : "danger"} />
            </div>
            <div className="mt-2 text-[12px] font-bold tracking-tight text-neutral-900">{s.value}</div>
            <div className="text-[8px] text-neutral-400">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
        <div className="col-span-3 flex flex-col rounded-lg border border-neutral-200 bg-white p-3">
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-[9px] font-semibold text-neutral-800">Revenue</span>
            <div className="flex items-center gap-1 text-[8px] text-emerald-600">
              <TrendingUp aria-hidden="true" className="size-2.5" />
              <span className="font-semibold">+12.4%</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 pt-2">
            <SkeletonBars values={[35, 48, 42, 58, 52, 66, 61, 74, 68, 82, 76, 88, 72, 80, 92]} />
          </div>
        </div>
        <div className="col-span-2 flex flex-col rounded-lg border border-neutral-200 bg-white p-3">
          <span className="shrink-0 text-[9px] font-semibold text-neutral-800">Top pages</span>
          <div className="mt-2 flex min-h-0 flex-1 flex-col justify-between">
            {[
              { label: "landing", value: "34%", w: "w-[86%]" },
              { label: "pricing", value: "22%", w: "w-[58%]" },
              { label: "docs", value: "15%", w: "w-[42%]" },
              { label: "blog", value: "9%", w: "w-[28%]" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-10 truncate text-[8px] text-neutral-500">{r.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className={`h-full rounded-full bg-neutral-300 ${r.w}`} />
                </div>
                <span className="w-7 text-right text-[8px] font-semibold text-neutral-600">{r.value}</span>
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
    <div className="flex h-full w-full bg-neutral-50">
      <div className="flex w-[30%] shrink-0 flex-col gap-0.5 border-r border-neutral-200 bg-white p-3">
        {sections.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${i === 0 ? "bg-neutral-100" : ""}`}>
            <Settings aria-hidden="true" className={`size-3 ${i === 0 ? "text-neutral-900" : "text-neutral-400"}`} />
            <span className={`text-[9px] ${i === 0 ? "font-semibold text-neutral-900" : "text-neutral-500"}`}>{s}</span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
        <div>
          <div className="text-[11px] font-semibold text-neutral-900">Profile</div>
          <div className="text-[8px] text-neutral-400">Update your personal information</div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonAvatar initials="JD" size="lg" />
          <div>
            <SkeletonButton variant="secondary" label="Change photo" className="h-6 px-2.5" />
            <div className="mt-1 text-[8px] text-neutral-400">JPG, PNG — max 2 MB</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">Name</span>
            <SkeletonInput placeholder="Jane Doe" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-semibold uppercase tracking-wide text-neutral-400">Email</span>
            <SkeletonInput icon={<SkeletonIcon icon={Mail} className="size-3" />} placeholder="jane@acme.com" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
          <div>
            <div className="text-[9px] font-semibold text-neutral-800">Two-factor auth</div>
            <div className="text-[8px] text-neutral-400">Protect your account with an extra layer</div>
          </div>
          <div className="flex w-9 items-center rounded-full bg-neutral-900 p-0.5">
            <span className="ml-auto size-3.5 rounded-full bg-white shadow-xs" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3">
          <SkeletonButton variant="secondary" label="Cancel" />
          <SkeletonButton label="Save changes" />
        </div>
      </div>
    </div>
  );
}

function ProfilePagePreview() {
  return (
    <div className="flex h-full w-full flex-col bg-neutral-50">
      <div className="relative h-[30%] shrink-0 bg-gradient-to-br from-neutral-900 to-neutral-600">
        <div className="absolute bottom-3 left-5 flex items-end gap-3">
          <SkeletonAvatar initials="JD" size="lg" className="size-14 rounded-xl ring-4 ring-white" />
          <div className="pb-1">
            <div className="text-[12px] font-bold text-white">Jane Doe</div>
            <div className="text-[8px] text-neutral-200">Product Designer · @janedoe</div>
          </div>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-y-auto p-4">
        <div className="col-span-2 flex flex-col gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <span className="text-[9px] font-semibold text-neutral-800">About</span>
            <SkeletonText variant="body" width="95%" className="mt-2" />
            <SkeletonText variant="body" width="80%" className="mt-1.5" />
          </div>
          <div className="flex-1 rounded-lg border border-neutral-200 bg-white p-4">
            <span className="text-[9px] font-semibold text-neutral-800">Recent activity</span>
            <div className="mt-2 flex flex-col gap-2">
              {["Commented on Landing page", "Approved Hero section", "Shared wireframe v3"].map((a, i) => (
                <div key={a} className="flex items-center gap-2">
                  <span className={`size-1.5 shrink-0 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-neutral-300"}`} />
                  <span className="truncate text-[8px] text-neutral-600">{a}</span>
                  <span className="ml-auto shrink-0 text-[7px] text-neutral-400">{["2h", "1d", "3d"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <span className="text-[9px] font-semibold text-neutral-800">Details</span>
            <div className="mt-2 flex flex-col gap-2">
              {[
                { icon: Mail, v: "jane@acme.com" },
                { icon: MapPin, v: "Buenos Aires" },
                { icon: CalendarDays, v: "Joined Jan 2024" },
              ].map((r) => (
                <div key={r.v} className="flex items-center gap-2">
                  <r.icon aria-hidden="true" className="size-3 text-neutral-400" />
                  <span className="truncate text-[8px] text-neutral-600">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold text-neutral-800">Projects</span>
              <span className="text-[8px] font-semibold text-neutral-400">12</span>
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
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-y-auto bg-white px-8 py-5">
      <SkeletonText variant="heading" width="38%" />
      <SkeletonText variant="caption" width="52%" />
      <div className="mt-1 flex w-full flex-col">
        {items.map((it, i) => (
          <div key={it.q} className={`flex flex-col gap-2 py-3 ${i !== items.length - 1 ? "border-b border-neutral-200" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[10px] font-medium text-neutral-800">{it.q}</span>
              <div className="flex size-4 shrink-0 items-center justify-center rounded border border-neutral-200">
                <Plus aria-hidden="true" className="size-2.5 text-neutral-500" />
              </div>
            </div>
            <SkeletonText variant="body" width={it.w} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RectanglePreview({ props }: { props: Props }) {
  const fill = String(val(props, "fill", "#F5F5F4"));
  const stroke = String(val(props, "stroke", "#D4D4D8"));
  const borderWidth = Number(val(props, "borderWidth", 1));
  const radius = Number(val(props, "radius", 8));
  return (
    <div
      className="h-full w-full"
      style={{
        background: fill,
        border: `${borderWidth}px solid ${stroke}`,
        borderRadius: radius,
      }}
    />
  );
}

function TextPreview({ props }: { props: Props }) {
  const text = String(val(props, "text", ""));
  if (text) {
    const color = String(val(props, "textColor", "#18181B"));
    const fontSize = Number(val(props, "fontSize", 16));
    const fontWeight = Number(val(props, "fontWeight", 400));
    const align = String(val(props, "align", "left"));
    return (
      <div
        className="flex h-full w-full items-center px-1"
        style={{ color, fontSize, fontWeight, textAlign: align as "left" | "center" | "right" }}
      >
        <span className="truncate">{text}</span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 overflow-hidden">
      <SkeletonText variant="heading" width="78%" />
      <SkeletonText variant="body" width="58%" />
      {[46, 34].map((w, i) => (
        <SkeletonText key={i} variant="body" width={`${w}%`} />
      ))}
    </div>
  );
}
