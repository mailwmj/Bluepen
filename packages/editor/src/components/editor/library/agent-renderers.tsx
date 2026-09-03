import React, { useState } from "react";
import type { ComponentType } from "../types";
import type { ComponentRenderContext } from "./renderers";
import { cn } from "@bluepen/editor/lib/utils";
import { computeShapeStyle } from "../utils/shape-styles";
import {
  Bot,
  MessageSquare,
  Users,
  Terminal,
  FolderTree,
  Folder,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUp,
  Search,
  Settings,
  Clock,
  CheckCircle2,
  FileText,
  FileCode,
  Image as ImageIcon,
  ShieldCheck,
  PanelLeft,
  PanelRight,
  X,
  Play,
  RotateCw,
  Eye,
  LayoutGrid,
  Check,
  Zap,
  Tag,
  CircleDot,
  Loader2,
  Heading,
  Compass,
  Database,
  BookOpen,
  MoreHorizontal,
  Mic,
  Layers,
} from "lucide-react";
import { FileListPreview } from "./file-list-renderer";

type Props = Record<string, string | number | boolean>;
const val = (props: Props, key: string, fallback: string | number | boolean) =>
  props[key] ?? fallback;

function parseList(valStr: unknown, fallback: string[]): string[] {
  if (Array.isArray(valStr)) return valStr.map(String);
  if (typeof valStr === "string") {
    const trimmed = valStr.trim();
    if (!trimmed) return fallback;
    const splitByNewline = trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
    if (splitByNewline.length > 1) return splitByNewline;
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return fallback;
}

// =========================================================================
// 1. Agent 核心原子组件 (Atomic Components)
// =========================================================================

/**
 * 1.1 Agent 核心输入框 (agent-prompt-box)
 */
export function AgentPromptBoxPreview({ props = {} }: { props?: Props }) {
  const placeholder = String(val(props, "placeholder", "有什么问题请问我吧，输入 / 可调用技能"));
  const permissionText = String(val(props, "permissionText", "默认权限"));
  const modelName = String(val(props, "modelName", "高级模型"));
  const projectScope = String(val(props, "projectScope", "Project-D"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-border-visible bg-surface p-3 select-none transition-colors">
      {/* Multiline Input Textarea Area */}
      <div className="flex-1 text-xs text-muted-foreground/80 font-sans leading-relaxed">
        {placeholder}
      </div>

      {/* Scope line (if specified) */}
      {projectScope && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Folder className="size-3 text-muted-foreground/70" />
          <span>{projectScope}</span>
        </div>
      )}

      {/* Bottom Tool Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        {/* Left: Attach & Permission */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full border border-border-visible bg-surface-raised hover:bg-surface text-foreground transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-border-visible/80 bg-surface-raised/60 px-2.5 py-1 text-[11px] font-mono text-foreground/90">
            <ShieldCheck className="size-3 text-muted-foreground" />
            <span>{permissionText}</span>
            <ChevronDown className="size-2.5 text-muted-foreground/60" />
          </div>
        </div>

        {/* Right: Model & Send */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border-visible/80 bg-surface-raised/60 px-2.5 py-1 text-[11px] font-mono text-foreground/90">
            <Sparkles className="size-3 text-muted-foreground" />
            <span>{modelName}</span>
            <ChevronDown className="size-2.5 text-muted-foreground/60" />
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 0. Agent 桌面框架与基础骨架 (Frames & Skeleton Primitives)
// =========================================================================

/**
 * 统一 Agent 客户端侧边栏 (240px 标准导航底座)
 * 严格遵从 Nothing-design 工业风规范，包含 2 个项目与 4 个具体任务
 */
export function AgentUnifiedSidebar({
  appName = "帝王蟹",
  activeMode = "chat",
  userName = "李·Jason·io",
}: {
  appName?: string;
  activeMode?: "chat" | "employee" | string;
  userName?: string;
}) {
  return (
    <div className="flex h-full w-60 shrink-0 flex-col justify-between border-r border-border bg-surface select-none font-sans">
      {/* 1. 顶部控制栏 (macOS 控制灯 + 搜索) */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5F56]" />
          <span className="size-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="size-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Search className="size-3.5" />
        </div>
      </div>

      {/* 2. 侧栏核心内容区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 客户端品牌与徽标 */}
        <div className="flex items-center gap-2 px-0.5">
          <div className="flex size-7 items-center justify-center rounded-md border border-border-visible bg-surface-raised text-foreground">
            <Bot className="size-4" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            {appName}
          </span>
        </div>

        {/* 模式分段切换器 */}
        <div className="grid grid-cols-2 rounded-lg border border-border-visible bg-surface-raised p-0.5 text-xs font-mono">
          <button
            type="button"
            className={cn(
              "rounded-md py-1 text-center transition-colors cursor-pointer",
              activeMode === "chat"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            对话
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md py-1 text-center transition-colors cursor-pointer",
              activeMode === "employee"
                ? "bg-foreground text-background font-bold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            AI员工
          </button>
        </div>

        {/* 新建任务按钮 */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border-visible bg-surface-raised hover:bg-surface py-1.5 text-xs font-mono font-medium text-foreground transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>新建任务</span>
        </button>

        {/* 置顶、项目与任务列表 */}
        <div className="space-y-2.5 pt-0.5 font-mono text-xs">
          {/* 置顶会话 */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">置顶</div>
            <div className="flex items-center justify-between rounded-md px-2 py-1 bg-surface-raised text-foreground font-medium truncate cursor-pointer">
              <span className="truncate">营销活动月度复盘分析报告</span>
              <span className="text-muted-foreground/60 text-[10px]">···</span>
            </div>
            <div className="rounded-md px-2 py-1 text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground truncate cursor-pointer">
              市场趋势与竞争分析
            </div>
          </div>

          {/* 项目 (保持纯净折叠态，与图 2 严格对齐) */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">
              项目
            </div>

            {/* 项目项: Project-B */}
            <div className="flex items-center justify-between rounded-md px-2 py-1 text-foreground hover:bg-surface-raised/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 truncate">
                <Folder className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Project-B</span>
              </div>
            </div>

            {/* 项目项: Project-c */}
            <div className="flex items-center justify-between rounded-md px-2 py-1 text-foreground hover:bg-surface-raised/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 truncate">
                <Folder className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">Project-c</span>
              </div>
            </div>
          </div>

          {/* 任务 (清晰展示 4 项任务) */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">任务</div>
            <div className="space-y-0.5">
              {/* 任务 1 */}
              <div className="flex items-center justify-between rounded-md px-2 py-1 bg-surface-raised/60 text-foreground text-[11px] font-medium cursor-pointer">
                <span className="truncate">营销活动月度复盘分析报告</span>
                <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0 ml-1" />
              </div>
              {/* 任务 2 */}
              <div className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-surface-raised/40 text-foreground text-[11px] cursor-pointer transition-colors">
                <span className="truncate">完善我的报告- 【Part 1】</span>
                <span className="size-1.5 rounded-full bg-[#D71921] shrink-0 ml-1" />
              </div>
              {/* 任务 3 */}
              <div className="rounded-md px-2 py-1 hover:bg-surface-raised/40 text-muted-foreground hover:text-foreground text-[11px] truncate cursor-pointer transition-colors">
                2026年第一季度营销
              </div>
              {/* 任务 4 */}
              <div className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-surface-raised/40 text-muted-foreground hover:text-foreground text-[11px] cursor-pointer transition-colors">
                <span className="truncate">优化一个Skill</span>
                <span className="size-1.5 rounded-full bg-[#D71921] shrink-0 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 底部快捷工具与用户身份态 */}
      <div className="border-t border-border p-3 space-y-1.5 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2 px-1 py-0.5 hover:text-foreground cursor-pointer transition-colors">
          <Zap className="size-3.5 shrink-0" />
          <span>技能·插件</span>
        </div>
        <div className="flex items-center gap-2 px-1 py-0.5 hover:text-foreground cursor-pointer transition-colors">
          <FileText className="size-3.5 shrink-0" />
          <span>知识库</span>
        </div>
        <div className="flex items-center gap-2 px-1 py-0.5 hover:text-foreground cursor-pointer transition-colors">
          <Clock className="size-3.5 shrink-0" />
          <span>定时任务</span>
        </div>

        {/* 用户身份态 */}
        <div className="flex items-center justify-between border-t border-border/60 pt-2 px-1 text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-5 rounded-full bg-border-visible flex items-center justify-center text-[10px] font-mono font-semibold">
              李
            </div>
            <span className="truncate text-xs font-medium">{userName}</span>
            <span className="rounded-2xs border border-border-visible px-1 py-0.2 text-[8px] font-mono text-muted-foreground uppercase">
              PRO
            </span>
          </div>
          <Settings className="size-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * Agent 桌面分栏底座 (agent-desktop-frame)
 * 统一 1080x680 外框，带统一 240px 侧边栏，右侧为开放式容器骨架
 */
export function AgentDesktopFramePreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "帝王蟹"));
  const userName = String(val(props, "userName", "李·Jason·io"));

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-border-visible bg-background select-none font-sans">
      {/* 统一 240px 侧边栏 */}
      <AgentUnifiedSidebar appName={appName} userName={userName} />

      {/* 右侧主工作区容器底座 */}
      <div className="flex flex-1 flex-col bg-background">
        {/* 顶部标题栏 */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            {appName} WORKSPACE
          </span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            [ DESKTOP SHELL · FRAMEWORK READY ]
          </span>
        </div>

        {/* 工作视区骨架 */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between px-1 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            <span>[ 主工作视区框架容器 ]</span>
            <span>CANVAS MOUNT POINT</span>
          </div>
          <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-visible/80 bg-surface/20 p-6 text-center space-y-2">
            <LayoutGrid className="size-6 text-muted-foreground/60" />
            <span className="font-mono text-xs font-semibold text-foreground tracking-wider uppercase">
              在此放置对话执行流、表格或任务画板
            </span>
            <span className="font-mono text-[10px] text-muted-foreground max-w-sm leading-relaxed">
              支持直接拖入【通用首页】、【对话组件】、【任务展开栏】或任意组件自由编排。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 知识库与目录分类树 (agent-directory-tree)
 */
export function AgentDirectoryTreePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "知识库目录"));
  const rawItems = val(
    props,
    "items",
    "核心白皮书:folder:active,客户服务FAQ:folder,Wiki实体库:folder,架构设计规范:file,竞品分析报告:file,会议纪要归档:file",
  );
  const items = parseList(rawItems, [
    "核心白皮书:folder:active",
    "客户服务FAQ:folder",
    "Wiki实体库:folder",
    "架构设计规范:file",
    "竞品分析报告:file",
  ]);

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border-visible bg-surface p-2 select-none">
      {title && (
        <div className="mb-2 flex items-center justify-between border-b border-border/60 px-1.5 pb-1.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground">TREE</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto font-mono text-[11px]">
        {items.map((raw, idx) => {
          const [label, type = "folder", status = ""] = raw.split(":");
          const isActive = status === "active";
          const isFolder = type === "folder";

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 rounded-xs px-2 py-1.5 transition-colors cursor-pointer",
                isActive
                  ? "bg-surface-raised font-semibold text-foreground border border-border-visible"
                  : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground",
              )}
            >
              {isFolder ? (
                <Folder className={cn("size-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
              ) : (
                <FileText className="size-3.5 text-muted-foreground" />
              )}
              <span className="truncate flex-1">{label}</span>
              {isActive && <span className="size-1.5 rounded-full bg-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 搜索与操作条 (agent-filter-bar)
 */
export function AgentFilterBarPreview({ props = {} }: { props?: Props }) {
  const placeholder = String(val(props, "placeholder", "搜索文档、文件夹或关键词..."));
  const buttonText = String(val(props, "buttonText", "+ 上传语料"));

  return (
    <div className="flex h-full w-full items-center justify-between gap-3 rounded-lg border border-border-visible bg-surface px-3 select-none">
      <div className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
        <div className="h-7 w-full rounded-xs border border-border-visible/80 bg-background pl-8 pr-3 flex items-center font-mono text-[11px] text-muted-foreground">
          {placeholder}
        </div>
      </div>
      <button
        type="button"
        className="flex h-7 items-center gap-1.5 rounded-full bg-primary px-3 font-mono text-[11px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
      >
        <Plus className="size-3" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}

/**
 * 1.2 场景参数配置条 (agent-prompt-toolbar)
 */
export function AgentPromptToolbarPreview({ props = {} }: { props?: Props }) {
  const projectScope = String(val(props, "projectScope", "Project-D"));
  const pageCount = String(val(props, "pageCount", "4-6 页"));
  const ratio = String(val(props, "ratio", "16:9"));
  const language = String(val(props, "language", "中文"));

  return (
    <div className="flex h-full w-full items-center justify-between rounded-lg border border-border-visible bg-surface px-3 font-mono text-[11px] select-none">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex items-center gap-1.5 text-foreground">
          <Folder className="size-3 text-muted-foreground" />
          <span>{projectScope}</span>
        </div>
        <span className="text-border-visible">|</span>
        <div className="flex items-center gap-1 hover:text-foreground cursor-pointer">
          <FileText className="size-3 text-muted-foreground" />
          <span>页数: {pageCount}</span>
          <ChevronDown className="size-2.5" />
        </div>
        <span className="text-border-visible">|</span>
        <div className="flex items-center gap-1 hover:text-foreground cursor-pointer">
          <span>尺寸: {ratio}</span>
          <ChevronDown className="size-2.5" />
        </div>
        <span className="text-border-visible">|</span>
        <div className="flex items-center gap-1 hover:text-foreground cursor-pointer">
          <span>语言: {language}</span>
          <ChevronDown className="size-2.5" />
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider hover:text-foreground cursor-pointer">
        <span>[ 更多设置 ]</span>
      </div>
    </div>
  );
}

/**
 * 1.3 快捷建议技能组 (agent-prompt-suggestions)
 */
export function AgentPromptSuggestionsPreview({ props = {} }: { props?: Props }) {
  const rawItems = val(props, "items", "👍 推荐使用,📖 内容创作,📊 数据分析,@ 邮件处理,📑 学习研究,🔍 市场调研");
  const items = parseList(rawItems, ["👍 推荐使用", "📖 内容创作", "📊 数据分析", "@ 邮件处理", "📑 学习研究", "🔍 市场调研"]);

  return (
    <div className="flex h-full w-full items-center gap-2 overflow-x-auto select-none py-1">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-visible bg-surface-raised px-3 py-1 text-xs text-foreground/90 hover:border-foreground/60 transition-colors cursor-pointer"
        >
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 1.4 Agent 消息响应头 (agent-stream-header)
 */
export function AgentStreamHeaderPreview({ props = {} }: { props?: Props }) {
  const agentName = String(val(props, "agentName", "ClawHive 总管"));
  const consumedPoints = String(val(props, "consumedPoints", "21"));
  const elapsedTime = String(val(props, "elapsedTime", "2m 39s"));

  return (
    <div className="flex h-full w-full items-center justify-between rounded-lg border border-border-visible bg-surface px-3 select-none">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border-visible">
          <Bot className="size-3.5 text-foreground" />
        </div>
        <span className="text-xs font-semibold text-foreground">{agentName}</span>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">[ 智能体 ]</span>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Sparkles className="size-3 text-muted-foreground" />
          <span>消耗 {consumedPoints} 积分</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1">
          <Clock className="size-3 text-muted-foreground" />
          <span>已处理 {elapsedTime}</span>
        </div>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * 1.5 工具调用步骤卡片 (agent-tool-step)
 */
export function AgentToolStepPreview({ props = {} }: { props?: Props }) {
  const toolLabel = String(val(props, "toolLabel", "读取输入文件"));
  const detail = String(val(props, "detail", "已解析 openclaw-report.docx (1.2MB)"));
  const status = String(val(props, "status", "done"));
  const isExpanded = props.isExpanded === true || props.isExpanded === "true";

  return (
    <div className="flex h-full w-full flex-col justify-center rounded-lg border border-border-visible bg-surface-raised/40 p-2 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-foreground/90">
          <Terminal className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono text-[11px] font-medium tracking-wide">{toolLabel}</span>
          {status === "done" ? (
            <span className="font-mono text-[9px] text-[#4A9E5C] border border-[#4A9E5C]/40 bg-[#4A9E5C]/10 px-1.5 py-0.5 rounded-2xs uppercase">
              DONE
            </span>
          ) : status === "running" ? (
            <span className="font-mono text-[9px] text-[#D4A843] border border-[#D4A843]/40 bg-[#D4A843]/10 px-1.5 py-0.5 rounded-2xs uppercase animate-pulse">
              RUNNING
            </span>
          ) : (
            <span className="font-mono text-[9px] text-muted-foreground border border-border-visible bg-surface px-1.5 py-0.5 rounded-2xs uppercase">
              PENDING
            </span>
          )}
        </div>

        <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
      </div>

      {isExpanded && detail && (
        <div className="mt-2 border-t border-border/60 pt-1.5 font-mono text-[10px] text-muted-foreground">
          {detail}
        </div>
      )}
    </div>
  );
}

/**
 * 1.6 思考与推理状态流 (agent-thought-stream)
 */
export function AgentThoughtStreamPreview({ props = {} }: { props?: Props }) {
  const statusText = String(val(props, "statusText", "思考中..."));
  const thoughtContent = String(
    val(
      props,
      "thoughtContent",
      "我会先判断资料类型和完整性，把会议纪要、任务清单和补充说明分开读，避免一上来就混成散文...",
    ),
  );

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible bg-surface-raised/20 p-2.5 select-none">
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Sparkles className="size-3 text-muted-foreground shrink-0" />
        <span className="tracking-wider uppercase">{statusText}</span>
      </div>

      <div className="text-xs text-muted-foreground/85 font-sans leading-relaxed line-clamp-2 italic">
        “{thoughtContent}”
      </div>
    </div>
  );
}

/**
 * 1.7 上下文附件卡片组 (agent-file-attachments)
 */
export function AgentFileAttachmentsPreview({ props = {} }: { props?: Props }) {
  const rawFiles = val(props, "files", "openclaw-report.docx:doc,issue_imgs.png:img");
  const files = parseList(rawFiles, ["openclaw-report.docx:doc", "issue_imgs.png:img"]);

  return (
    <div className="flex h-full w-full items-center gap-2 overflow-x-auto select-none font-mono">
      {files.map((fileStr, idx) => {
        const [name, type] = fileStr.split(":");
        const isImg =
          type === "img" ||
          name.endsWith(".png") ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg") ||
          name.endsWith(".webp") ||
          name.endsWith(".svg");

        return (
          <div
            key={idx}
            className="flex shrink-0 items-center gap-2 rounded-md border border-border-visible bg-surface px-3 py-1.5 text-xs text-foreground hover:border-foreground/40 transition-colors"
          >
            {isImg ? (
              <ImageIcon className="size-3.5 text-muted-foreground shrink-0" />
            ) : (
              <FileCode className="size-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="max-w-[160px] truncate">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 1.8 AI 员工角色卡片 (agent-employee-card)
 */
export function AgentEmployeeCardPreview({ props = {} }: { props?: Props }) {
  const name = String(val(props, "name", "流程画师"));
  const rawTags = val(props, "tags", "结构绘制,数据分析,机器学习");
  const tags = parseList(rawTags, ["结构绘制", "数据分析", "机器学习"]);
  const description = String(val(props, "description", "将复杂想法与业务逻辑转化为高保真清晰流程图"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-border-visible bg-surface p-3.5 select-none hover:border-foreground/60 transition-colors">
      <div className="flex items-start gap-3">
        {/* Wireframe Avatar */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-visible bg-surface-raised text-foreground">
          <Bot className="size-6 text-muted-foreground" />
        </div>

        {/* Title & Tags */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-foreground truncate">{name}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((t, i) => (
              <span
                key={i}
                className="rounded-2xs border border-border-visible bg-surface-raised px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </div>
    </div>
  );
}

/**
 * 1.9 场景生成模版卡片 (agent-template-card)
 */
export function AgentTemplateCardPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "新一代智能体"));
  const subtitle = String(val(props, "subtitle", "Next-Gen Agent"));
  const category = String(val(props, "category", "PPT / 报告"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible bg-surface p-2.5 select-none hover:border-foreground/60 transition-colors">
      {/* Template Thumbnail Placeholder */}
      <div className="flex h-16 w-full items-center justify-center rounded-md border border-border bg-surface-raised">
        <span className="font-mono text-[9px] text-muted-foreground uppercase">[ {category} ]</span>
      </div>

      <div className="mt-1.5">
        <div className="text-xs font-semibold text-foreground truncate">{title}</div>
        <div className="font-mono text-[9px] text-muted-foreground truncate">{subtitle}</div>
      </div>
    </div>
  );
}

/**
 * 1.10 工件多标签工作栏 (agent-artifact-tabs)
 */
export function AgentArtifactTabsPreview({ props = {} }: { props?: Props }) {
  const rawTabs = val(props, "tabs", "news-aggregator:active,issue_imgs");
  const tabs = parseList(rawTabs, ["news-aggregator:active", "issue_imgs"]);

  const renderTabIcon = (tabStr: string) => {
    const lower = tabStr.toLowerCase();
    if (lower.includes(".png") || lower.includes(".jpg") || lower.includes(".webp") || lower.includes(".svg")) {
      return <ImageIcon className="size-3.5 text-muted-foreground shrink-0" />;
    }
    if (lower.includes("issue_imgs") || lower.includes(".doc") || lower.includes(".docx")) {
      return (
        <div className="flex size-4 shrink-0 items-center justify-center rounded-xs bg-[#2B579A] text-white font-bold text-[9px]">
          W
        </div>
      );
    }
    if (lower.includes("news-aggregator") || lower.includes(".md") || lower.includes("markdown")) {
      return (
        <div className="flex size-4 shrink-0 items-center justify-center rounded-xs bg-muted-foreground/30 text-foreground font-bold text-[9px]">
          M
        </div>
      );
    }
    return <FileCode className="size-3.5 text-muted-foreground shrink-0" />;
  };

  return (
    <div className="flex h-full w-full items-center justify-between border-b border-border bg-surface px-2.5 select-none">
      {/* 标签页与新建按钮 */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((t, idx) => {
          const isActive = t.includes(":active");
          const label = t.replace(":active", "").trim();
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer",
                isActive
                  ? "bg-surface-raised text-foreground font-medium shadow-2xs"
                  : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
              )}
            >
              {renderTabIcon(label)}
              <span>{label}</span>
            </div>
          );
        })}
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="新建标签"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {/* 右侧面板折叠/切换控制 */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="切换侧栏面板"
        >
          <PanelRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * 1.11 智能体实例运行表格 (agent-console-table)
 */
export function AgentConsoleTablePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "Agentic CAS 实例监控"));

  const rows = [
    { name: "openclaw", ip: "10.242.69.248:18789", version: "2026.6.10", skills: "8 个", status: "ONLINE" },
    { name: "closetmoon", ip: "10.242.69.249:18790", version: "2026.6.11", skills: "4 个", status: "ONLINE" },
    { name: "silentwave", ip: "10.242.69.250:18791", version: "2026.6.12", skills: "6 个", status: "BUSY" },
    { name: "crimsonpeak", ip: "10.242.69.251:18792", version: "2026.6.13", skills: "2 个", status: "ONLINE" },
  ];

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border-visible bg-surface overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-surface-raised/40">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
        <span className="font-mono text-[10px] text-muted-foreground uppercase">[ 4 RUNNING ]</span>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 border-b border-border/80 px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>实例名称</span>
          <span>网络地址:端口</span>
          <span>挂载技能</span>
          <span className="text-right">状态</span>
        </div>

        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-4 items-center border-b border-border/40 px-3 py-2 text-xs font-mono hover:bg-surface-raised/50"
          >
            <span className="font-medium text-foreground">{row.name}</span>
            <span className="text-muted-foreground text-[11px]">{row.ip}</span>
            <span className="text-muted-foreground text-[11px]">{row.skills}</span>
            <div className="flex justify-end">
              <span
                className={cn(
                  "rounded-2xs px-1.5 py-0.5 text-[9px] uppercase font-bold",
                  row.status === "ONLINE"
                    ? "text-[#4A9E5C] bg-[#4A9E5C]/10 border border-[#4A9E5C]/30"
                    : "text-[#D4A843] bg-[#D4A843]/10 border border-[#D4A843]/30"
                )}
              >
                {row.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 1.12 智能体侧边栏 (agent-nav-sidebar)
 */
export function AgentNavSidebarPreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "AGENT DESKTOP"));
  const activeMode = String(val(props, "activeMode", "chat"));
  const userName = String(val(props, "userName", "李 · Jason · io"));

  return (
    <div className="flex h-full w-full flex-col justify-between border-r border-border bg-surface p-3 select-none">
      {/* 1. Top Header & Mode Toggle */}
      <div className="space-y-3">
        {/* macOS Traffic Lights + Title */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border-visible" />
            <span className="size-2.5 rounded-full bg-border-visible" />
            <span className="size-2.5 rounded-full bg-border-visible" />
          </div>
          <span className="ml-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground">{appName}</span>
        </div>

        {/* Mode Switcher Pill */}
        <div className="grid grid-cols-2 rounded-lg border border-border-visible bg-surface-raised p-0.5 text-xs font-mono">
          <button
            type="button"
            className={cn(
              "rounded-md py-1 text-center transition-colors",
              activeMode === "chat" ? "bg-foreground text-background font-bold" : "text-muted-foreground"
            )}
          >
            对话
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md py-1 text-center transition-colors",
              activeMode === "employee" ? "bg-foreground text-background font-bold" : "text-muted-foreground"
            )}
          >
            AI员工
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-visible bg-surface-raised hover:bg-surface py-1.5 text-xs font-mono font-medium text-foreground transition-colors"
        >
          <Plus className="size-3.5" />
          <span>新建任务</span>
        </button>

        {/* Project Tree Items */}
        <div className="space-y-1 pt-1 font-mono text-xs">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">置顶会话</div>
          <div className="rounded-md px-2 py-1 bg-surface-raised text-foreground font-medium truncate">
            营销活动月度复盘分析...
          </div>
          <div className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground truncate">
            市场趋势与竞争分析
          </div>

          <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 pt-2">工程项目</div>
          <div className="flex items-center gap-1 px-1 text-foreground font-semibold">
            <ChevronDown className="size-3" />
            <Folder className="size-3.5 text-muted-foreground" />
            <span>Project-A</span>
          </div>
          <div className="ml-4 space-y-1 border-l border-border-visible/50 pl-2 text-[11px] text-muted-foreground">
            <div className="text-foreground font-medium truncate">完善我的报告- 【Part 1】</div>
            <div className="flex items-center gap-1 truncate">
              <Loader2 className="size-2.5 animate-spin" />
              <span>2026年第一季度...</span>
            </div>
            <div className="truncate">编辑我的演示文档</div>
          </div>
        </div>
      </div>

      {/* 2. Bottom Nav & Profile */}
      <div className="border-t border-border pt-2 space-y-1.5 font-mono text-xs text-muted-foreground">
        <div className="flex items-center gap-2 px-1 hover:text-foreground cursor-pointer">
          <Zap className="size-3.5" />
          <span>技能·插件</span>
        </div>
        <div className="flex items-center gap-2 px-1 hover:text-foreground cursor-pointer">
          <FileText className="size-3.5" />
          <span>知识库</span>
        </div>
        <div className="flex items-center gap-2 px-1 hover:text-foreground cursor-pointer">
          <Clock className="size-3.5" />
          <span>定时任务</span>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 px-1 text-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <div className="size-5 rounded-full bg-border-visible flex items-center justify-center text-[10px] font-mono">
              李
            </div>
            <span className="truncate text-xs">{userName}</span>
          </div>
          <Settings className="size-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </div>
  );
}

/**
 * 1.13 项目与会话树 (agent-project-tree)
 */
export function AgentProjectTreePreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", val(props, "projectName", "项目")));
  const rawItems = val(props, "items", "Project-B,Project-c");
  const items = parseList(rawItems, ["Project-B", "Project-c"]);

  return (
    <div className="flex h-full w-full flex-col space-y-1 font-mono text-xs select-none">
      {title && (
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 shrink-0">
          {title}
        </div>
      )}

      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map((itemStr, idx) => {
          const isActive = itemStr.includes(":active");
          const isLoading = itemStr.includes(":loading");
          const hasDot = itemStr.includes(":dot");
          const label = itemStr.replace(":active", "").replace(":loading", "").replace(":dot", "").trim();

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1 text-xs transition-colors cursor-pointer",
                isActive
                  ? "bg-surface-raised text-foreground font-semibold"
                  : "text-foreground hover:bg-surface-raised/40"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Folder className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{label}</span>
              </div>
              {isLoading ? (
                <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />
              ) : hasDot ? (
                <span className="size-1.5 rounded-full bg-[#D71921] shrink-0" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 1.14 用户身份与设置底栏 (agent-user-footer)
 */
export function AgentUserFooterPreview({ props = {} }: { props?: Props }) {
  const userName = String(val(props, "userName", "李 · Jason · io"));
  const role = String(val(props, "role", "Pro Workspace"));

  return (
    <div className="flex h-full w-full items-center justify-between rounded-lg border border-border-visible bg-surface px-3 py-2 select-none">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full border border-border-visible bg-surface-raised flex items-center justify-center font-mono text-xs font-bold text-foreground">
          李
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{userName}</span>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">{role}</span>
        </div>
      </div>

      <Settings className="size-4 text-muted-foreground hover:text-foreground cursor-pointer" />
    </div>
  );
}

/**
 * 1.15 侧栏窗口头部 (agent-sidebar-header)
 */
export function AgentSidebarHeaderPreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "AGENT CLAW"));
  const showDots = Boolean(val(props, "showDots", true));

  return (
    <div className="flex h-full w-full items-center gap-2 px-1 select-none font-mono">
      {showDots && (
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 rounded-full bg-border-visible" />
          <span className="size-2.5 rounded-full bg-border-visible" />
          <span className="size-2.5 rounded-full bg-border-visible" />
        </div>
      )}
      <span className="ml-1 text-xs font-bold uppercase tracking-wider text-foreground truncate">
        {appName}
      </span>
    </div>
  );
}

/**
 * 1.16 Agent 模式切换 (agent-mode-switch) - 对应截图 3
 */
export function AgentModeSwitchPreview({ props = {} }: { props?: Props }) {
  const rawOptions = val(props, "options", "对话,AI员工");
  const options = parseList(rawOptions, ["对话", "AI员工"]);
  const active = String(val(props, "active", options[0] || "对话"));

  return (
    <div className="grid h-full w-full grid-flow-col auto-cols-fr rounded-lg border border-border-visible bg-surface-raised p-0.5 text-xs font-mono select-none">
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <div
            key={opt}
            className={cn(
              "flex items-center justify-center rounded-md py-1 text-center font-mono transition-colors truncate",
              isActive
                ? "bg-foreground text-background font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 1.17 新建任务按钮 (agent-new-task-button) - 对应截图 3
 */
export function AgentNewTaskButtonPreview({ props = {} }: { props?: Props }) {
  const text = String(val(props, "text", "新建任务"));

  return (
    <button
      type="button"
      className="flex h-full w-full items-center justify-center gap-1.5 rounded-lg border border-border-visible bg-surface-raised hover:bg-surface py-1.5 px-3 text-xs font-mono font-medium text-foreground transition-colors select-none"
    >
      <Plus className="size-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </button>
  );
}

/**
 * 1.18 置顶与会话列表 (agent-session-list)
 */
export function AgentSessionListPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "置顶会话"));
  const rawItems = val(props, "items", "营销活动月度复盘分析...:active,市场趋势与竞争分析");
  const items = parseList(rawItems, ["营销活动月度复盘分析...:active", "市场趋势与竞争分析"]);

  return (
    <div className="flex h-full w-full flex-col space-y-1 font-mono text-xs select-none">
      {title && (
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 shrink-0">
          {title}
        </div>
      )}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {items.map((itemStr, idx) => {
          const isActive = itemStr.includes(":active");
          const label = itemStr.replace(":active", "").trim();
          return (
            <div
              key={idx}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs truncate transition-colors",
                isActive
                  ? "bg-surface-raised text-foreground font-semibold border border-border-visible"
                  : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 1.19 侧栏快捷导航组 (agent-sidebar-nav)
 */
export function AgentSidebarNavPreview({ props = {} }: { props?: Props }) {
  const rawItems = val(props, "items", "技能·插件:Zap,知识库:FileText,定时任务:Clock");
  const items = parseList(rawItems, ["技能·插件:Zap", "知识库:FileText", "定时任务:Clock"]);

  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "zap": return Zap;
      case "filetext":
      case "file": return FileText;
      case "clock": return Clock;
      case "compass": return Compass;
      case "settings": return Settings;
      default: return Zap;
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-center space-y-1.5 font-mono text-xs text-muted-foreground select-none">
      {items.map((itemStr, idx) => {
        const [label, iconName = "Zap"] = itemStr.split(":");
        const IconComponent = getIcon(iconName);
        return (
          <div
            key={idx}
            className="flex items-center gap-2 px-1 hover:text-foreground cursor-pointer transition-colors truncate"
          >
            <IconComponent className="size-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 1.20 模型与权限胶囊 (agent-model-badge)
 */
export function AgentModelBadgePreview({ props = {} }: { props?: Props }) {
  const modelName = String(val(props, "modelName", "高级推理模型"));
  const permissionText = String(val(props, "permissionText", "默认权限"));

  return (
    <div className="flex h-full w-full items-center gap-2 font-mono text-[11px] select-none">
      {permissionText && (
        <div className="flex items-center gap-1.5 rounded-full border border-border-visible bg-surface-raised px-2.5 py-1 text-foreground/90">
          <ShieldCheck className="size-3 text-muted-foreground" />
          <span>{permissionText}</span>
          <ChevronDown className="size-2.5 text-muted-foreground/60" />
        </div>
      )}
      {modelName && (
        <div className="flex items-center gap-1.5 rounded-full border border-border-visible bg-surface-raised px-2.5 py-1 text-foreground/90">
          <Sparkles className="size-3 text-muted-foreground" />
          <span>{modelName}</span>
          <ChevronDown className="size-2.5 text-muted-foreground/60" />
        </div>
      )}
    </div>
  );
}

/**
 * 1.21 用户提问消息气泡 (agent-user-message)
 */
export function AgentUserMessagePreview({ props = {} }: { props?: Props }) {
  const prompt = String(
    val(
      props,
      "prompt",
      "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。",
    )
  );
  const projectScope = String(val(props, "projectScope", "Project-D"));

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-border-visible bg-surface-raised p-3 select-none">
      <div className="text-xs font-sans text-foreground leading-relaxed">
        {prompt}
      </div>
      {projectScope && (
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <Folder className="size-3 text-muted-foreground/70" />
          <span>{projectScope}</span>
        </div>
      )}
    </div>
  );
}

/**
 * 1.22 会话标题与状态栏 (agent-session-header)
 */
export function AgentSessionHeaderPreview({ props = {} }: { props?: Props }) {
  const title = String(val(props, "title", "营销活动月度复盘分析报告"));
  const badge = String(val(props, "badge", "STREAM ACTIVE"));

  return (
    <div className="flex h-full w-full items-center justify-between border-b border-border bg-surface px-4 py-2 select-none font-mono">
      <span className="text-xs font-bold text-foreground truncate">{title}</span>
      {badge && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          [ {badge} ]
        </span>
      )}
    </div>
  );
}

/**
 * 1.23 智能体状态徽标 (agent-status-badge)
 */
export function AgentStatusBadgePreview({ props = {} }: { props?: Props }) {
  const text = String(val(props, "text", "DONE"));
  const status = String(val(props, "status", "success")).toLowerCase();
  const showBrackets = Boolean(val(props, "showBrackets", false));

  // 1. Explicit status preset has highest priority
  let statusCls = "";
  if (status === "success" || status === "done") {
    statusCls = "text-[#4A9E5C] border-[#4A9E5C]/60 bg-[#4A9E5C]/15";
  } else if (status === "warning" || status === "running" || status === "busy") {
    statusCls = "text-[#D4A843] border-[#D4A843]/60 bg-[#D4A843]/15";
  } else if (status === "danger" || status === "error" || status === "fail") {
    statusCls = "text-[#D71921] border-[#D71921]/60 bg-[#D71921]/15";
  } else if (status === "info" || status === "active" || status === "stream") {
    statusCls = "text-[#5B9BF6] border-[#5B9BF6]/60 bg-[#5B9BF6]/15";
  } else if (status === "purple" || status === "agent") {
    statusCls = "text-[#C084FC] border-[#A855F7]/60 bg-[#A855F7]/15";
  } else if (status === "neutral" || status === "idle") {
    statusCls = "text-foreground/80 border-border-visible bg-surface-raised";
  } else {
    // 2. Fallback to keyword matching in text only if status is not a known preset
    const upper = text.toUpperCase();
    if (upper.includes("ONLINE") || upper.includes("DONE") || upper.includes("SUCCESS")) {
      statusCls = "text-[#4A9E5C] border-[#4A9E5C]/60 bg-[#4A9E5C]/15";
    } else if (upper.includes("BUSY") || upper.includes("RUNNING") || upper.includes("WARN")) {
      statusCls = "text-[#D4A843] border-[#D4A843]/60 bg-[#D4A843]/15";
    } else if (upper.includes("ERROR") || upper.includes("FAIL")) {
      statusCls = "text-[#D71921] border-[#D71921]/60 bg-[#D71921]/15";
    } else if (upper.includes("ACTIVE") || upper.includes("STREAM")) {
      statusCls = "text-[#5B9BF6] border-[#5B9BF6]/60 bg-[#5B9BF6]/15";
    } else if (upper.includes("AGENT") || upper.includes("AI")) {
      statusCls = "text-[#C084FC] border-[#A855F7]/60 bg-[#A855F7]/15";
    } else {
      statusCls = "text-foreground/80 border-border-visible bg-surface-raised";
    }
  }

  const cleanText = text.replace(/^\[\s*/, "").replace(/\s*\]$/, "");

  return (
    <div
      className={cn(
        "inline-flex h-full w-full items-center justify-center rounded-xs border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider select-none",
        statusCls
      )}
    >
      {cleanText}
    </div>
  );
}

// =========================================================================
// 2. Agent 完整模版 (Full Screen Templates)
// =========================================================================

// =========================================================================
// 2. Agent 客户端组件 (Agent Client Three States) & 完整模版
// =========================================================================

/**
 * 2.1 通用首页组件 (agent-client-home)
 * 标准 1080x680 外框，左侧统一侧栏补充 2 个项目与 4 个任务，右侧居中欢迎区与提示词输入框
 */
export function AgentClientHomePreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "帝王蟹"));
  const welcomeTitle = String(val(props, "welcomeTitle", "Hi, 有什么可以帮你？"));
  const promptPlaceholder = String(val(props, "promptPlaceholder", "有什么问题问我吧，输入/可用技能"));
  const modelName = String(val(props, "modelName", "高级模型"));
  const userName = String(val(props, "userName", "李·Jason·io"));

  return (
    <div className="flex h-full w-full rounded-xl border border-border-visible bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 统一 240px 左侧边栏 (内置 2 个项目、4 个任务) */}
      <AgentUnifiedSidebar appName={appName} userName={userName} />

      {/* 右侧主工作区 (无顶部多余灰色条，纯净居中) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="w-full max-w-xl space-y-6">
            {/* 迎宾徽标与大字标语 */}
            <div className="text-center space-y-2">
              <div className="inline-flex size-12 items-center justify-center rounded-xl border border-border-visible bg-surface text-foreground shadow-2xs">
                <Bot className="size-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                {welcomeTitle}
              </h2>
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                帝王蟹 智能体客户端
              </div>
            </div>

            {/* 居中核心输入框 */}
            <div className="rounded-xl border border-border-visible bg-surface p-4 space-y-3.5">
              <div className="text-xs text-muted-foreground/80 font-sans leading-relaxed min-h-[44px]">
                {promptPlaceholder}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-full border border-border-visible bg-surface-raised text-foreground hover:bg-surface cursor-pointer transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 rounded-full border border-border-visible bg-surface-raised px-2.5 py-1 text-[11px] font-mono text-foreground cursor-pointer">
                    <ShieldCheck className="size-3 text-muted-foreground" />
                    <span>默认权限</span>
                    <ChevronDown className="size-2.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-border-visible bg-surface-raised px-2.5 py-1 text-[11px] font-mono text-foreground cursor-pointer">
                    <Sparkles className="size-3 text-muted-foreground" />
                    <span>{modelName}</span>
                    <ChevronDown className="size-2.5 text-muted-foreground" />
                  </div>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 cursor-pointer transition-opacity"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 底部快速场景意图胶囊 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["👍 推荐使用", "📖 内容创作", "📊 数据分析", "🔍 市场调研", "💻 脚本开发"].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-full border border-border-visible bg-surface px-3 py-1 text-xs text-foreground/85 font-mono cursor-pointer hover:border-foreground/60 transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

/**
 * 2.2 开始对话之后的对话组件 (agent-client-chat)
 * 标准 1080x680 外框，不参考截图被挤压的窄比例（主视区宽屏自适应），完整还原截图内容
 */
export function AgentClientChatPreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "帝王蟹"));
  const sessionTitle = String(val(props, "sessionTitle", "营销活动月度复盘分析报告"));
  const userPrompt = String(
    val(
      props,
      "userPrompt",
      "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。",
    ),
  );
  const agentName = String(val(props, "agentName", "ClawHive 总管"));
  const consumedPoints = String(val(props, "consumedPoints", "21"));
  const elapsedTime = String(val(props, "elapsedTime", "2m 39s"));
  const modelName = String(val(props, "modelName", "高级模型"));
  const userName = String(val(props, "userName", "李·Jason·io"));

  return (
    <div className="flex h-full w-full rounded-xl border border-border-visible bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 统一 240px 左侧边栏 */}
      <AgentUnifiedSidebar appName={appName} userName={userName} />

      {/* 主对话工作区 (自适应宽屏舒适比例，840px 视区) */}
      <div className="flex-1 flex flex-col justify-between bg-background overflow-hidden">
        {/* 顶部会话标题栏 */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground font-mono truncate">{sessionTitle}</span>
            <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer">
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              [ STREAM ACTIVE ]
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <button type="button" className="hover:text-foreground cursor-pointer" title="图层">
                <Layers className="size-3.5" />
              </button>
              <button type="button" className="hover:text-foreground cursor-pointer" title="展开右侧任务栏">
                <PanelRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 对话消息流视区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 用户提问区 */}
          <div className="flex flex-col items-end space-y-1.5 max-w-2xl ml-auto">
            {/* 附件胶囊 */}
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-md border border-border-visible bg-surface px-2.5 py-1 font-mono text-[10px] text-foreground">
                <FileText className="size-3 text-muted-foreground" />
                <span>openclaw-report.docx</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-border-visible bg-surface px-2.5 py-1 font-mono text-[10px] text-foreground">
                <ImageIcon className="size-3 text-muted-foreground" />
                <span>issue_imgs.png</span>
              </span>
            </div>
            {/* 提问气泡 */}
            <div className="rounded-xl border border-border-visible bg-surface-raised p-3.5 text-xs text-foreground leading-relaxed">
              {userPrompt}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">5月10日 · 11:45</span>
          </div>

          {/* Agent 执行响应流卡片 */}
          <div className="max-w-2xl space-y-3 rounded-xl border border-border-visible bg-surface p-4">
            {/* 卡片头部 */}
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md border border-border-visible bg-surface-raised text-foreground">
                  <Bot className="size-3.5" />
                </div>
                <span className="text-xs font-bold font-mono text-foreground">{agentName}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="size-3 text-muted-foreground" />
                  <span>消耗 {consumedPoints} 积分</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>已处理 {elapsedTime}</span>
                </div>
                <ChevronDown className="size-3 text-muted-foreground/80 cursor-pointer" />
              </div>
            </div>

            {/* 推理阐述 */}
            <div className="text-xs text-foreground/90 font-sans leading-relaxed space-y-1.5">
              <p>
                我会先判断资料类型和完整性，把会议纪要、任务清单、表格和补充说明分开读，避免一上来就混成散文。
                判断依据：我会先确认输入材料是否完整、是否和当前任务目标匹配；这样后续步骤不会把缺失材料、动态数据或无关附件误当成问题来源。
              </p>
            </div>

            {/* 工具步骤 1 */}
            <div className="space-y-1 rounded-lg border border-border-visible bg-surface-raised/40 p-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>读取输入文件</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-[9px] text-[#4A9E5C] border border-[#4A9E5C]/40 bg-[#4A9E5C]/10 px-1.5 py-0.2 rounded-2xs uppercase font-bold">
                  [DONE]
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans leading-normal">
                报告不是摘抄资料，我会先反复出现的目标、风险、结论和待办，再判断哪些值得进入正文。
              </p>
            </div>

            {/* 工具步骤 2 */}
            <div className="space-y-1 rounded-lg border border-border-visible bg-surface-raised/40 p-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Search className="size-3.5 text-muted-foreground" />
                  <span>检索相关内容</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-[9px] text-[#4A9E5C] border border-[#4A9E5C]/40 bg-[#4A9E5C]/10 px-1.5 py-0.2 rounded-2xs uppercase font-bold">
                  [DONE]
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-sans leading-normal">
                我会检查历史上下文里是否有命名、结构、语气或流程约定，并只引用和当前任务直接相关的部分，避免旧结论过度。
              </p>
            </div>

            {/* 工具步骤 3 */}
            <div className="space-y-1 rounded-lg border border-border-visible bg-surface-raised/40 p-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <FolderTree className="size-3.5 text-muted-foreground" />
                  <span>参考历史记忆</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
                <span className="font-mono text-[9px] text-[#4A9E5C] border border-[#4A9E5C]/40 bg-[#4A9E5C]/10 px-1.5 py-0.2 rounded-2xs uppercase font-bold">
                  [DONE]
                </span>
              </div>
            </div>

            {/* 思考中状态指示 */}
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-foreground" />
              <span className="uppercase tracking-wider">思考中...</span>
            </div>
          </div>
        </div>

        {/* 底部交互输入框 */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="flex flex-col gap-2 rounded-xl border border-border-visible bg-surface-raised p-3">
            <div className="text-xs text-muted-foreground font-sans">
              有什么问题问我吧，输入/可用技能
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40 font-mono text-xs">
              <div className="flex items-center gap-2">
                <button type="button" className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                  <MoreHorizontal className="size-3.5" />
                </button>
                <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer text-[11px]">
                  <ShieldCheck className="size-3" />
                  <span>安全沙箱</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-border-visible bg-surface px-2 py-0.5 text-[11px] text-foreground cursor-pointer">
                  <Sparkles className="size-3 text-muted-foreground" />
                  <span>{modelName}</span>
                </div>
                <button type="button" className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                  <Mic className="size-3.5" />
                </button>
                <button type="button" className="size-6 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 cursor-pointer transition-opacity">
                  <ArrowUp className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2.3 带任务展栏展开组件 (agent-client-split)
 * 标准 1080x680 外框，左中右三栏结构，右侧专注于容器框架骨架（无需复杂具体报表）
 */
export function AgentClientSplitPreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "帝王蟹"));
  const sessionTitle = String(val(props, "sessionTitle", "营销活动月度复盘分析报告"));
  const editingFile = String(val(props, "editingFile", "file:///workspace/northstar-dashboard.html"));
  const activeArtifactTab = String(val(props, "activeArtifactTab", "news-aggregator"));
  const userName = String(val(props, "userName", "李·Jason·io"));

  return (
    <div className="flex h-full w-full rounded-xl border border-border-visible bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 1. 左侧统一导航栏 (240px) */}
      <AgentUnifiedSidebar appName={appName} userName={userName} />

      {/* 2. 中间会话执行流 (420px，宽敞舒适比例) */}
      <div className="w-[420px] shrink-0 border-r border-border bg-background flex flex-col justify-between overflow-hidden">
        {/* 会话标题栏 */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
          <span className="text-xs font-bold font-mono text-foreground truncate">{sessionTitle}</span>
          <span className="font-mono text-[9px] text-[#4A9E5C] border border-[#4A9E5C]/30 bg-[#4A9E5C]/10 px-1.5 py-0.2 rounded-2xs uppercase font-bold">
            ACTIVE
          </span>
        </div>

        {/* 紧凑消息摘要 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* 用户提问摘要 */}
          <div className="rounded-lg border border-border-visible bg-surface-raised p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
              <FileText className="size-2.5" />
              <span>openclaw-report.docx</span>
            </div>
            <p className="text-foreground leading-snug line-clamp-2">
              /Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。
            </p>
          </div>

          {/* Agent 执行卡片摘要 */}
          <div className="rounded-lg border border-border-visible bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-border/60 pb-1.5">
              <span className="font-semibold text-foreground">ClawHive 总管</span>
              <span className="text-muted-foreground">2m 39s</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
              我会先判断资料类型和完整性，把会议纪要、任务清单、表格和补充说明分开读...
            </p>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between rounded bg-surface-raised px-2 py-1">
                <span>📄 读取输入文件</span>
                <span className="text-[#4A9E5C] font-bold">[DONE]</span>
              </div>
              <div className="flex items-center justify-between rounded bg-surface-raised px-2 py-1">
                <span>🔍 检索相关内容</span>
                <span className="text-[#4A9E5C] font-bold">[DONE]</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-muted-foreground">
              <Loader2 className="size-2.5 animate-spin" />
              <span>思考中...</span>
            </div>
          </div>
        </div>

        {/* 紧凑输入栏 */}
        <div className="p-2.5 border-t border-border bg-surface">
          <div className="flex items-center justify-between rounded-lg border border-border-visible bg-surface-raised px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="truncate">输入指令 / 追问...</span>
            <ArrowUp className="size-3 text-foreground" />
          </div>
        </div>
      </div>

      {/* 3. 右侧任务展栏展开框架 (按规范专注于框架骨架，宽敞自适应) */}
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        {/* 顶部标签栏 (严格对齐图 4: 极简纯净工件标签) */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-2.5 bg-surface">
          <div className="flex items-center gap-1.5 font-sans text-xs overflow-x-auto">
            {/* Tab 1: news-aggregator (active) */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer",
                activeArtifactTab === "news-aggregator"
                  ? "bg-surface-raised text-foreground font-medium shadow-2xs"
                  : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
              )}
            >
              <div className="flex size-4 shrink-0 items-center justify-center rounded-xs bg-muted-foreground/30 text-foreground font-bold text-[9px]">
                M
              </div>
              <span>news-aggregator</span>
            </div>
            {/* Tab 2: issue_imgs */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer",
                activeArtifactTab === "issue_imgs"
                  ? "bg-surface-raised text-foreground font-medium shadow-2xs"
                  : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
              )}
            >
              <div className="flex size-4 shrink-0 items-center justify-center rounded-xs bg-[#2B579A] text-white font-bold text-[9px]">
                W
              </div>
              <span>issue_imgs</span>
            </div>
            {/* Plus tab */}
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="新建标签"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer p-1 transition-colors"
              title="折叠任务栏"
            >
              <PanelRight className="size-4" />
            </button>
          </div>
        </div>

        {/* 工作区骨架容器 (纯净 Nothing-design 工业风线框骨架) */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-background">
          {/* 容器框架状态条 */}
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase border-b border-border/60 pb-2">
            <span>[ WORKSPACE CONTAINER FRAMEWORK ]</span>
            <span>SLOT 01 / ARTIFACT DOCK</span>
          </div>

          {/* 主工作区线框插槽 */}
          <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-visible p-6 text-center space-y-2 bg-surface/30">
            <div className="flex size-10 items-center justify-center rounded-md border border-border-visible bg-surface-raised text-muted-foreground">
              <LayoutGrid className="size-5" />
            </div>
            <div className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              [ 实时任务工作区 · 画板挂载槽 ]
            </div>
            <p className="font-mono text-[10px] text-muted-foreground max-w-xs leading-relaxed">
              此区域为任务展栏框架容器，用于实时挂载 Agent 生成的代码文件、可视化看板、原型页面或数据图表。
            </p>
          </div>

          {/* 底部检查器骨架插槽 */}
          <div className="h-24 rounded-lg border border-dashed border-border-visible p-3 flex flex-col justify-between bg-surface/20 font-mono text-[10px]">
            <div className="flex items-center justify-between text-muted-foreground uppercase">
              <span>[ 参数与状态检查器框架 ]</span>
              <span>INSPECTOR READY</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-border/80 bg-surface px-2 py-1 text-muted-foreground">
                STATUS: <span className="text-foreground">STABLE</span>
              </div>
              <div className="rounded border border-border/80 bg-surface px-2 py-1 text-muted-foreground">
                SANDBOX: <span className="text-foreground">PROTECTED</span>
              </div>
              <div className="rounded border border-border/80 bg-surface px-2 py-1 text-muted-foreground">
                DIFF: <span className="text-foreground">CLEAN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 向后兼容别名 (Aliases for Existing Templates)
// =========================================================================

export function AgentHomeLayoutPreview({ props = {} }: { props?: Props }) {
  return <AgentClientHomePreview props={props} />;
}

export function AgentChatStreamLayoutPreview({ props = {} }: { props?: Props }) {
  return <AgentClientChatPreview props={props} />;
}

export function AgentSplitWorkspaceLayoutPreview({ props = {} }: { props?: Props }) {
  return <AgentClientSplitPreview props={props} />;
}

/**
 * 2.4 AI 员工专属工作台模版 (agent-employee-workspace-layout) - 对应截图 4
 */
export function AgentEmployeeWorkspaceLayoutPreview({ props = {} }: { props?: Props }) {
  const employeeName = String(val(props, "employeeName", "销售宝 (对话类)"));
  const employeeDesc = String(val(props, "employeeDesc", "支持产品问答、PPT 制作、销售对练和营销内容生成"));
  const categoryTitle = String(val(props, "categoryTitle", "PPT制作"));
  const projectScope = String(val(props, "projectScope", "Project-D"));

  return (
    <div className="flex h-full w-full rounded-2xl border border-border-visible bg-surface text-foreground overflow-hidden font-sans select-none shadow-sm">
      {/* Left AI Employees Sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-surface p-3 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="grid grid-cols-2 rounded-lg border border-border-visible bg-surface-raised p-0.5 text-xs font-mono">
            <div className="rounded-md py-1 text-center text-muted-foreground">对话</div>
            <div className="rounded-md py-1 text-center bg-foreground text-background font-bold">AI员工</div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-visible bg-surface-raised py-1.5 text-xs font-mono font-medium text-foreground"
          >
            <Users className="size-3.5" />
            <span>招募AI员工</span>
          </button>

          <div className="space-y-1 font-mono text-xs">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">我的AI员工</div>
            <div className="rounded-md px-2 py-1 bg-surface-raised text-foreground font-semibold truncate">
              👤 {employeeName}
            </div>
            <div className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground truncate">
              👤 PPT美化师
            </div>
            <div className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground truncate">
              👤 前端开发工程师
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2 font-mono text-xs text-muted-foreground">
          <span>李 · Jason · io</span>
        </div>
      </div>

      {/* Main Role Center */}
      <div className="flex-1 flex flex-col justify-between p-6 bg-background overflow-y-auto">
        <div className="space-y-6 max-w-2xl mx-auto w-full">
          {/* Role Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-border-visible bg-surface text-foreground shadow-2xs">
              <Bot className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{employeeName}</h2>
            <p className="text-xs text-muted-foreground">{employeeDesc}</p>
          </div>

          {/* Template Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs text-foreground font-bold">
              <span>[ {categoryTitle} 模版 ]</span>
              <span className="text-[10px] text-muted-foreground uppercase">[ 6 TEMPLATES ]</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["空白模板", "LoRA大模型低秩适配", "新一代智能体", "2026 AI 行业报刊", "智能健康助手", "自动驾驶系统"].map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-border-visible bg-surface p-2.5 hover:border-foreground/60 transition-colors cursor-pointer"
                  >
                    <div className="h-14 rounded-md border border-border bg-surface-raised flex items-center justify-center font-mono text-[9px] text-muted-foreground uppercase">
                      [ PREVIEW ]
                    </div>
                    <div className="mt-2 text-xs font-medium text-foreground truncate">{item}</div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Param Input Bar */}
          <div className="rounded-xl border border-border-visible bg-surface p-3.5 space-y-3 shadow-sm">
            <div className="text-xs text-muted-foreground font-sans">
              有什么问题请问我吧，输入 / 可调用技能
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground">{projectScope}</span>
                <span>·</span>
                <span>页数 4-6 ⌵</span>
                <span>·</span>
                <span>16:9 ⌵</span>
                <span>·</span>
                <span>中文 ⌵</span>
              </div>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-full bg-foreground text-background"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2.5 AI 员工技能市场模版 (agent-employee-market-layout) - 对应截图 5
 */
export function AgentEmployeeMarketLayoutPreview({ props = {} }: { props?: Props }) {
  const marketTitle = String(val(props, "marketTitle", "AI 员工管理与技能市场"));
  const marketSubtitle = String(val(props, "marketSubtitle", "为您的智能体提供预封装且可复用的最佳实践与工具"));

  const employees = [
    { name: "流程画师", tags: ["结构绘制", "数据分析"], desc: "将复杂想法转化为高保真清晰流程图" },
    { name: "市场经理", tags: ["规划分析", "协调资源"], desc: "负责市场规划与增长策略推进" },
    { name: "物流专家", tags: ["供应链", "智能仓储"], desc: "管理供应链优化运输与流转路径" },
    { name: "广告策划师", tags: ["创意企划", "文案传播"], desc: "制定广告创意与策略，确保有效传播" },
    { name: "视觉设计师", tags: ["界面美学", "品牌形象"], desc: "负责产品视觉效果与统一品牌调性" },
    { name: "内容策略师", tags: ["内容架构", "精准触达"], desc: "制定内容方向，确保信息清晰吸引人" },
  ];

  return (
    <div className="flex h-full w-full rounded-2xl border border-border-visible bg-surface text-foreground overflow-hidden font-sans select-none shadow-sm">
      {/* Left Sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-surface p-3 flex flex-col justify-between font-mono text-xs">
        <div className="space-y-3">
          <div className="grid grid-cols-2 rounded-lg border border-border-visible bg-surface-raised p-0.5">
            <div className="rounded-md py-1 text-center text-muted-foreground">对话</div>
            <div className="rounded-md py-1 text-center bg-foreground text-background font-bold">AI员工</div>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-visible bg-surface-raised py-1.5 font-medium text-foreground"
          >
            <Users className="size-3.5" />
            <span>招募AI员工</span>
          </button>
        </div>
        <div className="border-t border-border pt-2 text-muted-foreground">
          <span>李 · Jason · io</span>
        </div>
      </div>

      {/* Main Market Hub */}
      <div className="flex-1 flex flex-col justify-between p-6 bg-background overflow-y-auto">
        <div className="space-y-5 max-w-3xl mx-auto w-full">
          {/* Header Banner */}
          <div className="rounded-2xl border border-border-visible bg-surface p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">{marketTitle}</h2>
              <p className="text-xs text-muted-foreground">{marketSubtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border-visible bg-surface-raised px-3 py-1.5 font-mono text-xs text-muted-foreground">
              <Search className="size-3.5" />
              <span>搜索 AI 员工...</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-4 border-b border-border pb-1.5 font-mono text-xs">
            <span className="font-bold text-foreground border-b-2 border-foreground pb-1">[ 推荐招募 ]</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">企业预置</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">个人创建</span>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            {employees.map((emp, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-border-visible bg-surface p-3.5 space-y-3 hover:border-foreground/60 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-visible bg-surface-raised text-foreground font-mono font-bold text-xs">
                    <Bot className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{emp.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {emp.tags.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-2xs border border-border-visible bg-surface-raised px-1 py-0.5 font-mono text-[8.5px] text-muted-foreground uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{emp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentKnowledgeBaseLayoutPreview({
  props = {},
  context,
}: {
  props?: Props;
  context?: ComponentRenderContext;
}) {
  const title = String(val(props, "title", "智能体 RAG 知识库与语料索引"));
  const activeCategory = String(val(props, "activeCategory", "核心白皮书"));

  const categories = [
    { name: "全部语料库", count: 18, key: "all" },
    { name: "核心白皮书", count: 6, key: "whitepaper" },
    { name: "客户服务FAQ", count: 4, key: "faq" },
    { name: "行业数据研报", count: 5, key: "report" },
    { name: "生成交付成果", count: 3, key: "artifacts" },
  ];

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border-visible bg-background p-4 gap-3 font-sans select-none shadow-sm">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <Database className="size-4 text-foreground" />
          <span className="text-sm font-bold text-foreground">{title}</span>
          <span className="rounded border border-border-visible bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
            [RAG 向量引擎: BGE-Large-ZH 在线]
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-mono uppercase tracking-wider font-bold text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>上传语料文档</span>
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full border border-border-visible bg-transparent px-3 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-surface-raised transition-colors"
          >
            <RotateCw className="size-3" />
            <span>重新构建索引</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Strip (4 Chunks) */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase">已挂载文档</span>
          <span className="text-sm font-mono font-bold text-foreground">8 <span className="text-[10px] text-muted-foreground font-normal">篇</span></span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase">向量分块</span>
          <span className="text-sm font-mono font-bold text-foreground">1,420 <span className="text-[10px] text-muted-foreground font-normal">chunks</span></span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase">消耗 TOKEN</span>
          <span className="text-sm font-mono font-bold text-foreground">284.5 <span className="text-[10px] text-muted-foreground font-normal">k</span></span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase">召回命中率</span>
          <span className="text-sm font-mono font-bold text-emerald-500">98.4%</span>
        </div>
      </div>

      {/* 3. Main Body Split: Category Tree on Left + FileList on Right */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Left Categories */}
        <div className="w-48 shrink-0 flex flex-col rounded-lg border border-border-visible bg-surface p-2 gap-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            语料集合分类
          </div>
          {categories.map((cat) => {
            const isActive = cat.name === activeCategory || (cat.key === "whitepaper" && activeCategory.includes("白皮书"));
            return (
              <div
                key={cat.key}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer font-sans",
                  isActive
                    ? "bg-surface-raised font-semibold text-foreground border border-border-visible"
                    : "text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground"
                )}
              >
                <span>{cat.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{cat.count}</span>
              </div>
            );
          })}
        </div>

        {/* Right Main Table */}
        <div className="flex-1 min-h-0 flex flex-col">
          <FileListPreview props={props} context={context} mode="agent" />
        </div>
      </div>

      {/* 4. Bottom Test Query Prompt Input */}
      <div className="flex items-center gap-2 rounded-lg border border-border-visible bg-surface p-2">
        <Search className="size-3.5 text-muted-foreground ml-1 shrink-0" />
        <input
          type="text"
          readOnly
          placeholder="输入测试 Prompt 检验已挂载语料的向量相似度与检索召回匹配..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
        <button
          type="button"
          className="h-7 px-3 rounded-md bg-surface-raised border border-border-visible text-[11px] font-mono uppercase text-foreground hover:bg-surface transition-colors"
        >
          召回检验
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 3. Agent 渲染分发器 (Dispatcher)
// =========================================================================

export function renderAgentLibraryComponent(
  type: ComponentType,
  props: Props = {},
  children?: React.ReactNode,
  context?: ComponentRenderContext,
): React.ReactNode | null {
  switch (type) {
    // 完整模版
    case "agent-knowledge-base-layout":
      return <AgentKnowledgeBaseLayoutPreview props={props} context={context} />;
    case "agent-employee-workspace-layout":
      return <AgentEmployeeWorkspaceLayoutPreview props={props} />;
    case "agent-employee-market-layout":
      return <AgentEmployeeMarketLayoutPreview props={props} />;
    // 框架与容器 (核心 3 态客户端及底座)
    case "agent-client-home":
    case "agent-home-layout":
      return <AgentClientHomePreview props={props} />;
    case "agent-client-chat":
    case "agent-chat-stream-layout":
      return <AgentClientChatPreview props={props} />;
    case "agent-client-split":
    case "agent-split-workspace-layout":
      return <AgentClientSplitPreview props={props} />;
    case "agent-desktop-frame":
      return <AgentDesktopFramePreview props={props} />;

    // 目录、列表与操作
    case "agent-directory-tree":
      return <AgentDirectoryTreePreview props={props} />;
    case "agent-filter-bar":
      return <AgentFilterBarPreview props={props} />;

    // 侧栏与导航
    case "agent-nav-sidebar":
      return <AgentNavSidebarPreview props={props} />;
    case "agent-sidebar-header":
      return <AgentSidebarHeaderPreview props={props} />;
    case "agent-mode-switch":
      return <AgentModeSwitchPreview props={props} />;
    case "agent-new-task-button":
      return <AgentNewTaskButtonPreview props={props} />;
    case "agent-session-list":
      return <AgentSessionListPreview props={props} />;
    case "agent-project-tree":
      return <AgentProjectTreePreview props={props} />;
    case "agent-sidebar-nav":
      return <AgentSidebarNavPreview props={props} />;
    case "agent-user-footer":
      return <AgentUserFooterPreview props={props} />;

    // 输入与参数
    case "agent-prompt-box":
      return <AgentPromptBoxPreview props={props} />;
    case "agent-model-badge":
      return <AgentModelBadgePreview props={props} />;
    case "agent-prompt-toolbar":
      return <AgentPromptToolbarPreview props={props} />;
    case "agent-prompt-suggestions":
      return <AgentPromptSuggestionsPreview props={props} />;

    // 执行流与消息
    case "agent-user-message":
      return <AgentUserMessagePreview props={props} />;
    case "agent-session-header":
      return <AgentSessionHeaderPreview props={props} />;
    case "agent-status-badge":
      return <AgentStatusBadgePreview props={props} />;
    case "agent-stream-header":
      return <AgentStreamHeaderPreview props={props} />;
    case "agent-tool-step":
      return <AgentToolStepPreview props={props} />;
    case "agent-thought-stream":
      return <AgentThoughtStreamPreview props={props} />;
    case "agent-file-attachments":
      return <AgentFileAttachmentsPreview props={props} />;

    // 角色、工件与控制台
    case "agent-employee-card":
      return <AgentEmployeeCardPreview props={props} />;
    case "agent-template-card":
      return <AgentTemplateCardPreview props={props} />;
    case "agent-artifact-tabs":
      return <AgentArtifactTabsPreview props={props} />;
    case "agent-console-table":
      return <AgentConsoleTablePreview props={props} />;
    case "agent-knowledge-files":
      return <FileListPreview props={props} context={context} mode="agent" />;

    default:
      return null;
  }
}
