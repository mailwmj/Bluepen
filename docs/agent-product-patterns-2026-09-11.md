# Bluepen 产品型 AI 体验与组件选型补充调研

调研日期：2026-09-11。范围：Lovart、Canva、Figma Make 的官方产品资料，以及 assistant-ui、AI Elements、CopilotKit、Ant Design X、Beautiful UI 的官方文档、源码和 npm 发布元数据。用户所写的「loverart」按 Lovart 理解。

本文件补充 [前一轮调研](agent-experience-research.md)，聚焦「在原型中选中对象，带入对话并直接修改」。旧调研记录的是 2026-09-10 的工作区，不能继续把其中所有缺口当作当前事实。本次只新增本文件，未安装依赖、修改产品代码、覆盖已有研究，未登录体验外部产品或发送真实模型请求。

## 1. 判断与选型建议

Bluepen 应优先形成 **选中对象 → 添加到会话 → 说明修改 → 在原型上看到结果 → 撤销或继续调整** 的短路径。聊天历史、流式回复、停止和重试是基础；真正区别于独立聊天应用的是「这一轮会修改哪个原型对象」始终清楚。

成熟组件能够减少聊天交互的重复开发。建议首先验证 **assistant-ui 的 ExternalStoreRuntime + Base UI 外观组件**，让现有控制器继续管理会话、运行、存储和画布提交。它是本次最契合对象引用与完整会话体验的候选；正式采用取决于一段真实端到端试接结果。若适配复杂度超过收益，则保留当前聊天结构，按需采用 AI Elements / Streamdown 的单项能力。CopilotKit 暂不作为本轮迁移方向，Ant Design X 主要参考结构化输入的交互，Beautiful UI 继续作为视觉与状态卡参考。

所有方案都需要 Bluepen 自己实现对象身份、组层级、模板实例、修改范围、版本冲突和撤销。一个可显示附件的输入框，并不会自动获得这些编辑器能力。

## 2. 产品对标：官方资料确认了什么

以下是官方描述的能力，未作实机成功率、延迟或跨版本一致性验证。

