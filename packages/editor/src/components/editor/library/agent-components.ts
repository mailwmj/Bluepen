import type { ComponentType } from "../types";
import type { LibraryComponent } from "./index";

export const agentLibrary: LibraryComponent[] = [
  // =========================================================================
  // 1. Agent 完整模版 (Full Layout & Block Templates)
  // =========================================================================
  {
    type: "agent-home-layout",
    label: "Agent对话主页",
    category: "Agent模版",
    icon: "Bot",
    defaultWidth: 1080,
    defaultHeight: 680,
    defaultProps: {
      appName: "AGENT DESKTOP",
      activeTab: "chat",
      welcomeTitle: "Hi, 有什么可以帮你？",
      promptPlaceholder: "有什么问题请问我吧，输入 / 可调用技能",
      projectName: "Project-A",
      modelName: "高级推理模型",
    },
  },
  {
    type: "agent-chat-stream-layout",
    label: "Agent执行流会话页",
    category: "Agent模版",
    icon: "MessageSquare",
    defaultWidth: 1080,
    defaultHeight: 680,
    defaultProps: {
      appName: "AGENT DESKTOP",
      sessionTitle: "营销活动月度复盘分析报告",
      userPrompt: "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。",
      agentName: "ClawHive 总管",
      consumedPoints: "21",
      elapsedTime: "2m 39s",
      thinkingText: "我会先判断资料类型和完整性，把会议纪要、任务清单和补充说明分开读...",
    },
  },
  {
    type: "agent-split-workspace-layout",
    label: "Agent分栏工作台",
    category: "Agent模版",
    icon: "Columns3",
    defaultWidth: 1200,
    defaultHeight: 680,
    defaultProps: {
      sessionTitle: "营销活动月度复盘分析报告",
      editingFile: "file:///workspace/northstar-dashboard.html",
      activeArtifactTab: "news-aggregator",
    },
  },
  {
    type: "agent-employee-workspace-layout",
    label: "AI员工专属工作台",
    category: "Agent模版",
    icon: "Users",
    defaultWidth: 1080,
    defaultHeight: 680,
    defaultProps: {
      employeeName: "销售宝 (对话类)",
      employeeDesc: "支持产品问答、PPT 制作、销售对练和营销内容生成",
      categoryTitle: "PPT制作",
      projectScope: "Project-D",
    },
  },
  {
    type: "agent-employee-market-layout",
    label: "AI员工技能市场",
    category: "Agent模版",
    icon: "LayoutGrid",
    defaultWidth: 1080,
    defaultHeight: 680,
    defaultProps: {
      marketTitle: "AI 员工管理与技能市场",
      marketSubtitle: "为您的智能体提供预封装且可复用的最佳实践与工具",
      activeCategory: "推荐招募",
    },
  },

  // =========================================================================
  // 2. Agent 侧栏与导航 (Sidebar & Navigation)
  // =========================================================================
  {
    type: "agent-nav-sidebar",
    label: "智能体侧边栏",
    category: "Agent侧栏",
    icon: "PanelLeft",
    defaultWidth: 240,
    defaultHeight: 640,
    defaultProps: {
      appName: "AGENT DESKTOP",
      activeMode: "chat",
      activeTaskName: "完善我的报告- 【Part 1】",
      userName: "李 · Jason · io",
    },
  },
  {
    type: "agent-project-tree",
    label: "项目与会话树",
    category: "Agent侧栏",
    icon: "FolderTree",
    defaultWidth: 220,
    defaultHeight: 280,
    defaultProps: {
      projectName: "Project-A",
      items: "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档,优化一个Skill:dot,完善我的数据分析报告",
    },
  },
  {
    type: "agent-user-footer",
    label: "用户身份与设置底栏",
    category: "Agent侧栏",
    icon: "User",
    defaultWidth: 220,
    defaultHeight: 48,
    defaultProps: {
      userName: "李 · Jason · io",
      role: "Pro Workspace",
    },
  },

  // =========================================================================
  // 3. Agent 输入与控制 (Prompt & Controls)
  // =========================================================================
  {
    type: "agent-prompt-box",
    label: "Agent核心输入框",
    category: "Agent输入",
    icon: "TextCursorInput",
    defaultWidth: 640,
    defaultHeight: 128,
    defaultProps: {
      placeholder: "有什么问题请问我吧，输入 / 可调用技能",
      permissionText: "默认权限",
      modelName: "高级模型",
      projectScope: "Project-D",
    },
  },
  {
    type: "agent-prompt-toolbar",
    label: "场景参数配置条",
    category: "Agent输入",
    icon: "SlidersHorizontal",
    defaultWidth: 640,
    defaultHeight: 38,
    defaultProps: {
      projectScope: "Project-D",
      pageCount: "4-6 页",
      ratio: "16:9",
      language: "中文",
    },
  },
  {
    type: "agent-prompt-suggestions",
    label: "快捷建议技能组",
    category: "Agent输入",
    icon: "Sparkles",
    defaultWidth: 640,
    defaultHeight: 36,
    defaultProps: {
      items: "👍 推荐使用,📖 内容创作,📊 数据分析,@ 邮件处理,📑 学习研究,🔍 市场调研",
    },
  },

  // =========================================================================
  // 4. Agent 执行流与消息 (Stream & Execution)
  // =========================================================================
  {
    type: "agent-stream-header",
    label: "Agent消息响应头",
    category: "Agent执行流",
    icon: "Bot",
    defaultWidth: 640,
    defaultHeight: 42,
    defaultProps: {
      agentName: "ClawHive 总管",
      consumedPoints: "21",
      elapsedTime: "2m 39s",
      isCollapsed: false,
    },
  },
  {
    type: "agent-tool-step",
    label: "工具调用步骤卡片",
    category: "Agent执行流",
    icon: "Terminal",
    defaultWidth: 580,
    defaultHeight: 40,
    defaultProps: {
      toolType: "file",
      toolLabel: "读取输入文件",
      status: "done",
      detail: "已解析 openclaw-report.docx (1.2MB)",
      isExpanded: false,
    },
  },
  {
    type: "agent-thought-stream",
    label: "思考与推理状态流",
    category: "Agent执行流",
    icon: "Sparkles",
    defaultWidth: 580,
    defaultHeight: 88,
    defaultProps: {
      statusText: "思考中...",
      thoughtContent: "我会先判断资料类型和完整性，把会议纪要、任务清单和补充说明分开读，避免一上来就混成散文...",
      isThinking: true,
    },
  },
  {
    type: "agent-file-attachments",
    label: "上下文附件卡片组",
    category: "Agent执行流",
    icon: "FileText",
    defaultWidth: 420,
    defaultHeight: 36,
    defaultProps: {
      files: "openclaw-report.md:doc,issue_imgs.png:img,requirement-spec.docx:doc",
    },
  },

  // =========================================================================
  // 5. Agent 角色、工件与控制台 (Employees & Artifacts)
  // =========================================================================
  {
    type: "agent-employee-card",
    label: "AI员工角色卡片",
    category: "Agent角色与工件",
    icon: "UserCheck",
    defaultWidth: 260,
    defaultHeight: 140,
    defaultProps: {
      name: "流程画师",
      tags: "结构绘制,数据分析,机器学习",
      description: "将复杂想法与业务逻辑转化为高保真清晰流程图",
    },
  },
  {
    type: "agent-template-card",
    label: "场景生成模版卡片",
    category: "Agent角色与工件",
    icon: "Square",
    defaultWidth: 140,
    defaultHeight: 110,
    defaultProps: {
      title: "新一代智能体",
      subtitle: "Next-Gen Agent",
      category: "PPT / 报告",
    },
  },
  {
    type: "agent-artifact-tabs",
    label: "工件多标签工作栏",
    category: "Agent角色与工件",
    icon: "Columns2",
    defaultWidth: 640,
    defaultHeight: 42,
    defaultProps: {
      tabs: "news-aggregator.html:active,issue_imgs.png,summary-spec.md",
      filePath: "file:///workspace/northstar-dashboard.html",
    },
  },
  {
    type: "agent-console-table",
    label: "智能体实例运行表格",
    category: "Agent角色与工件",
    icon: "Table",
    defaultWidth: 580,
    defaultHeight: 220,
    defaultProps: {
      title: "Agentic CAS 实例监控",
      rowCount: 4,
    },
  },
];
