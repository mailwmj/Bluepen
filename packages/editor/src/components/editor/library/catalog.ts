import { baseLibrary, webLibrary, agentLibrary, type LibraryComponent } from "./index";

export const libraryModes = {
  components: {
    label: "基础模式",
    items: baseLibrary,
    categories: ["基础图元", "基础控件", "流程图元", "结构容器"],
  },
  web: {
    label: "Web 模板",
    items: webLibrary,
    categories: ["Web模版", "Web导航", "Web表单", "Web展示", "Web反馈"],
  },
  agent: {
    label: "Agent 产品界面",
    items: agentLibrary,
    categories: ["Agent场景模版", "Agent框架容器", "Agent基础图元", "Agent结构与数据", "Agent核心交互"],
  },
};

export type LibraryMode = keyof typeof libraryModes;
export type LibraryTab = LibraryMode | "pages";

const normalize = (text: string) => text.normalize("NFKC").toLowerCase().replaceAll("模版", "模板").replaceAll("-", " ").trim();

export function searchLibrary(items: LibraryComponent[], query: string): LibraryComponent[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items.filter((item) => {
    const text = normalize(`${item.label} ${item.type} ${item.category}`);
    return terms.every((term) => text.includes(term));
  });
}

export function groupLibrary(items: LibraryComponent[], preferredOrder: string[]) {
  const groups = new Map<string, LibraryComponent[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  // Keep newly added categories discoverable without another hard-coded UI change.
  return [...new Set([...preferredOrder, ...groups.keys()])]
    .filter((category) => groups.has(category))
    .map((category) => ({ category, items: groups.get(category)! }));
}