| 产品与场景 | 官方确认的交互 | 对 Bluepen 的启示（建议） |
| --- | --- | --- |
| Lovart：画布进入会话 | 点击画布元素会在输入框中形成 Mention；输入 `@` 可筛选画布对象、资源等。每条输入最多 10 个文件、图片或引用；历史按项目组织。来源：[Chat Tools](https://www.lovart.ai/docs/how-to-prompt/chat-tools)。 | 为选择对象提供明确的「添加到会话」入口；输入框中的引用可定位、移除，发送后在该条消息保留。对象数量上限按 Bluepen 的节点规模验证，不照搬 10。 |
| Lovart：局部与批量修改 | Mark / Touch Edit 会识别并标注图像对象，标记出现在输入框；多个标记可同轮批量编辑。Quick Edit 从选中的图像进入，提供预设与自定义描述。来源：[Advanced AI Editing](https://www.lovart.ai/docs/edit-your-design/advanced-ai-editing)。 | 单对象和多对象共享同一入口；为文字、布局、组件组提供各自合适的快捷建议。Bluepen 已有结构化节点，不必先用视觉模型猜测对象。 |
| Lovart：选择与结果迭代 | 支持 Shift 点击或框选多对象、分组、图层定位；官方说明 AI 编辑会把新版本作为新资产放到画布，保留原始资产。来源：[Customize Your Canvas](https://www.lovart.ai/docs/edit-your-design/customize-your-canvas)、[How Lovart Works](https://www.lovart.ai/docs/getting-started/how-lovart-works)。 | 借鉴引用可见与可逆探索；原型节点的默认修改应由编辑器事务原地完成，可另提供「生成一个变体」。不要把每次改按钮都实现为复制整页。 |
| Canva：选元素或整页后提要求 | 先选元素或页面，再点 Ask Canva，输入要求并自动应用。选整页时提供重新设计、背景、风格等上下文建议；入口可能在评论区域或 AI 侧栏。来源：[Ask Canva 帮助](https://www.canva.com/en_au/help/edit-designs-with-ask-canva/)。 | AI 入口跟随原型编辑任务；无需先进入独立工具再找画布落点。简单、明确的局部编辑不宜强制经过多轮计划确认。 |
| Figma Make：多选、注释与提交 | 当前帮助区分新旧界面：新文件支持框选/Shift 多选和属性面板；调整显示在对话输入上方，Apply 后提交。多个针对元素的注释也能积累后同轮提交；支持预览、恢复版本。来源：[Edit a Figma Make file](https://help.figma.com/hc/en-us/articles/42009840449175-Edit-a-Figma-Make-file)。 | 复杂多目标任务可积累「这个改文案、那个改布局」的指令，再一次提交；明确区分待发送的修改与已经应用的结果。不要只做一串缺乏对象语义的名称。 |
| Figma Make：组件和设计系统作为参考 | 官方示例支持把组件或包含多组件的 Frame 粘贴到输入框作设计参考，也支持选中预览元素后，用附带的设计替换它。来源：[Figma 官方使用建议](https://www.figma.com/blog/8-ways-to-build-with-figma-make/)。 | 模板、组件库条目应能作为参考加入；实际修改目标和参考设计分别标识。只附一个模板不意味着覆盖模板库定义。 |
| Lovart：参考与画布资产的关系 | 上传到会话与加入画布是两种行为；资源库中的资产可附到当前请求。来源：[Adding References](https://www.lovart.ai/docs/how-to-prompt/adding-references)。 | 引用库里的模板或外部图片，无须为了让 AI 看见而先在画布上制造一个无关对象。 |

这些产品的共同模式是：用户在正在操作的作品中指出对象，AI 接收有指向的要求，结果回到作品中。它们对素材格式、提交时机和版本的处理不同，不能据此推断存在统一的行业实现协议。

## 3. Bluepen 应落地的对象协作语义（建议）

### 3.1 两类引用先说清楚

「修改目标」表示这一轮允许编辑的已有对象；「参考」表示希望 AI 借鉴的模板、组件或图片。默认从画布选择添加的是修改目标，从组件/模板库添加的是参考。引用卡显示缩略图或类型图标、名称、所属页面、数量与用途，支持移除和定位。

| 添加的内容 | 默认语义 | 应有行为 |
| --- | --- | --- |
| 单个画布组件 | 修改这个实例 | 修改文字、样式、尺寸或布局时保留可编辑性和关联关系；修改结果指回同一个目标。 |
| 多个独立组件 | 一组明确的修改目标 | 展示数量，可展开名单；共同修改应用于这些目标，支持分别描述要求。不要默认为它们新建永久分组。 |
| 组件组 / 容器 | 修改这个子树 | 以组或容器为引用，保留父子结构；范围包括其子节点，重叠选中的父子目标需去重。 |
| 已放入画布的模板实例 | 修改这一份原型 | 修改实例，不默默改变其他副本或组件库原定义。 |
| 模板库 / 组件库条目 | 设计参考 | 能直接加入会话；用户要求「用这个做页面」时创建可编辑实例，要求「改这个模板」时明确是在画布生成修改后的实例还是编辑库定义。 |
| 整个页面 | 页面级修改 | 显示页面名与范围；涉及大量删除、结构重排或扩展到其他页面时先给具体变更摘要。 |

### 3.2 最短的主流程

1. 用户在画布或图层中选择单个、多组件、组、容器；浮动操作条和右键菜单提供「添加到会话」。组件/模板库也提供相同文案的入口。
2. 打开当前项目的 AI 面板，保留当前会话草稿，把引用加入输入框上方的对象条。重复添加同一对象不产生重复卡片；点击卡片定位原对象。
3. 用户输入「把这三个卡片改成横向布局，保留内容」。发送后消息立即入列，带上实际发送的目标清单；后续在画布另选对象，不改写正在运行这一轮的目标。
4. 显示真实阶段，如「读取 3 个组件」「调整布局」「验证并应用」，长过程可停止。仅在范围或意图存在实质歧义时追问。
5. 对明确范围内可逆的局部编辑，发送即启动编辑；成功后高亮修改区域，并在会话记录「已修改 3 个组件」和定位入口。复杂重构可预览摘要或变体，再一次应用。
6. 同一轮修改进入一个编辑器撤销事务。用户继续说「间距再大一点」时，面板明确显示沿用上轮目标；用户可替换或清空。不会将「这几个」悄悄解释成目前新的选择。

第一阶段推荐对象条放在普通输入框上方：这已能实现用户需要的选择与定向修改，且更容易做好中文输入法、键盘删除、焦点与草稿持久化。`@` 搜索和输入内原子标签可随后接入，不应阻塞主流程。

### 3.3 应由编辑器负责的边界

- 引用保留稳定的项目、页面、对象身份，以及发送时可解释的名称与版本。实际应用前重新读取目标；对象删除、页面变化或版本冲突要在同一条消息里给出具体恢复动作。
- 模型得到结构化节点、支持的属性和必要的周边布局信息；缩略图可辅助视觉理解，不能替代可编辑结构。避免为一个按钮每次发送整个项目。
- 局部修改只接受编辑器支持的结构化操作，先验证后一次提交。名称只是显示信息，不能作为唯一匹配键。
- 运行停止后，未提交的结构化修改丢弃；已成功提交的修改保持清楚记录。停止、重试和撤销分别表达不同操作。
- 失败重试不能重复新增对象或重复应用已完成的变更；如果要在会话中提供「撤销本次」，它必须与具体事务关联。单纯调用全局 undo 可能撤掉用户之后的手工改动。
- 本轮结果留在同一会话，不自动关闭面板。用户可把修改后的对象继续加入下一轮，也可回到图层和属性面板手工调整。

## 4. 当前技术约束

本次读取的工作区清单为 Next.js **16.2.12**、React **19.2.4**、Tailwind **4**、Base UI **1.6**、`ai` **^7.0.94**、`@ai-sdk/openai` **^4.0.62**。因此不能继续按 AI SDK 6 选型。当前 `AgentController` 已持有会话和运行状态，并提供 send、retry、answer、apply 等入口；`AgentContext` 仍只声明项目、页面与锚点，未声明对象引用。

代码依据：[editor 依赖](../packages/editor/package.json)、[app 依赖](../apps/app/package.json)、[Agent 类型](../packages/editor/src/components/editor/agent/agent-types.ts)、[AgentController](../packages/editor/src/components/editor/agent/agent-controller.ts)。这只是组件接入所需的边界核查，不代替完整现状审计或运行测试。

当前 Next 配置包含 `NEXT_EXPORT` 静态导出路径，开发代理并不构成桌面生产的 API 服务。组件示例中的 `/api/chat`、`/api/copilotkit` 需要传输层适配；不能直接复制示例后假定 Tauri 内也存在 Next 服务端路由。依据：[Next 配置](../apps/app/next.config.ts)。

Nothing design 和现有 coss/Base UI 继续控制产品外观。外部组件的渐变、阴影、Toast、shimmer、弹簧动画以及示例全局 CSS，不直接引入产品。

## 5. 成熟组件能力对比

下表的「有」表示官方提供组件或扩展点，并不表示已经接入 Bluepen；「自行实现」表示产品状态和编辑器操作仍由应用负责。

| 方案 | 对象引用 / 附件 | 消息与运行体验 | 会话与状态边界 | Bluepen 的适配判断 |
| --- | --- | --- | --- | --- |
| **assistant-ui** | 附件适配器支持文件、拖放、粘贴；还可用描述对象添加外部引用，无需 File 或上传。提供自定义 `@` 候选与 Base UI 外观。来源：[Attachments](https://www.assistant-ui.com/docs/guides/attachments)、[Mentions](https://www.assistant-ui.com/docs/guides/mentions)。 | 编辑、重新生成、停止、分支和工具结果有明确接入回调；可使用流式 Markdown 渲染器。来源：[ExternalStoreRuntime](https://www.assistant-ui.com/docs/runtimes/custom/external-store)、[Streamdown](https://www.assistant-ui.com/docs/guides/streamdown)。 | ExternalStoreRuntime 读取外部消息和回调；现有存储继续属于应用。线程需要适配器，切换身份必须与宿主状态一致。来源：[Adapters](https://www.assistant-ui.com/docs/runtimes/concepts/adapters)。 | **优先试接，成本中。** 能保留 AgentController 与现有运行时。对象身份和事务仍自建，消息转换不能把问题/计划/应用结果压平成正文。 |
| **Vercel AI Elements** | Prompt Input 有附件、拖放、预览、数量/大小限制与可外置的输入状态；文件输入之外的节点引用自行接入。来源：[Prompt Input](https://elements.ai-sdk.dev/components/prompt-input)。 | Message 提供动作、分支展示、Streamdown Markdown；Conversation 提供自动滚动和返回最新。分支的数据与执行不是 SDK 自动完成的。来源：[Message](https://elements.ai-sdk.dev/components/message)、[Conversation](https://elements.ai-sdk.dev/components/conversation)。 | 按组件复制源码的 UI 层；持久化、提问恢复、修改事务、线程列表依然接现有业务状态。来源：[Introduction](https://elements.ai-sdk.dev/docs)。 | **按件采用的备选，成本低至中。** 最适合补消息渲染、输入或滚动；不为它重写运行时。完整替换仍要补很多产品状态。 |
| **CopilotKit v2** | `useAgentContext` 提供应用上下文；`useFrontendTool` 能执行前端动作，适合把编辑器能力开放给 Agent。引用卡的 UI 与范围规则由应用实现。来源：[Agent Context](https://docs.copilotkit.ai/agent-app-context)、[Frontend Tools](https://docs.copilotkit.ai/frontend-tools)。 | 提供聊天、消息编辑/重生成的外观槽、工具呈现及暂停提问/恢复。来源：[Slots](https://docs.copilotkit.ai/custom-look-and-feel/slots)、[Human-in-the-loop](https://docs.copilotkit.ai/human-in-the-loop)。 | AG-UI 与 Runtime 是整体运行协议。官方 Rich Threads 包含持久化/重连等基础设施；使用自有存储需自己恢复上下文。来源：[OSS 与 Intelligence](https://docs.copilotkit.ai/concepts/oss-vs-enterprise)、[Rich Threads](https://docs.copilotkit.ai/threads)。 | **本轮不优先，成本高。** 产品内 AI 的方向很接近，但已有 AI SDK 与控制器无需为一块聊天界面改为另一套 Agent 平台。 |
| **Ant Design X** | Sender 的 `tag/custom` 词槽适合对象标签；Attachments 支持文件列表、粘贴/拖放配合。来源：[Sender](https://x.ant.design/components/sender/)、[Attachments](https://x.ant.design/components/attachments/)。 | X Markdown 支持流式内容；useXChat 提供请求、终止、重新生成、消息更新及状态。来源：[X Markdown](https://x.ant.design/x-markdowns/introduce/)、[useXChat](https://x.ant.design/x-sdks/use-x-chat/)。 | Conversations 提供会话列表/切换；数据接入、持久化和运行工具语义仍需业务处理。来源：[Conversations](https://x.ant.design/components/conversations/)。 | **以交互参考为主，整套接入成本高。** 已有 Ant Design 项目更合适；这里引入 antd 及独立样式体系收益有限。 |
| **Beautiful UI** | Prompt Bar 展示 `@` 资源，Context Cards 展示引用信息；另有 Selection Actions。来源：[官网组件](https://www.beautifului.dev/)。 | Thinking、Tool Chips、Task Rows、Approval Card、Diff Table 是可参考的界面部件。 | 当前核查到的是组件展示与源码交付，未获得可替代运行时、会话持久化或画布修改协议的证据。 | **继续作样式与卡片参考。** 外观落地成本低，整套 Agent 业务成本仍由 Bluepen 承担。不能把示例动效视为运行能力。 |

### 5.1 assistant-ui 的两个重要细节

官方附件与 Mention registry 已提供 **Base UI 外观**，可与本项目的原语体系对齐；但 npm 核心 `@assistant-ui/react` 仍依赖 `radix-ui`。选择 Base UI 外观不代表最终依赖中完全没有 Radix。应检查真实产物体积与交互行为，而不是从「headless」推断没有额外成本。来源：[附件官方说明](https://www.assistant-ui.com/docs/guides/attachments)、[核心 package.json](https://github.com/assistant-ui/assistant-ui/blob/main/packages/react/package.json)。

`@` 能力的部分 API 带 `Unstable_` / `unstable_` 标记；普通 textarea 会显示序列化 directive 文本，若要输入内的原子标签，需要 `@assistant-ui/react-lexical` 与 Lexical。第一版可以保留对象条和普通输入框，避免为了标签外观引入完整富文本编辑器；后续将不稳定接口隔离在小适配层。来源：[Mentions 的输入模式与 API](https://www.assistant-ui.com/docs/guides/mentions)。

### 5.2 AI Elements 的版本与桌面边界

官网明确针对 React 19 和 Tailwind 4，Next 14+，技术代际与本项目大体一致；但是调研时组件源码 workspace 仍声明 `ai: ^6.0.105`。本项目是 AI SDK 7，不能仅凭两者都叫 AI SDK 就宣称类型已兼容。按件采用时核查所用组件的具体类型、注册表依赖、coss 插槽和构建输出。来源：[Setup](https://elements.ai-sdk.dev/docs/setup)、[源码 package.json](https://github.com/vercel/ai-elements/blob/main/packages/elements/package.json)。

`PromptInput` 示例同时包含 Next `/api/chat` 服务端代码；它是示例传输方案。纯消息展示和输入组件可继续连接当前本地控制器，使用完整 useChat 示例则必须处理 Tauri 生产传输。来源：[Prompt Input 示例](https://elements.ai-sdk.dev/components/prompt-input)。

### 5.3 CopilotKit 和 Ant Design X 的范围代价

CopilotKit OSS 不要求使用其外部托管服务，但内置持久线程与跨设备同步的产品能力属于 Intelligence 范围；自有存储仍可使用 OSS。已有 Tauri 本地历史不应仅为会话列表迁往托管平台。`useAgentContext` 提供读取上下文，`useFrontendTool` 提供实际前端执行，这一组合值得借鉴，但两者不会替代编辑器版本检查和事务。来源：[OSS 与 Intelligence](https://docs.copilotkit.ai/concepts/oss-vs-enterprise)、[Frontend Tools](https://docs.copilotkit.ai/frontend-tools)。

Ant Design X 的 UI 包当前要求 `antd: ^6.1.1`，而 `@ant-design/x-sdk` 可以独立使用、无需 antd。问题不是它不能运行 React 19，而是完整 UI 需要引入新的样式与组件体系，独立 SDK 又会与现有 AI SDK/控制器重叠。来源：[UI 包清单](https://github.com/ant-design/x/blob/main/packages/x/package.json)、[SDK 包清单](https://github.com/ant-design/x/blob/main/packages/x-sdk/package.json)。

### 5.4 优先试接的 5 个部件

先用 `useExternalStoreRuntime` 映射现有状态与回调，Controller、持久化和 AI SDK 7 运行时继续作为业务事实的唯一来源。以下部件逐项引入；**React peer 范围和依赖声明只是兼容线索，本轮尚未安装，AI SDK 7、Next 16 与 Tauri 的实际兼容性均未验证。**

| 部件 / API | 优先解决的问题 | 适配要求与官方入口 |
| --- | --- | --- |
| `ThreadPrimitive.Root / Viewport / ScrollToBottom` | 完整时间线、上滚阅读、返回最新 | 保留 Bluepen 面板布局；默认历史 Skeleton 改为项目规定的文本状态，防止自动聚焦抢走画布焦点。[Thread](https://www.assistant-ui.com/elements/thread) |
| `ComposerPrimitive.Root / Input / Send / Cancel` | 输入、发送、停止及编辑状态 | 接现有发送/取消回调，保留每会话草稿和中文输入规则；停模型与退出消息编辑按对应 composer 语义处理。[Message Editing 示例](https://www.assistant-ui.com/docs/guides/editing) |
| `Attachment` 与 `aui.composer.addAttachment(descriptor)` | 选中对象加入会话、显示和删除引用 | 采用 Base UI 外观；引用的 ID、类型、目标/参考语义与发送快照由 Bluepen 自己保存。[Attachments](https://www.assistant-ui.com/docs/guides/attachments) |
| `ActionBarPrimitive.Edit` 与 ExternalStore 的 `onEdit / onReload` | 修改问题、重试和重新生成 | 编辑历史消息必须有业务定义，不能隐式回滚画布或重新应用已完成的旧变更；第一版可只开放最后一轮。[Editing](https://www.assistant-ui.com/docs/guides/editing)、[ExternalStoreRuntime](https://www.assistant-ui.com/docs/runtimes/custom/external-store) |
| `StreamdownTextPrimitive` | 流式 Markdown、表格和未闭合内容 | 仅启用实际需要的插件；Tailwind monorepo 的 `@source` 路径与 tokens 映射必须核查。[Streamdown Renderer](https://www.assistant-ui.com/docs/guides/streamdown) |

## 6. 许可与维护快照

以下版本来自 2026-09-11 读取的 npm `latest` 标签与对应发布时间，不能把 GitHub 主分支版本号、CLI 版本和注册表源码版本混为一谈。它们提供维护活动的证据，不代表 Bluepen 已安装或验证兼容性。

| 包 / 项目 | 当日公开发布快照 | 许可与说明 | 来源 |
| --- | --- | --- | --- |
| `@assistant-ui/react` | 0.15.18，2026-09-03 | MIT；peer 支持 React 18/19 | [npm 官方发布元数据](https://registry.npmjs.org/@assistant-ui%2freact)、[源码](https://github.com/assistant-ui/assistant-ui/blob/main/packages/react/package.json) |
| `@assistant-ui/ai-sdk` | 0.0.4，2026-09-03 | MIT；该版本依赖 `ai: ^7.0.85`。若走 ExternalStoreRuntime，不必为了 UI 改用这个运行适配包 | [npm 官方发布元数据](https://registry.npmjs.org/@assistant-ui%2fai-sdk) |
| `ai-elements` CLI | 1.9.0，2026-03-12 | Apache-2.0；CLI 版本不是每个复制组件的独立版本 | [npm 官方发布元数据](https://registry.npmjs.org/ai-elements)、[LICENSE](https://github.com/vercel/ai-elements/blob/main/LICENSE) |
| `@copilotkit/react-core` | 1.71.0，2026-09-09 | npm 与仓库 LICENSE 为 MIT；当前 OSS 文档另写 Apache 2.0，存在资料不一致。正式采用应以锁定版本内 LICENSE 与相关包许可为依据 | [npm 官方发布元数据](https://registry.npmjs.org/@copilotkit%2freact-core)、[仓库 LICENSE](https://github.com/CopilotKit/CopilotKit/blob/main/LICENSE)、[存在差异的官方说明](https://docs.copilotkit.ai/concepts/oss-vs-enterprise) |
| `@ant-design/x` | 2.9.0，2026-07-28 | MIT；peer 包含 antd 6.1.1+ 与 React 18+ | [npm 官方发布元数据](https://registry.npmjs.org/@ant-design%2fx)、[源码清单](https://github.com/ant-design/x/blob/main/packages/x/package.json) |
| Beautiful UI | 本轮未取得同等级的包版本/发布记录证据 | MIT；复制实质代码时保留其版权与许可声明 | [官方许可](https://www.beautifului.dev/license) |
| `streamdown`（可单独采用） | 2.6.0，2026-08-24 | Apache-2.0；peer 支持 React 18/19 | [npm 官方发布元数据](https://registry.npmjs.org/streamdown) |

## 7. 采用组件前的最小验证与决策标准（建议）

组件试接应该在隔离分支或独立样例中验证同一条业务链：现有 AgentController → 一个真实对象引用 → 流式回复 → 修改已选组件 → 编辑器撤销 → 重启后历史可定位。没有完成这条链之前，只能说「组件候选可用」，不能说「已支持对象定向编辑」。

| 验证项 | 接受标准 |
| --- | --- |
| 中文输入与引用 | 输入法确认不误发送；引用能用键盘定位/移除；添加多组件不丢草稿；超量、失效引用有就地反馈。 |
| 状态适配 | 提问、待应用、运行、停止、失败、已修改不被统一成 loading；用户切会话不会串消息或目标；无虚构进度。 |
| 对象修改 | 单对象、多对象、嵌套组、模板实例分别可修改；引用模板库不会覆写库定义；未选择对象不被顺带改动。 |
| 应用与恢复 | 中断或重试不重复应用；目标在运行中删除或被手工修改时能识别；一轮修改可正确撤销。 |
| 流式阅读 | Markdown 未闭合时仍可阅读；用户上滚后不抢滚动；错误与重试留在相应消息旁。 |
| 平台与样式 | Next Web 与 Tauri 静态生产构建分别通过；深浅主题与 coss 交互一致；不会新增整套全局样式覆盖。 |
| 实际成本 | 记录必要改动、增量依赖和产物体积，比较与当前控制器直接补齐的实现规模；没有测量就不给性能和开发天数承诺。 |

组件选择服务于这条业务链。如果 assistant-ui 能以小适配层减少输入、消息操作与滚动维护，就采用它；如果需要为它重构当前运行和存储，则采用 AI Elements / Streamdown 的局部能力，把开发重点留给对象引用与安全的可编辑结果。
