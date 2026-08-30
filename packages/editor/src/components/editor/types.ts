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
  | "flow-display" | "flow-manual-op" | "flow-preparation" | "flow-loop-limit";

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
