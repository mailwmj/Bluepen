export type ComponentType =
  | "navbar" | "sidebar" | "header" | "footer" | "hero"
  | "features" | "testimonials" | "cta" | "pricing" | "faq"
  | "stats" | "logos" | "team" | "contact" | "newsletter" | "blog-post" | "quote"
  | "login" | "register" | "dashboard" | "settings-page" | "profile-page"
  | "card" | "table" | "list" | "grid" | "timeline" | "kanban" | "calendar" | "stat" | "chart" | "empty-state"
  | "modal" | "alert" | "toast" | "drawer" | "sheet" | "popover" | "tooltip" | "dropdown" | "command"
  | "form" | "search" | "input" | "textarea" | "select" | "checkbox" | "radio"
  | "switch" | "slider" | "file-upload" | "date-picker" | "stepper" | "button" | "icon-button"
  | "avatar" | "avatar-group" | "badge" | "chip" | "breadcrumb" | "pagination" | "tabs"
  | "link" | "divider" | "progress" | "spinner" | "code-block" | "rating" | "image" | "video"
  | "frame" | "text" | "rectangle";

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
