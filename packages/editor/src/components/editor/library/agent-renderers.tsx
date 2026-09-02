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
  Lock,
  Compass,
  Heading,
} from "lucide-react";

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
    <div className="flex h-full w-full items-center justify-between rounded-lg border border-border bg-surface px-3 select-none">
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
    <div className="flex h-full w-full flex-col justify-center rounded-lg border border-border-visible/80 bg-surface-raised/40 p-2 select-none">
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
    <div className="flex h-full w-full flex-col justify-between rounded-lg border border-border-visible/60 bg-surface-raised/20 p-2.5 select-none">
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
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
  const rawFiles = val(props, "files", "openclaw-report.md:doc,issue_imgs.png:img,requirement-spec.docx:doc");
  const files = parseList(rawFiles, ["openclaw-report.md:doc", "issue_imgs.png:img", "requirement-spec.docx:doc"]);

  return (
    <div className="flex h-full w-full items-center gap-2 overflow-x-auto select-none">
      {files.map((fileStr, idx) => {
        const [name, type] = fileStr.split(":");
        return (
          <div
            key={idx}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-visible bg-surface px-2.5 py-1 text-xs text-foreground/90 font-mono"
          >
            {type === "img" ? (
              <ImageIcon className="size-3 text-muted-foreground" />
            ) : (
              <FileCode className="size-3 text-muted-foreground" />
            )}
            <span className="max-w-[140px] truncate">{name}</span>
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
  const rawTabs = val(props, "tabs", "news-aggregator.html:active,issue_imgs.png,summary-spec.md");
  const tabs = parseList(rawTabs, ["news-aggregator.html:active", "issue_imgs.png", "summary-spec.md"]);
  const filePath = String(val(props, "filePath", "file:///workspace/northstar-dashboard.html"));

  return (
    <div className="flex h-full w-full flex-col justify-between border-b border-border bg-surface select-none">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-border/80 px-2 pt-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((t, idx) => {
            const isActive = t.includes(":active");
            const label = t.replace(":active", "");
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-md px-3 py-1 text-xs font-mono transition-colors",
                  isActive
                    ? "border-t-2 border-foreground bg-surface-raised text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
                )}
              >
                <FileCode className="size-3 text-muted-foreground" />
                <span>{label}</span>
                <X className="size-3 text-muted-foreground/60 hover:text-foreground cursor-pointer" />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <button
            type="button"
            className="flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 font-mono text-[10px] text-background uppercase"
          >
            <Play className="size-2.5 fill-current" />
            <span>保存并运行</span>
          </button>
        </div>
      </div>

      {/* Sub-toolbar path */}
      <div className="flex items-center justify-between px-3 py-1 font-mono text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1 truncate">
          <span>正在编辑:</span>
          <span className="text-foreground">{filePath}</span>
        </div>
        <span className="uppercase text-muted-foreground/60">[ DIFF READY ]</span>
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
  const projectName = String(val(props, "projectName", "Project-A"));
  const rawItems = val(
    props,
    "items",
    "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档,优化一个Skill:dot,完善我的数据分析报告",
  );
  const items = parseList(rawItems, [
    "完善我的报告- 【Part 1】:active",
    "2026年第一季度规划:loading",
    "编辑我的演示文档",
    "优化一个Skill:dot",
    "完善我的数据分析报告",
  ]);

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-border-visible bg-surface p-3 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-border pb-2 text-foreground font-semibold">
        <div className="flex items-center gap-1.5">
          <FolderTree className="size-3.5 text-muted-foreground" />
          <span>{projectName}</span>
        </div>
        <Plus className="size-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
      </div>

      <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
        {items.map((itemStr, idx) => {
          const isActive = itemStr.includes(":active");
          const isLoading = itemStr.includes(":loading");
          const hasDot = itemStr.includes(":dot");
          const label = itemStr.replace(":active", "").replace(":loading", "").replace(":dot", "").trim();

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                isActive
                  ? "bg-surface-raised text-foreground font-semibold border border-border-visible"
                  : "text-muted-foreground hover:bg-surface-raised/40 hover:text-foreground"
              )}
            >
              <span className="truncate">{label}</span>
              {isLoading ? (
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
              ) : hasDot ? (
                <span className="size-1.5 rounded-full bg-[#D71921]" />
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
                  ? "bg-surface-raised text-foreground font-semibold border border-border-visible/60"
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
 * 1.23 智能体状态微标 (agent-status-badge)
 */
export function AgentStatusBadgePreview({ props = {} }: { props?: Props }) {
  const text = String(val(props, "text", "DIFF READY"));
  const status = String(val(props, "status", "default"));

  const statusCls =
    status === "success" || text.includes("ONLINE") || text.includes("DONE")
      ? "text-[#4A9E5C] border-[#4A9E5C]/40 bg-[#4A9E5C]/10"
      : status === "warning" || text.includes("BUSY")
      ? "text-[#D4A843] border-[#D4A843]/40 bg-[#D4A843]/10"
      : status === "danger" || status === "error"
      ? "text-[#D71921] border-[#D71921]/40 bg-[#D71921]/10"
      : "text-muted-foreground border-border-visible bg-surface-raised";

  return (
    <div
      className={cn(
        "inline-flex h-full w-full items-center justify-center rounded-xs border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider select-none",
        statusCls
      )}
    >
      [ {text.replace(/^\[\s*/, "").replace(/\s*\]$/, "")} ]
    </div>
  );
}

// =========================================================================
// 2. Agent 完整模版 (Full Screen Templates)
// =========================================================================

/**
 * 2.1 Agent 对话主页模版 (agent-home-layout) - 对应截图 1
 */
export function AgentHomeLayoutPreview({ props = {} }: { props?: Props }) {
  const appName = String(val(props, "appName", "AGENT DESKTOP"));
  const welcomeTitle = String(val(props, "welcomeTitle", "Hi, 有什么可以帮你？"));
  const promptPlaceholder = String(val(props, "promptPlaceholder", "有什么问题请问我吧，输入 / 可调用技能"));
  const projectName = String(val(props, "projectName", "Project-A"));
  const modelName = String(val(props, "modelName", "高级推理模型"));

  return (
    <div className="flex h-full w-full rounded-2xl border border-border-visible bg-surface text-foreground overflow-hidden font-sans select-none shadow-sm">
      {/* Left Sidebar (220px) */}
      <div className="w-56 shrink-0 border-r border-border bg-surface flex flex-col justify-between p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-visible" />
              <span className="size-2.5 rounded-full bg-border-visible" />
              <span className="size-2.5 rounded-full bg-border-visible" />
            </div>
            <span className="ml-1 font-mono text-xs font-bold uppercase tracking-wider">{appName}</span>
          </div>

          <div className="grid grid-cols-2 rounded-lg border border-border-visible bg-surface-raised p-0.5 text-xs font-mono">
            <div className="rounded-md py-1 text-center bg-foreground text-background font-bold">对话</div>
            <div className="rounded-md py-1 text-center text-muted-foreground">AI员工</div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-visible bg-surface-raised py-1.5 text-xs font-mono font-medium text-foreground"
          >
            <Plus className="size-3.5" />
            <span>新建任务</span>
          </button>

          <div className="space-y-1 font-mono text-xs">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">置顶</div>
            <div className="rounded-md px-2 py-1 bg-surface-raised text-foreground font-medium truncate">
              营销活动月度复盘...
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-1 pt-2">项目</div>
            <div className="flex items-center gap-1 px-1 text-foreground font-semibold">
              <ChevronDown className="size-3" />
              <Folder className="size-3.5 text-muted-foreground" />
              <span>{projectName}</span>
            </div>
            <div className="ml-4 space-y-1 border-l border-border-visible/50 pl-2 text-[11px] text-muted-foreground">
              <div className="text-foreground font-medium truncate">完善我的报告- 【Part 1】</div>
              <div className="truncate">2026年第一季度...</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2 space-y-1 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2 px-1">
            <Zap className="size-3.5" />
            <span>技能·插件</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2 px-1 text-foreground">
            <span className="text-xs">李 · Jason · io</span>
            <Settings className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main Welcome Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-xl space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-border-visible bg-surface text-foreground shadow-2xs">
              <Bot className="size-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">{welcomeTitle}</h2>
          </div>

          {/* Central Input Box */}
          <div className="rounded-xl border border-border-visible bg-surface p-3.5 space-y-4 shadow-sm">
            <div className="text-xs text-muted-foreground/80 font-sans leading-relaxed min-h-[48px]">
              {promptPlaceholder}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full border border-border-visible bg-surface-raised text-foreground"
                >
                  <Plus className="size-3.5" />
                </button>
                <div className="flex items-center gap-1.5 rounded-full border border-border-visible/80 bg-surface-raised/60 px-2.5 py-1 text-[11px] font-mono text-foreground">
                  <ShieldCheck className="size-3 text-muted-foreground" />
                  <span>默认权限</span>
                  <ChevronDown className="size-2.5 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-border-visible/80 bg-surface-raised/60 px-2.5 py-1 text-[11px] font-mono text-foreground">
                  <Sparkles className="size-3 text-muted-foreground" />
                  <span>{modelName}</span>
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

          {/* Quick suggestions */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["👍 推荐使用", "📖 内容创作", "📊 数据分析", "@ 邮件处理", "📑 学习研究"].map((item, idx) => (
              <div
                key={idx}
                className="rounded-full border border-border-visible bg-surface px-3 py-1 text-xs text-foreground/85 font-mono cursor-pointer hover:border-foreground/60"
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
 * 2.2 Agent 执行流会话页模版 (agent-chat-stream-layout) - 对应截图 2
 */
export function AgentChatStreamLayoutPreview({ props = {} }: { props?: Props }) {
  const sessionTitle = String(val(props, "sessionTitle", "营销活动月度复盘分析报告"));
  const userPrompt = String(
    val(props, "userPrompt", "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。"),
  );
  const agentName = String(val(props, "agentName", "ClawHive 总管"));
  const consumedPoints = String(val(props, "consumedPoints", "21"));
  const elapsedTime = String(val(props, "elapsedTime", "2m 39s"));

  return (
    <div className="flex h-full w-full rounded-2xl border border-border-visible bg-surface text-foreground overflow-hidden font-sans select-none shadow-sm">
      {/* Left Sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-surface flex flex-col justify-between p-3">
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-visible" />
              <span className="size-2.5 rounded-full bg-border-visible" />
              <span className="size-2.5 rounded-full bg-border-visible" />
            </div>
            <span className="ml-1 text-xs font-bold uppercase tracking-wider">AGENT DESKTOP</span>
          </div>
          <div className="rounded-md px-2 py-1 bg-surface-raised text-foreground font-medium truncate">
            {sessionTitle}
          </div>
        </div>

        <div className="border-t border-border pt-2 font-mono text-xs text-muted-foreground">
          <span>李 · Jason · io</span>
        </div>
      </div>

      {/* Main Execution Stream */}
      <div className="flex-1 flex flex-col justify-between bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
          <span className="text-xs font-bold text-foreground truncate">{sessionTitle}</span>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">[ STREAM ACTIVE ]</span>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User message */}
          <div className="flex flex-col items-end space-y-1.5">
            <div className="flex gap-2">
              <span className="rounded-md border border-border-visible bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                openclaw-report.md
              </span>
              <span className="rounded-md border border-border-visible bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                issue_imgs.png
              </span>
            </div>
            <div className="max-w-lg rounded-xl bg-surface-raised border border-border-visible p-3 text-xs text-foreground leading-relaxed">
              {userPrompt}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">5月10日 · 11:45</span>
          </div>

          {/* Agent execution card */}
          <div className="space-y-2 rounded-xl border border-border-visible bg-surface p-3.5">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-foreground" />
                <span className="text-xs font-bold">{agentName}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span>消耗 {consumedPoints} 积分</span>
                <span>·</span>
                <span>已处理 {elapsedTime}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground/90 font-sans">
              <p>我会先判断资料类型和完整性，把会议纪要、任务清单和补充说明分开读，避免一上来就混成散文。</p>
            </div>

            {/* Steps */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between rounded-md border border-border-visible bg-surface-raised px-2.5 py-1 text-xs font-mono">
                <span className="text-foreground">📄 读取输入文件</span>
                <span className="text-[9px] text-[#4A9E5C] uppercase font-bold">[DONE]</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border-visible bg-surface-raised px-2.5 py-1 text-xs font-mono">
                <span className="text-foreground">🔍 检索相关内容</span>
                <span className="text-[9px] text-[#4A9E5C] uppercase font-bold">[DONE]</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border-visible bg-surface-raised px-2.5 py-1 text-xs font-mono">
                <span className="text-foreground">🗂 参考历史记忆</span>
                <span className="text-[9px] text-[#4A9E5C] uppercase font-bold">[DONE]</span>
              </div>
            </div>

            {/* Thinking status */}
            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              <span>思考中...</span>
            </div>
          </div>
        </div>

        {/* Bottom Input */}
        <div className="p-3 border-t border-border bg-surface">
          <div className="flex items-center justify-between rounded-xl border border-border-visible bg-surface-raised px-3 py-2">
            <span className="text-xs text-muted-foreground font-sans">有什么问题请问我吧，输入 / 可调用技能</span>
            <button type="button" className="size-7 rounded-full bg-foreground text-background flex items-center justify-center">
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2.3 Agent 分栏工作台模版 (agent-split-workspace-layout) - 对应截图 3
 */
export function AgentSplitWorkspaceLayoutPreview({ props = {} }: { props?: Props }) {
  const sessionTitle = String(val(props, "sessionTitle", "营销活动月度复盘分析报告"));
  const editingFile = String(val(props, "editingFile", "file:///workspace/northstar-dashboard.html"));

  return (
    <div className="flex h-full w-full rounded-2xl border border-border-visible bg-surface text-foreground overflow-hidden font-sans select-none shadow-sm">
      {/* 1. Left Nav Sidebar (180px) */}
      <div className="w-44 shrink-0 border-r border-border bg-surface p-2.5 flex flex-col justify-between font-mono text-xs">
        <div className="space-y-2">
          <span className="font-bold text-xs">AGENT CLAW</span>
          <div className="rounded bg-surface-raised px-2 py-1 truncate text-foreground">{sessionTitle}</div>
        </div>
        <div className="text-[10px] text-muted-foreground">李 · Jason · io</div>
      </div>

      {/* 2. Middle Stream Pane (360px) */}
      <div className="w-80 shrink-0 border-r border-border bg-background p-3 flex flex-col justify-between overflow-hidden">
        <div className="space-y-3 overflow-y-auto">
          <div className="font-bold text-xs">{sessionTitle}</div>
          <div className="rounded-lg border border-border-visible bg-surface p-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>ClawHive 总管</span>
              <span>2m 39s</span>
            </div>
            <div className="text-[11px] text-muted-foreground">正在为您的项目生成看板控制台代码与监控组件...</div>
            <div className="rounded border border-border-visible bg-surface-raised p-1.5 text-[10px] font-mono">
              [ 写入文件 northstar-dashboard.html ]
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border-visible bg-surface p-2 text-xs text-muted-foreground">
          输入指令...
        </div>
      </div>

      {/* 3. Right Artifact & Live Console Workspace */}
      <div className="flex-1 flex flex-col bg-surface overflow-hidden">
        {/* Tab & Action Bar */}
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5 bg-surface-raised/40">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="rounded bg-surface px-2 py-0.5 border border-border-visible font-bold">
              northstar-dashboard.html
            </span>
            <span className="text-muted-foreground text-[10px]">issue_imgs.png</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full bg-foreground px-3 py-0.5 font-mono text-[10px] text-background uppercase">
              保存并运行
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-background">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground font-sans">Growth Data Overview</h3>
            <span className="font-mono text-[10px] text-[#4A9E5C] border border-[#4A9E5C]/30 bg-[#4A9E5C]/10 px-2 py-0.5 rounded-2xs">
              SAFE SANDBOX 100%
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border-visible bg-surface p-3 space-y-1">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">Safe Sandbox Protection</div>
              <div className="font-mono text-lg font-bold text-foreground">100%</div>
              <div className="text-[10px] text-muted-foreground">17 of 17 protected</div>
            </div>
            <div className="rounded-xl border border-border-visible bg-surface p-3 space-y-1">
              <div className="font-mono text-[10px] text-muted-foreground uppercase">Safe Prompt Protection</div>
              <div className="font-mono text-lg font-bold text-foreground">100%</div>
              <div className="text-[10px] text-muted-foreground">Active monitoring</div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-border-visible bg-surface overflow-hidden">
            <div className="grid grid-cols-3 border-b border-border px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase">
              <span>Agent Name</span>
              <span>Host:Port</span>
              <span className="text-right">Status</span>
            </div>
            {["openclaw", "closetmoon", "silentwave"].map((name, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-border/40 px-3 py-2 text-xs font-mono">
                <span className="text-foreground font-medium">{name}</span>
                <span className="text-muted-foreground text-[11px]">10.242.69.{248 + i}:18789</span>
                <div className="text-right font-bold text-[#4A9E5C] text-[10px]">[ONLINE]</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
    case "agent-home-layout":
      return <AgentHomeLayoutPreview props={props} />;
    case "agent-chat-stream-layout":
      return <AgentChatStreamLayoutPreview props={props} />;
    case "agent-split-workspace-layout":
      return <AgentSplitWorkspaceLayoutPreview props={props} />;
    case "agent-employee-workspace-layout":
      return <AgentEmployeeWorkspaceLayoutPreview props={props} />;
    case "agent-employee-market-layout":
      return <AgentEmployeeMarketLayoutPreview props={props} />;

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

    default:
      return null;
  }
}
