import type { ComponentType } from "../types";
import { baseLibrary } from "./base-components";
import { webLibrary } from "./web-components";
import { agentLibrary } from "./agent-components";

export type ComponentCategory =
  // 基础通用组件组 (Base Wireframe & Flow)
  | "基础图元"
  | "基础控件"
  | "流程图元"
  | "结构容器"
  // Web 业务组件组 (Web & SaaS Application)
  | "Web结构"
  | "Web表单"
  | "Web复合"
  | "Web展示与反馈"
  | "Web模版"
  // Agent 桌面客户端组 (Desktop Agent Client)
  | "Agent基础"
  | "Agent分子"
  | "Agent功能舱"
  | "Agent模版"
  // Legacy / 兼容旧分类
  | "基础"
  | "流程"
  | "Web导航"
  | "Web展示"
  | "Web反馈"
  | "Agent侧栏"
  | "Agent输入"
  | "Agent执行流"
  | "Agent角色与工件";

export interface LibraryComponent {
  type: ComponentType;
  label: string;
  category: ComponentCategory;
  icon: string;
  shortcut?: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps?: Record<string, string | number | boolean>;
}

export { baseLibrary, webLibrary, agentLibrary };

export const library: LibraryComponent[] = [
  ...agentLibrary,
  ...webLibrary,
  ...baseLibrary,
];
