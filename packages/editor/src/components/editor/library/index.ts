import type { ComponentType } from "../types";

export interface LibraryComponent {
  type: ComponentType;
  label: string;
  category: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps?: Record<string, string | number | boolean>;
}

export const library: LibraryComponent[] = [
  // Layout
  { type: "navbar", label: "Navbar", category: "Layout", icon: "Menu", defaultWidth: 900, defaultHeight: 64 },
  { type: "sidebar", label: "Sidebar", category: "Layout", icon: "PanelLeft", defaultWidth: 240, defaultHeight: 600 },
  { type: "header", label: "Header", category: "Layout", icon: "Layout", defaultWidth: 600, defaultHeight: 48 },
  { type: "footer", label: "Footer", category: "Layout", icon: "Footer", defaultWidth: 900, defaultHeight: 200 },
  { type: "frame", label: "Frame", category: "Layout", icon: "Frame", defaultWidth: 800, defaultHeight: 600, defaultProps: { fill: "#FFFFFF", stroke: "#E4E4E7", radius: 8 } },
  { type: "tabs", label: "Tabs", category: "Layout", icon: "Tabs", defaultWidth: 360, defaultHeight: 40 },
  { type: "breadcrumb", label: "Breadcrumb", category: "Layout", icon: "Breadcrumb", defaultWidth: 320, defaultHeight: 32 },
  { type: "pagination", label: "Pagination", category: "Layout", icon: "ChevronsRight", defaultWidth: 300, defaultHeight: 36 },
  { type: "divider", label: "Divider", category: "Layout", icon: "Minus", defaultWidth: 400, defaultHeight: 16 },
  { type: "link", label: "Link", category: "Layout", icon: "Link", defaultWidth: 120, defaultHeight: 20 },

  // Sections
  { type: "hero", label: "Hero", category: "Sections", icon: "Shapes", defaultWidth: 900, defaultHeight: 400 },
  { type: "features", label: "Features", category: "Sections", icon: "Grid3X3", defaultWidth: 900, defaultHeight: 320 },
  { type: "testimonials", label: "Testimonials", category: "Sections", icon: "Quote", defaultWidth: 900, defaultHeight: 280 },
  { type: "pricing", label: "Pricing", category: "Sections", icon: "BadgeDollarSign", defaultWidth: 900, defaultHeight: 420 },
  { type: "faq", label: "FAQ", category: "Sections", icon: "HelpCircle", defaultWidth: 600, defaultHeight: 300 },
  { type: "stats", label: "Stats", category: "Sections", icon: "BarChart3", defaultWidth: 900, defaultHeight: 160 },
  { type: "logos", label: "Logo Cloud", category: "Sections", icon: "Landmark", defaultWidth: 600, defaultHeight: 120 },
  { type: "team", label: "Team", category: "Sections", icon: "Users", defaultWidth: 900, defaultHeight: 300 },
  { type: "contact", label: "Contact", category: "Sections", icon: "Mail", defaultWidth: 700, defaultHeight: 360 },
  { type: "newsletter", label: "Newsletter", category: "Sections", icon: "Send", defaultWidth: 700, defaultHeight: 160 },
  { type: "blog-post", label: "Blog Post", category: "Sections", icon: "FileText", defaultWidth: 700, defaultHeight: 500 },
  { type: "quote", label: "Quote", category: "Sections", icon: "Quote", defaultWidth: 600, defaultHeight: 160 },
  { type: "cta", label: "CTA", category: "Sections", icon: "Megaphone", defaultWidth: 700, defaultHeight: 160 },

  // Data
  { type: "dashboard", label: "Dashboard", category: "Data", icon: "LayoutDashboard", defaultWidth: 900, defaultHeight: 500 },
  { type: "card", label: "Card", category: "Data", icon: "Square", defaultWidth: 280, defaultHeight: 200, defaultProps: { fill: "#FFFFFF", radius: 12 } },
  { type: "table", label: "Table", category: "Data", icon: "Columns", defaultWidth: 600, defaultHeight: 300 },
  { type: "list", label: "List", category: "Data", icon: "List", defaultWidth: 400, defaultHeight: 240 },
  { type: "grid", label: "Grid", category: "Data", icon: "LayoutGrid", defaultWidth: 600, defaultHeight: 320 },
  { type: "timeline", label: "Timeline", category: "Data", icon: "GitCommitHorizontal", defaultWidth: 360, defaultHeight: 280 },
  { type: "kanban", label: "Kanban", category: "Data", icon: "Columns3", defaultWidth: 700, defaultHeight: 360 },
  { type: "calendar", label: "Calendar", category: "Data", icon: "Calendar", defaultWidth: 320, defaultHeight: 260 },
  { type: "stat", label: "Stat", category: "Data", icon: "TrendingUp", defaultWidth: 240, defaultHeight: 110 },
  { type: "chart", label: "Chart", category: "Data", icon: "AreaChart", defaultWidth: 400, defaultHeight: 240 },
  { type: "empty-state", label: "Empty State", category: "Data", icon: "PackageOpen", defaultWidth: 400, defaultHeight: 240 },

  // Input
  { type: "form", label: "Form", category: "Input", icon: "FileText", defaultWidth: 400, defaultHeight: 320 },
  { type: "search", label: "Search", category: "Input", icon: "Search", defaultWidth: 300, defaultHeight: 48 },
  { type: "input", label: "Input", category: "Input", icon: "Type", defaultWidth: 240, defaultHeight: 40 },
  { type: "textarea", label: "Textarea", category: "Input", icon: "AlignLeft", defaultWidth: 300, defaultHeight: 100 },
  { type: "select", label: "Select", category: "Input", icon: "ChevronsUpDown", defaultWidth: 220, defaultHeight: 40 },
  { type: "checkbox", label: "Checkbox", category: "Input", icon: "CheckSquare", defaultWidth: 180, defaultHeight: 28 },
  { type: "radio", label: "Radio Group", category: "Input", icon: "CircleDot", defaultWidth: 220, defaultHeight: 90 },
  { type: "switch", label: "Switch", category: "Input", icon: "ToggleLeft", defaultWidth: 200, defaultHeight: 28 },
  { type: "slider", label: "Slider", category: "Input", icon: "SlidersHorizontal", defaultWidth: 280, defaultHeight: 40 },
  { type: "file-upload", label: "File Upload", category: "Input", icon: "Upload", defaultWidth: 300, defaultHeight: 120 },
  { type: "date-picker", label: "Date Picker", category: "Input", icon: "CalendarDays", defaultWidth: 280, defaultHeight: 340 },
  { type: "stepper", label: "Stepper", category: "Input", icon: "ListOrdered", defaultWidth: 500, defaultHeight: 60 },
  { type: "button", label: "Button", category: "Input", icon: "MousePointerClick", defaultWidth: 100, defaultHeight: 40, defaultProps: { fill: "#18181B", text: "Button", textColor: "#FFFFFF", radius: 8 } },
  { type: "icon-button", label: "Icon Button", category: "Input", icon: "MousePointer2", defaultWidth: 40, defaultHeight: 40, defaultProps: { fill: "#FFFFFF" } },

  // Overlay
  { type: "modal", label: "Modal", category: "Overlay", icon: "Maximize2", defaultWidth: 480, defaultHeight: 320 },
  { type: "alert", label: "Alert", category: "Overlay", icon: "AlertTriangle", defaultWidth: 400, defaultHeight: 120 },
  { type: "toast", label: "Toast", category: "Overlay", icon: "Bell", defaultWidth: 360, defaultHeight: 64 },
  { type: "drawer", label: "Drawer", category: "Overlay", icon: "PanelRightOpen", defaultWidth: 320, defaultHeight: 600 },
  { type: "sheet", label: "Sheet", category: "Overlay", icon: "PanelBottomOpen", defaultWidth: 600, defaultHeight: 300 },
  { type: "popover", label: "Popover", category: "Overlay", icon: "MessagesSquare", defaultWidth: 240, defaultHeight: 180 },
  { type: "tooltip", label: "Tooltip", category: "Overlay", icon: "MessageCircle", defaultWidth: 160, defaultHeight: 48 },
  { type: "dropdown", label: "Dropdown", category: "Overlay", icon: "ChevronDown", defaultWidth: 200, defaultHeight: 220 },
  { type: "command", label: "Command Palette", category: "Overlay", icon: "Command", defaultWidth: 480, defaultHeight: 300 },

  // Basic
  { type: "text", label: "Text", category: "Basic", icon: "Type", defaultWidth: 200, defaultHeight: 24, defaultProps: { text: "Text", textColor: "#18181B", fontSize: 16, fontWeight: 400 } },
  { type: "rectangle", label: "Rectangle", category: "Basic", icon: "Square", defaultWidth: 200, defaultHeight: 120, defaultProps: { fill: "#F5F5F4", stroke: "#D4D4D8", radius: 8 } },
  { type: "image", label: "Image", category: "Basic", icon: "Image", defaultWidth: 300, defaultHeight: 200, defaultProps: { radius: 8 } },
  { type: "video", label: "Video", category: "Basic", icon: "Video", defaultWidth: 400, defaultHeight: 240 },
  { type: "avatar", label: "Avatar", category: "Basic", icon: "User", defaultWidth: 40, defaultHeight: 40 },
  { type: "avatar-group", label: "Avatar Group", category: "Basic", icon: "Users", defaultWidth: 120, defaultHeight: 40 },
  { type: "badge", label: "Badge", category: "Basic", icon: "Badge", defaultWidth: 80, defaultHeight: 28, defaultProps: { fill: "#18181B", text: "New", textColor: "#FFFFFF", radius: 6 } },
  { type: "chip", label: "Chip", category: "Basic", icon: "Tag", defaultWidth: 120, defaultHeight: 28, defaultProps: { fill: "#F4F4F5", text: "Category", textColor: "#3F3F46", radius: 999 } },
  { type: "progress", label: "Progress", category: "Basic", icon: "Gauge", defaultWidth: 280, defaultHeight: 12 },
  { type: "spinner", label: "Spinner", category: "Basic", icon: "Loader", defaultWidth: 40, defaultHeight: 40 },
  { type: "code-block", label: "Code Block", category: "Basic", icon: "Braces", defaultWidth: 400, defaultHeight: 180 },
  { type: "rating", label: "Rating", category: "Basic", icon: "Star", defaultWidth: 140, defaultHeight: 32 },
];
