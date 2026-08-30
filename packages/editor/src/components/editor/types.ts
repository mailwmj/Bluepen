export type ComponentType =
  // Basic Wireframe
  | "text" | "rectangle" | "circle" | "line" | "arrow" | "image" | "hotspot"
  | "button" | "button-primary" | "placeholder" | "table" | "sticky-note" | "pin-note"
  | "scroll-panel" | "modal-dialog" | "mind-map" | "document" | "code-block" | "ai-component"
  // Form Elements
  | "input" | "textarea" | "select" | "file-upload" | "radio" | "checkbox"
  | "switch-android" | "switch-ios" | "switch" | "slider" | "stepper" | "date-picker" | "search"
  // Navigation
  | "dropdown-menu" | "popup-menu" | "navbar" | "tabs" | "pagination" | "breadcrumb" | "stepper-nav"
  // Containers & Devices
  | "mobile-frame" | "browser-frame" | "card" | "sidebar" | "header" | "footer"
  // Display & Feedback
  | "badge" | "chip" | "avatar" | "avatar-group" | "alert" | "toast" | "tooltip"
  | "stat" | "progress" | "spinner" | "rating" | "divider" | "link" | "empty-state"
  // Sections & Data
  | "hero" | "features" | "testimonials" | "cta" | "pricing" | "faq"
  | "stats" | "logos" | "team" | "contact" | "newsletter" | "blog-post" | "quote"
  | "login" | "register" | "dashboard" | "settings-page" | "profile-page"
  | "list" | "grid" | "timeline" | "kanban" | "calendar" | "chart"
  | "modal" | "drawer" | "sheet" | "popover" | "dropdown" | "command"
  | "form" | "icon-button" | "video"
    // Flowchart & Connectors
  | "connector"
  | "flow-process" | "flow-decision" | "flow-start-end" | "flow-document" | "flow-data"
  | "flow-subprocess" | "flow-external-data" | "flow-internal-storage" | "flow-queue"
  | "flow-database" | "flow-manual-input" | "flow-card" | "flow-tape"
  | "flow-display" | "flow-manual-op" | "flow-preparation" | "flow-loop-limit"
  // Web Templates & Components (TDesign / Web System)
  // Web 导航
  | "web-dropdown" | "web-menu" | "web-top-nav" | "web-tabs" | "web-breadcrumb" | "web-pagination" | "web-steps"
  // Web 表单
  | "web-input" | "web-input-number" | "web-textarea" | "web-select" | "web-cascader" | "web-tree-select"
  | "web-auto-complete" | "web-tag-input" | "web-date-picker" | "web-date-range-picker" | "web-time-picker"
  | "web-radio-group" | "web-checkbox-group" | "web-switch" | "web-slider" | "web-transfer" | "web-upload" | "web-color-picker"
  // Web 数据展示
  | "web-table" | "web-tree" | "web-collapse" | "web-descriptions" | "web-statistic-card" | "web-tag" | "web-timeline" | "web-badge" | "web-avatar-group"
  // Web 消息反馈与浮层
  | "web-modal" | "web-drawer" | "web-alert" | "web-popconfirm" | "web-notification" | "web-tips" | "web-message" | "web-skeleton" | "web-empty-state"
  // Web 经典模版与业务区块 (Page Blocks)
  | "web-admin-layout" | "web-filter-bar" | "web-crud-table" | "web-form-layout" | "web-login-card" | "web-steps-form";

export type AnchorPort = "top" | "right" | "bottom" | "left" | "center";

export type AutoLayoutDirection = "vertical" | "horizontal";
export type AutoLayoutSize = "hug" | "fill" | "fixed";

export interface AutoLayout {
  direction: AutoLayoutDirection;
  gap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  horizontalAlign: "left" | "center" | "right" | "stretch";
  verticalAlign: "top" | "center" | "bottom" | "stretch";
  widthMode: AutoLayoutSize;
  heightMode: AutoLayoutSize;
}

export interface EditorElement {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  autoLayout: AutoLayout | null;
  children: EditorElement[];
  props: Record<string, string | number | boolean>;
  parentId: string | null;
}

export interface Page {
  id: string;
  name: string;
  elements: EditorElement[];
}

export interface Project {
  id: string;
  name: string;
  pages: Page[];
  currentPage: string;
}
