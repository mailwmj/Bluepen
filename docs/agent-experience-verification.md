# Agent 体验改造验证记录

日期：2026-09-10。对应 [改造计划](./agent-experience-plan.md)。现有未提交改动在本轮开始时已经存在，本轮在其基础上增量实现；没有提交、发布或调用真实模型服务。

## 交付与证据

| 需求 | 实现位置 | 验证证据 |
| --- | --- | --- |
| 独立设置页 | `agent-settings-page.tsx`、顶栏设置入口 | 静态生产预览实际保存 API 地址/测试 Key/默认模型；连接测试完成真实 SDK 工具往返与严格输出解析；未保存返回提示已验证 |
| 凭据隔离与迁移 | `agent-storage.ts`、Rust `agent_credentials.rs` | 4 项存储回归覆盖 Web 迁移、失败保留旧数据、桌面命令路径与凭据库失败；macOS 原生凭据库独立临时条目的写/读/删测试通过 |
| 新建和历史管理 | `agent-controller.ts`、`agent-panel.tsx` | 浏览器验证新建、切换、重命名、标题搜索、归档、恢复、删除；刷新后恢复草稿；控制器回归验证双角色消息和独立项目恢复 |
| 完整消息流、执行与思考 | `agent-runtime.ts`、`agent-message.tsx` | 浏览器展示实际组件检索完成与 Markdown 回复；SDK 回归断言工具开始/结束事件和原始 reasoning delta，未凭空生成思考文本 |
| Ask human | 严格输出 schema、控制器及 QuestionCard | 浏览器必答空提交被拒绝、自由文本+多选提交后继续生成；选择与补充回答切换会话后保留；单元回归验证答案草稿重载和重复提交只续跑一次 |
| 方案确认和拒绝 | 控制器、`agent-canvas.ts` | 浏览器确认前 0 图层，确认后 9 图层，面板保留且可定位；拒绝方案图层数不变；回归断言重复应用只创建一个结果 |
| 页面目标与项目隔离 | 稳定项目 ID、方案目标快照 | 浏览器切至 Page 2 后确认按钮替换为“前往目标页面”，回到 Page 1 才能生成；新建另一个 Untitled 显示空会话；单元回归拒绝错误项目/页面 |
| 停止、失败与恢复 | 控制器独立于面板挂载 | 浏览器收起再打开仍为运行中；停止后保持已停止；模拟 429 后换模型重试成功；单元回归验证迟到回调隔离、中断状态恢复、保存失败重试 |
| 键盘、滚动与主题 | 会话面板、消息卡和 Nothing tokens | 浏览器验证 Ctrl+Enter 发送；合成输入法 composing 事件前后接口调用次数不变；问题卡定位到开头；深浅主题和 900px 窗口检查，面板无页面横向溢出 |

## 自动化检查

- `corepack pnpm test`：**101 项通过，0 失败**。包含 13 项真实 AI SDK + Responses 协议测试、9 项控制器/画布行为测试、4 项 Agent 存储测试，以及原有编辑器回归。
- `corepack pnpm typecheck`：编辑器与应用类型检查通过。
- `BLUEPEN_BUILD_DIR=.next-agent-check NEXT_EXPORT=true corepack pnpm --filter app exec next build --webpack`：静态生产导出通过；验证无需 Node `/api/chat` 服务即可运行的桌面构建模式。
- `cargo check --locked --manifest-path apps/app/src-tauri/Cargo.toml`：通过。
- `cargo test --manifest-path apps/app/src-tauri/Cargo.toml native_credential_round_trip -- --ignored`：**1 项原生凭据读写删除检查通过**；使用单独验证 service/account，未接触用户 API Key。
- `git diff --check`、本地 QA 服务语法检查通过。

## 可复现的浏览器验收

1. 运行 `node packages/editor/tests/agent-fixture-server.mjs`，仅监听本机 `127.0.0.1:4319`。
2. 构建静态页面，使用 `python3 -m http.server 4174 --bind 127.0.0.1 --directory apps/app/.next-agent-check` 打开独立预览。
3. 在设置中填写 `http://127.0.0.1:4319`、任意测试 Key 和 `fixture` 模型，保存并测试连接。
4. 发送包含“先讨论”或“梳理”的任务，接口返回必答单选与选答多选，提交后返回原型方案。
5. 使用 `fixture-slow` 测试收起/停止；使用 `fixture-error` 测试 429 与重试；普通 `fixture` 返回已验证的原型 fixture。
6. 检查新建/历史/归档/删除、页面切换、方案确认/拒绝与生成定位。测试服务不导入生产入口，不构成失败后的假数据回退。

## 验证边界

验证完成后已停止本轮本地模拟接口、独立开发服务和静态预览服务；临时构建产物已移出工作区。

当前助手能力是讨论并新增可编辑原型；不声称读取当前选择、直接修改已有图层或并发执行多个 Agent。聊天完整历史保存在本机，不随 `.bluepen` 文件导出；导出的项目保留稳定 ID。

重启恢复历史与待回答/待确认内容；不重建已断开的网络流，原运行显示为中断并允许重试。Web Key 使用 sessionStorage，关闭标签页后重新填写；桌面使用系统凭据库。

浏览器完整流程在静态生产预览与本地 Responses 模拟服务上验证；没有使用真实用户 Key 进行联网生成，没有打包或发布安装包。原生凭据存储在 macOS 实测，Windows/Linux 仅保留相应 keyring 后端配置，未实机验收。

最后一轮补测时浏览器验收空间已关闭，因此未再次执行“浏览器重载待回答/运行中任务”的补测；对应持久化和中断行为已有直接加载生产控制器的自动化回归。窄窗检查发现工具栏靠近输入区域，已将其按剩余画布空间定位；此最终定位修正通过代码与构建检查，未再截图。其余上述浏览器流程均已实际完成。

原有开发服务在依赖变化后停留于恢复画面；本次使用独立生产导出验证。类型检查曾遇到 iCloud 生成的 `* 2.ts` 重复缓存，将这些生成文件备份移出后通过，未修改业务类型以绕过错误。
