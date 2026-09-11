import type { ComponentType, EditorElement } from "../types";
import { library } from "../library";
import { createBlockTemplateGroup, isBlockTemplate } from '../library/block-templates';

export const artifactKinds = ["page", "section", "component"] as const;
export type ArtifactKind = (typeof artifactKinds)[number];

export interface PrototypePlanNode {
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, string | number | boolean>;
  children?: PrototypePlanNode[];
}

export interface PrototypePlan {
  artifactKind: ArtifactKind;
  pageName: string;
  purpose: string;
  notes: string[];
  root: PrototypePlanNode;
}

const knownTypes = new Set<ComponentType | "group">(["group", ...library.map((item) => item.type)]);

export function validatePrototypePlan(plan: PrototypePlan): string[] {
  const errors: string[] = [];
  if (!artifactKinds.includes(plan?.artifactKind)) errors.push("产物类型无效");
  if (!plan || typeof plan.pageName !== "string" || !plan.pageName.trim()) errors.push("缺少页面名称");
  if (!plan?.root) return [...errors, "缺少页面结构"];
  const walk = (node: PrototypePlanNode, path: string) => {
    if (!knownTypes.has(node.type)) errors.push(`${path}: 未知组件 ${node.type}`);
    for (const key of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(node[key as keyof PrototypePlanNode] as number)) errors.push(`${path}: ${key} 无效`);
    }
    if (node.width <= 0 || node.height <= 0) errors.push(`${path}: 尺寸必须大于 0`);
    (node.children ?? []).forEach((child, index) => walk(child, `${path}.${index}`));
  };
  walk(plan.root, "root");
  return errors;
}

const PAGE_BACKGROUND_NAME = "页面底板";
const pageBackgroundName = /^(页面|画布).*(底板|背景|底色)$/;

function isPageBackground(node: PrototypePlanNode) {
  return node.type === "rectangle" && pageBackgroundName.test(node.name.trim());
}

/** Page backgrounds are structural, so their presence and bounds cannot depend on model output. */
export function normalizeArtifactBackground(plan: PrototypePlan): PrototypePlan {
  const children = plan.root.children ?? [];
  if (plan.artifactKind !== "page") {
    const localChildren = children.filter((node) => !isPageBackground(node));
    return localChildren.length === children.length
      ? plan
      : { ...plan, root: { ...plan.root, children: localChildren } };
  }

  const rectangleDefaults = library.find((item) => item.type === "rectangle")?.defaultProps ?? {};
  const existing = children.find(isPageBackground);
  const background: PrototypePlanNode = {
    type: "rectangle",
    name: PAGE_BACKGROUND_NAME,
    x: 0,
    y: 0,
    width: plan.root.width,
    height: plan.root.height,
    props: existing
      ? { ...rectangleDefaults, ...(existing.props ?? {}), radius: 0, fillEnabled: true }
      : { ...rectangleDefaults, fill: "var(--surface)", radius: 0, fillEnabled: true },
    children: [],
  };

  return {
    ...plan,
    root: {
      ...plan.root,
      children: [background, ...children.filter((node) => !isPageBackground(node))],
    },
  };
}

function makeId() {
  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function planToElement(plan: PrototypePlan, anchorX: number, anchorY: number): EditorElement {
  const convert = (node: PrototypePlanNode, parentId: string | null): EditorElement => {
    if (isBlockTemplate(node.type)) {
      const template = createBlockTemplateGroup(node.type, anchorX + node.x, anchorY + node.y, parentId);
      if (template) {
        const sx = node.width / template.width, sy = node.height / template.height;
        const scale = (el: EditorElement): EditorElement => ({ ...el, x: el.x * sx, y: el.y * sy, width: el.width * sx, height: el.height * sy, children: el.children.map(scale) });
        return { ...template, name: node.name, width: node.width, height: node.height, children: template.children.map(scale) };
      }
    }
    const id = makeId();
    return {
      id,
      type: node.type,
      name: node.name,
      x: Math.round(anchorX + node.x),
      y: Math.round(anchorY + node.y),
      width: Math.round(node.width),
      height: Math.round(node.height),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      autoLayout: null,
      children: (node.children ?? []).map((child) => ({ ...convert(child, id), x: child.x, y: child.y })),
      props: node.props ?? {},
      parentId,
    };
  };
  return convert(normalizeArtifactBackground(plan).root, null);
}

/** Deterministic offline starter plan used until a BYOK provider is configured. */
export function starterPlan(prompt: string): PrototypePlan {
  const title = prompt.trim() || "灵感模板页面";
  return {
    artifactKind: "page",
    pageName: title.slice(0, 32),
    purpose: title,
    notes: ["静态原型：将交互需求以可见控件表达"],
    root: {
      type: "group", name: "AI 生成页面", x: 0, y: 0, width: 1120, height: 760,
      props: { generatedBy: "bluepen-agent", prompt: title },
      children: [
        { type: "rectangle", name: "页面底板", x: 0, y: 0, width: 1120, height: 760, props: { fill: "var(--surface)", stroke: "var(--border-visible)", borderWidth: 1, radius: 12 } },
        { type: "text", name: "页面标题", x: 40, y: 36, width: 520, height: 42, props: { text: title, fontSize: 28, fontWeight: 600 } },
        { type: "web-input", name: "搜索", x: 40, y: 100, width: 320, height: 40, props: { placeholder: "搜索模板" } },
        { type: "web-tabs", name: "分类筛选", x: 390, y: 100, width: 560, height: 40, props: { items: "全部,网页,移动端,仪表盘", active: "全部" } },
        { type: "web-card", name: "模板卡片一", x: 40, y: 180, width: 320, height: 240, props: { title: "横向模板", subtitle: "16:9 灵感模板", showActions: true } },
        { type: "web-card", name: "模板卡片二", x: 400, y: 180, width: 320, height: 300, props: { title: "竖向模板", subtitle: "2:3 灵感模板", showActions: true } },
        { type: "web-card", name: "模板卡片三", x: 760, y: 180, width: 320, height: 320, props: { title: "方形模板", subtitle: "1:1 灵感模板", showActions: true } },
        { type: "text", name: "静态交互说明", x: 40, y: 680, width: 900, height: 24, props: { text: "操作按钮已直接展示，用于表达 Hover 后的操作意图", fontSize: 12 } },
      ],
    },
  };
}
