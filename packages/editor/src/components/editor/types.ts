export type ComponentType =
  // ================= 0. 组合容器 (Group) =================
  | "group"
  // ================= 1. 基础线框组件 (Basic Wireframe) =================
  | "text" | "rectangle" | "circle" | "line" | "arrow" | "image" | "hotspot"
  | "button" | "button-primary" | "placeholder" | "table" | "sticky-note" | "pin-note"
  | "scroll-panel" | "modal-dialog" | "mind-map" | "document" | "code-block" | "ai-component"
  | "mobile-frame" | "browser-frame"
  // ================= 2. 流程与连接线组件 (Flowchart & Connectors) =================
  | "connector"
  | "flow-process" | "flow-decision" | "flow-start-end" | "flow-document" | "flow-data"
  | "flow-subprocess" | "flow-external-data" | "flow-internal-storage" | "flow-queue"
  | "flow-database" | "flow-manual-input" | "flow-card" | "flow-tape"
  | "flow-display" | "flow-manual-op" | "flow-preparation" | "flow-loop-limit"
  // ================= 3. Web 模版与高级组件 (Web Templates & Components) =================
  // Web 导航
  | "web-dropdown" | "web-menu" | "web-top-nav" | "web-tabs" | "web-breadcrumb" | "web-pagination" | "web-steps"
  // Web 表单
  | "web-button" | "web-button-group" | "web-input" | "web-input-number" | "web-textarea" | "web-select"
  | "web-cascader" | "web-tree-select" | "web-auto-complete" | "web-tag-input"
  | "web-date-picker" | "web-date-range-picker" | "web-time-picker"
  | "web-radio-group" | "web-checkbox-group" | "web-switch" | "web-slider" | "web-transfer" | "web-upload" | "web-color-picker"
  // Web 数据展示
  | "web-table" | "web-descriptions" | "web-tree" | "web-collapse" | "web-statistic-card" | "web-tag" | "web-timeline" | "web-badge" | "web-avatar-group"
  | "web-card" | "web-chart" | "web-kanban" | "web-calendar"
  // Web 消息反馈与浮层
  | "web-modal" | "web-drawer" | "web-alert" | "web-popconfirm" | "web-notification" | "web-tips" | "web-message" | "web-skeleton" | "web-empty-state"
  // Web 页面与业务模版 (Page Blocks & Templates)
  | "web-admin-layout" | "web-filter-bar" | "web-crud-table" | "web-form-layout" | "web-login-card" | "web-steps-form"
  | "web-dashboard-page" | "web-settings-page" | "web-pricing-table" | "web-faq-section"
  // ================= 4. Agent 桌面客户端模版与组件 (Agent Desktop Templates & Components) =================
  // Agent 完整模版
  | "agent-home-layout" | "agent-chat-stream-layout" | "agent-split-workspace-layout" | "agent-employee-workspace-layout" | "agent-employee-market-layout"
  // Agent 侧栏与导航
  | "agent-nav-sidebar" | "agent-project-tree" | "agent-user-footer"
  // Agent 输入与参数
  | "agent-prompt-box" | "agent-prompt-toolbar" | "agent-prompt-suggestions"
  // Agent 执行流与消息
  | "agent-stream-header" | "agent-tool-step" | "agent-thought-stream" | "agent-file-attachments"
  // Agent 角色、工件与控制台
  | "agent-employee-card" | "agent-template-card" | "agent-artifact-tabs" | "agent-console-table"
  // Legacy / 兼容别名
  | "input" | "textarea" | "select" | "file-upload" | "radio" | "checkbox"
  | "switch-android" | "switch-ios" | "switch" | "slider" | "stepper" | "date-picker" | "search"
  | "dropdown-menu" | "popup-menu" | "navbar" | "tabs" | "pagination" | "breadcrumb" | "stepper-nav"
  | "card" | "sidebar" | "header" | "footer" | "badge" | "chip" | "avatar" | "avatar-group" | "alert" | "toast" | "tooltip"
  | "stat" | "progress" | "spinner" | "rating" | "divider" | "link" | "empty-state"
  | "hero" | "features" | "testimonials" | "cta" | "pricing" | "faq"
  | "stats" | "logos" | "team" | "contact" | "newsletter" | "blog-post" | "quote"
  | "login" | "register" | "dashboard" | "settings-page" | "profile-page"
  | "list" | "grid" | "timeline" | "kanban" | "calendar" | "chart"
  | "modal" | "drawer" | "sheet" | "popover" | "dropdown" | "command"
  | "form" | "icon-button" | "video";

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
