import React, { useState, useRef, useEffect } from "react";
import type { ComponentRenderContext } from "./renderers";
import { cn } from "@bluepen/editor/lib/utils";
import { computeShapeStyle } from "../utils/shape-styles";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Package,
  Database,
  File,
  CheckSquare,
  Square,
} from "lucide-react";

type Props = Record<string, string | number | boolean>;

const val = (props: Props, key: string, fallback: string | number | boolean) =>
  props[key] ?? fallback;

export interface FileItem {
  name: string;
  type: string;
  owner: string;
  location: string;
  time: string;
  rawType?: string;
}

function inferFileType(name: string, explicitType?: string): string {
  if (explicitType && explicitType.trim()) {
    const t = explicitType.trim().toLowerCase();
    if (["folder", "dir", "directory"].includes(t)) return "folder";
    if (["doc", "docx", "txt", "word", "document"].includes(t)) return "doc";
    if (["md", "markdown", "code", "ts", "js", "py", "rs", "json"].includes(t)) return "code";
    if (["sheet", "xlsx", "xls", "csv", "table"].includes(t)) return "sheet";
    if (["img", "png", "jpg", "jpeg", "svg", "fig", "figma"].includes(t)) return "image";
    if (["zip", "tar", "gz", "rar", "archive"].includes(t)) return "archive";
    if (["data", "dataset", "jsonl", "db"].includes(t)) return "database";
    return t;
  }

  const lower = name.toLowerCase();
  if (lower.includes("文件夹") || !lower.includes(".")) return "folder";
  if (lower.endsWith(".docx") || lower.endsWith(".doc") || lower.endsWith(".txt") || lower.endsWith(".pdf")) return "doc";
  if (lower.endsWith(".md") || lower.endsWith(".ts") || lower.endsWith(".js") || lower.endsWith(".py") || lower.endsWith(".rs")) return "code";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) return "sheet";
  if (lower.endsWith(".fig") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".svg")) return "image";
  if (lower.endsWith(".zip") || lower.endsWith(".tar") || lower.endsWith(".gz")) return "archive";
  if (lower.endsWith(".json") || lower.endsWith(".jsonl") || lower.endsWith(".parquet")) return "database";
  return "file";
}

export function parseFileItems(rawItems: unknown, fallbackStr: string): FileItem[] {
  const str = typeof rawItems === "string" && rawItems.trim() ? rawItems : fallbackStr;
  const lines = str.split("\n").map((l) => l.trim()).filter(Boolean);

  return lines.map((line) => {
    // Format: name:type:owner:location:time
    const parts = line.split(":");
    const name = parts[0]?.trim() || "未命名文件";
    const explicitType = parts[1]?.trim();
    const owner = parts[2]?.trim() || "—";
    const location = parts[3]?.trim() || "—";
    const time = parts[4]?.trim() || parts[parts.length - 1]?.trim() || "刚刚";

    return {
      name,
      type: inferFileType(name, explicitType),
      rawType: explicitType,
      owner,
      location,
      time,
    };
  });
}

export function serializeFileItems(items: FileItem[]): string {
  return items
    .map((it) => `${it.name}:${it.rawType || it.type}:${it.owner}:${it.location}:${it.time}`)
    .join("\n");
}

function renderFileIcon(type: string) {
  switch (type) {
    case "folder":
      return <Folder className="size-4 text-muted-foreground" />;
    case "doc":
      return <FileText className="size-4 text-muted-foreground" />;
    case "code":
      return <FileCode className="size-4 text-muted-foreground" />;
    case "sheet":
      return <FileSpreadsheet className="size-4 text-muted-foreground" />;
    case "image":
      return <ImageIcon className="size-4 text-muted-foreground" />;
    case "archive":
      return <Package className="size-4 text-muted-foreground" />;
    case "database":
      return <Database className="size-4 text-muted-foreground" />;
    default:
      return <File className="size-4 text-muted-foreground" />;
  }
}

export const DEFAULT_WEB_FILES = `未命名文件夹:folder:leo:我的资料:15 小时前
未命名文档:doc:leo:我的资料:15 小时前
未命名文件夹:folder:leo:我的资料:16 小时前
未命名文件夹:folder:leo:我的资料:18 小时前
WB资料库功能调研文档:doc:leo:我的资料:4 天前
品牌设计规范与组件库.fig:image:leo:设计资产:2 天前
核心运营分析数据.xlsx:sheet:leo:统计归档:1 天前
系统核心路由配置.ts:code:leo:代码仓库:3 天前`;

export const DEFAULT_AGENT_FILES = `企业产品服务白皮书_v3.pdf:doc:Claw Agent:已向量化 (14.2k tokens):10 分钟前
客户常见支持问答.jsonl:database:客服知识库:已向量化 (8.5k tokens):1 小时前
API架构工程手册.md:code:工程架构组:解析中 [88%]:刚刚
用户需求调研录音.txt:doc:体验设计部:排队中:2 小时前
行业竞品分析矩阵.xlsx:sheet:战略规划组:已向量化 (6.1k tokens):1 天前
核心术语标准字典.docx:doc:标准化委员会:已向量化 (3.4k tokens):3 天前`;

export function FileListPreview({
  props = {},
  context,
  mode = "web",
}: {
  props?: Props;
  context?: ComponentRenderContext;
  mode?: "web" | "agent";
}) {
  const fallbackStr = mode === "agent" ? DEFAULT_AGENT_FILES : DEFAULT_WEB_FILES;
  const defaultCols = mode === "agent" ? "语料名称,维护者,挂载状态,最近索引" : "名称,所有者,位置,最近访问";
  const rawCols = String(val(props, "columns", defaultCols));
  const cols = rawCols.split(",").map((c) => c.trim()).filter(Boolean);

  const rawItems = val(props, "items", fallbackStr);
  const items = parseFileItems(rawItems, fallbackStr);
  const showHeader = Boolean(val(props, "showHeader", true));
  const showCheckbox = Boolean(val(props, "showCheckbox", true));
  const showIcon = Boolean(val(props, "showIcon", true));
  const showActionCol = Boolean(val(props, "showActionCol", false));
  const rawActions = String(val(props, "actions", "下载,分享,删除"));
  const actionList = rawActions.split(",").map((a) => a.trim()).filter(Boolean);

  const [selectedIdxs, setSelectedIdxs] = useState<number[]>([]);
  const [editingCell, setEditingCell] = useState<{
    rowIdx: number;
    field: "name" | "owner" | "location" | "time";
  } | null>(null);
  const [editingHeaderCol, setEditingHeaderCol] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const containerStyle = computeShapeStyle(props, {
    fill: "var(--surface)",
    stroke: "var(--border-visible)",
    borderWidth: 1,
    radius: 8,
  });

  useEffect(() => {
    if ((editingCell !== null || editingHeaderCol !== null) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell, editingHeaderCol]);

  const commitCellEdit = () => {
    if (!editingCell) return;
    const nextItems = [...items];
    const target = { ...nextItems[editingCell.rowIdx] };
    const valTrimmed = editVal.trim();
    if (valTrimmed) {
      target[editingCell.field] = valTrimmed;
    }
    nextItems[editingCell.rowIdx] = target;
    context?.onUpdateProps?.({ items: serializeFileItems(nextItems) });
    setEditingCell(null);
  };

  const commitHeaderEdit = () => {
    if (editingHeaderCol === null) return;
    const nextCols = [...cols];
    const valTrimmed = editVal.trim();
    if (valTrimmed) {
      nextCols[editingHeaderCol] = valTrimmed;
    }
    context?.onUpdateProps?.({ columns: nextCols.join(",") });
    setEditingHeaderCol(null);
  };

  useEffect(() => {
    if (!context?.isSelected) {
      if (editingCell) commitCellEdit();
      if (editingHeaderCol !== null) commitHeaderEdit();
    }
  }, [context?.isSelected]);

  const toggleSelect = (idx: number) => {
    setSelectedIdxs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIdxs.length === items.length) {
      setSelectedIdxs([]);
    } else {
      setSelectedIdxs(items.map((_, i) => i));
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden font-sans select-none bg-surface"
      style={containerStyle}
    >
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            {showCheckbox && <col className="w-10" />}
            <col className="w-auto" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="w-28" />
            {showActionCol && <col className="w-32" />}
          </colgroup>

          {showHeader && (
            <thead className="sticky top-0 z-10 border-b border-border bg-surface-raised/95 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80 backdrop-blur-xs">
              <tr className="h-9">
                {showCheckbox && (
                  <th className="w-10 px-3 py-2 text-center align-middle">
                    <div
                      className="flex size-4 cursor-pointer items-center justify-center transition-colors hover:text-foreground"
                      onClick={toggleSelectAll}
                    >
                      {selectedIdxs.length > 0 && selectedIdxs.length === items.length ? (
                        <CheckSquare className="size-3.5 text-foreground" />
                      ) : (
                        <Square className="size-3.5 text-muted-foreground/70" />
                      )}
                    </div>
                  </th>
                )}

                {/* Col 0: Name */}
                <th
                  className="px-3 py-2 font-medium align-middle cursor-pointer transition-colors hover:text-foreground"
                  title="双击编辑列名"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingHeaderCol(0);
                    setEditVal(cols[0] || "名称");
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {showIcon && <span className="size-4 shrink-0 invisible" aria-hidden />}
                    {editingHeaderCol === 0 ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={commitHeaderEdit}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            commitHeaderEdit();
                          } else if (e.key === "Escape") {
                            setEditingHeaderCol(null);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="h-5 w-full rounded border border-foreground bg-background px-1 font-sans text-xs text-foreground outline-none"
                      />
                    ) : (
                      <span className="truncate">{cols[0] || "名称"}</span>
                    )}
                  </div>
                </th>

                {/* Col 1: Owner */}
                <th
                  className="w-28 px-3 py-2 font-medium align-middle cursor-pointer transition-colors hover:text-foreground"
                  title="双击编辑列名"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingHeaderCol(1);
                    setEditVal(cols[1] || "所有者");
                  }}
                >
                  {editingHeaderCol === 1 ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={commitHeaderEdit}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter" || e.key === "Tab") {
                          e.preventDefault();
                          commitHeaderEdit();
                        } else if (e.key === "Escape") {
                          setEditingHeaderCol(null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-5 w-full rounded border border-foreground bg-background px-1 font-sans text-xs text-foreground outline-none"
                    />
                  ) : (
                    <span className="truncate block">{cols[1] || "所有者"}</span>
                  )}
                </th>

                {/* Col 2: Location / State */}
                <th
                  className="w-36 px-3 py-2 font-medium align-middle cursor-pointer transition-colors hover:text-foreground"
                  title="双击编辑列名"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingHeaderCol(2);
                    setEditVal(cols[2] || "位置");
                  }}
                >
                  {editingHeaderCol === 2 ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={commitHeaderEdit}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter" || e.key === "Tab") {
                          e.preventDefault();
                          commitHeaderEdit();
                        } else if (e.key === "Escape") {
                          setEditingHeaderCol(null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-5 w-full rounded border border-foreground bg-background px-1 font-sans text-xs text-foreground outline-none"
                    />
                  ) : (
                    <span className="truncate block">{cols[2] || "位置"}</span>
                  )}
                </th>

                {/* Col 3: Time */}
                <th
                  className="w-28 px-3 py-2 font-medium align-middle cursor-pointer transition-colors hover:text-foreground"
                  title="双击编辑列名"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingHeaderCol(3);
                    setEditVal(cols[3] || "最近访问");
                  }}
                >
                  {editingHeaderCol === 3 ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={commitHeaderEdit}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter" || e.key === "Tab") {
                          e.preventDefault();
                          commitHeaderEdit();
                        } else if (e.key === "Escape") {
                          setEditingHeaderCol(null);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="h-5 w-full rounded border border-foreground bg-background px-1 font-sans text-xs text-foreground outline-none"
                    />
                  ) : (
                    <span className="truncate block">{cols[3] || "最近访问"}</span>
                  )}
                </th>

                {/* Col 4: Action Header */}
                {showActionCol && (
                  <th className="w-32 px-3 py-2 font-medium text-right align-middle">
                    操作
                  </th>
                )}
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-border/60">
            {items.map((item, idx) => {
              const isSelected = selectedIdxs.includes(idx);
              const isParsing = item.location.includes("解析中") || item.location.includes("排队中");

              return (
                <tr
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={cn(
                    "group h-10 text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-surface-raised/80"
                      : "hover:bg-surface-raised/40"
                  )}
                >
                  {showCheckbox && (
                    <td className="w-10 px-3 py-2 text-center align-middle">
                      <div className="flex size-4 items-center justify-center">
                        {isSelected ? (
                          <CheckSquare className="size-3.5 text-foreground" />
                        ) : (
                          <Square className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  )}

                  {/* Col 0: Icon + Name */}
                  <td
                    className="px-3 py-2 align-middle cursor-text"
                    title="双击修改名称"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ rowIdx: idx, field: "name" });
                      setEditVal(item.name);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {showIcon && <span className="shrink-0">{renderFileIcon(item.type)}</span>}
                      {editingCell?.rowIdx === idx && editingCell.field === "name" ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={commitCellEdit}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" || e.key === "Tab") {
                              e.preventDefault();
                              commitCellEdit();
                            } else if (e.key === "Escape") {
                              setEditingCell(null);
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="h-6 w-full rounded border border-foreground bg-background px-1.5 font-sans text-xs font-medium text-foreground outline-none ring-1 ring-border-visible"
                        />
                      ) : (
                        <span className="truncate font-medium text-foreground hover:underline">
                          {item.name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Col 1: Owner */}
                  <td
                    className="w-28 px-3 py-2 align-middle cursor-text"
                    title="双击修改所有者"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ rowIdx: idx, field: "owner" });
                      setEditVal(item.owner);
                    }}
                  >
                    {editingCell?.rowIdx === idx && editingCell.field === "owner" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            commitCellEdit();
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="h-6 w-full rounded border border-foreground bg-background px-1.5 font-sans text-xs text-foreground outline-none ring-1 ring-border-visible"
                      />
                    ) : (
                      <span className="truncate block text-muted-foreground font-sans text-[11.5px]">
                        {item.owner}
                      </span>
                    )}
                  </td>

                  {/* Col 2: Location / State */}
                  <td
                    className="w-36 px-3 py-2 align-middle cursor-text"
                    title="双击修改位置或状态"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ rowIdx: idx, field: "location" });
                      setEditVal(item.location);
                    }}
                  >
                    {editingCell?.rowIdx === idx && editingCell.field === "location" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            commitCellEdit();
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="h-6 w-full rounded border border-foreground bg-background px-1.5 font-mono text-xs text-foreground outline-none ring-1 ring-border-visible"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-muted-foreground/80">
                        {isParsing && (
                          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        )}
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                  </td>

                  {/* Col 3: Time */}
                  <td
                    className="w-28 px-3 py-2 align-middle cursor-text"
                    title="双击修改时间"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingCell({ rowIdx: idx, field: "time" });
                      setEditVal(item.time);
                    }}
                  >
                    {editingCell?.rowIdx === idx && editingCell.field === "time" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            commitCellEdit();
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="h-6 w-full rounded border border-foreground bg-background px-1.5 font-mono text-xs text-foreground outline-none ring-1 ring-border-visible"
                      />
                    ) : (
                      <span className="truncate block font-mono text-[11px] text-muted-foreground/70">
                        {item.time}
                      </span>
                    )}
                  </td>

                  {/* Col 4: Actions */}
                  {showActionCol && (
                    <td className="w-32 px-3 py-2 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {actionList.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors",
                              act === "删除"
                                ? "text-red-500 hover:bg-red-500/10"
                                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                            )}
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
