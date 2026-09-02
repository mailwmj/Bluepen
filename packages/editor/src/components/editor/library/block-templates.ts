import type { ComponentType, EditorElement } from "../types";

function genId() {
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeChild(
  type: ComponentType,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId: string,
  props: Record<string, string | number | boolean> = {},
): EditorElement {
  return {
    id: genId(),
    type,
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    autoLayout: null,
    parentId,
    props,
    children: [],
  };
}

export const BLOCK_TEMPLATE_TYPES = new Set<string>([
  // Web 业务模版
  "web-button-group",
  "web-admin-layout",
  "web-filter-bar",
  "web-crud-table",
  "web-form-layout",
  "web-login-card",
  "web-steps-form",
  "web-dashboard-page",
  "web-settings-page",
  "web-pricing-table",
  "web-faq-section",

  // Agent 完整模版与复合侧栏
  "agent-nav-sidebar",
  "agent-home-layout",
  "agent-chat-stream-layout",
  "agent-split-workspace-layout",
  "agent-employee-workspace-layout",
  "agent-employee-market-layout",
]);

export function isBlockTemplate(type: string): boolean {
  return BLOCK_TEMPLATE_TYPES.has(type);
}

/**
 * Instantiates a Business Block Template as a Group container populated with atomic components.
 */
export function createBlockTemplateGroup(
  type: ComponentType,
  posX: number,
  posY: number,
  parentId: string | null = null,
): EditorElement | null {
  const groupId = genId();

  switch (type) {
    // 0. 操作按钮组 (标准操作按钮组合)
    case "web-button-group": {
      const width = 340;
      const height = 36;
      const children: EditorElement[] = [
        makeChild("web-button", "主要按钮", 0, 0, 108, 36, groupId, {
          text: "新建实例",
          variant: "primary",
          size: "md",
          shape: "rectangle",
          icon: "Plus",
        }),
        makeChild("web-button", "次要按钮", 116, 0, 108, 36, groupId, {
          text: "批量导出",
          variant: "secondary",
          size: "md",
          shape: "rectangle",
          icon: "Download",
        }),
        makeChild("web-button", "危险按钮", 232, 0, 108, 36, groupId, {
          text: "批量删除",
          variant: "danger",
          size: "md",
          shape: "rectangle",
          icon: "Trash2",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "操作按钮组",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 1. 复合查询筛选栏
    case "web-filter-bar": {
      const width = 920;
      const height = 56;
      const children: EditorElement[] = [
        makeChild("rectangle", "筛选底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 8,
        }),
        makeChild("web-input", "关键词搜索", 12, 10, 220, 36, groupId, {
          label: "",
          placeholder: "输入搜索关键词...",
          prefixText: "",
        }),
        makeChild("web-select", "部门选择器", 244, 10, 200, 36, groupId, {
          label: "",
          placeholder: "所属部门",
          selected: "全部部门",
        }),
        makeChild("web-date-range-picker", "统计周期选择", 456, 10, 260, 36, groupId, {
          label: "",
          startDate: "2026-08-01",
          endDate: "2026-08-31",
          quickTag: "近30天",
        }),
        makeChild("web-button", "查询按钮", 728, 10, 84, 36, groupId, {
          text: "查询",
          variant: "primary",
          shape: "rectangle",
        }),
        makeChild("web-button", "重置按钮", 820, 10, 84, 36, groupId, {
          text: "重置",
          variant: "secondary",
          shape: "rectangle",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "复合查询筛选栏",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 2. 增删改查表格页
    case "web-crud-table": {
      const width = 960;
      const height = 520;
      const children: EditorElement[] = [
        makeChild("rectangle", "页面背景", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "页面标题", 20, 18, 240, 24, groupId, {
          text: "服务集群实例列表",
          fontSize: 15,
          fontWeight: 700,
        }),
        makeChild("web-button", "新建实例按钮", 736, 14, 100, 32, groupId, {
          text: "+ 新建实例",
          variant: "primary",
          shape: "rectangle",
        }),
        makeChild("web-button", "导出数据按钮", 844, 14, 96, 32, groupId, {
          text: "批量导出",
          variant: "secondary",
          shape: "rectangle",
        }),
        // Filter bar items
        makeChild("web-input", "过滤关键词", 20, 60, 220, 34, groupId, {
          label: "",
          placeholder: "搜索实例名称/ID...",
        }),
        makeChild("web-select", "环境筛选", 252, 60, 180, 34, groupId, {
          label: "",
          selected: "运行环境: 全部",
        }),
        makeChild("web-button", "筛选查询", 444, 60, 76, 34, groupId, {
          text: "查询",
          variant: "primary",
          shape: "rectangle",
        }),
        // Table
        makeChild("web-table", "集群数据表格", 20, 106, 920, 340, groupId, {
          columns: "应用服务,版本号,所属集群,运行状态,最后更新,操作",
          rowCount: 5,
        }),
        // Pagination
        makeChild("web-pagination", "表格分页器", 420, 464, 520, 38, groupId, {
          current: 1,
          total: 128,
          pageSize: 10,
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "增删改查表格页",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 3. 标准表单录入页
    case "web-form-layout": {
      const width = 640;
      const height = 460;
      const children: EditorElement[] = [
        makeChild("rectangle", "表单容器", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "表单标题", 24, 20, 300, 24, groupId, {
          text: "新建企业微服务实例",
          fontSize: 15,
          fontWeight: 700,
        }),
        makeChild("divider", "分割线", 24, 52, 592, 1, groupId, { text: "" }),
        makeChild("web-input", "实例名称输入", 24, 72, 280, 56, groupId, {
          label: "实例名称",
          placeholder: "例如：核心订单微服务",
          required: true,
        }),
        makeChild("web-select", "所属环境选择", 336, 72, 280, 56, groupId, {
          label: "所属环境",
          selected: "华南生产集群 01",
        }),
        makeChild("web-date-range-picker", "有效周期选择", 24, 148, 280, 56, groupId, {
          label: "有效周期",
          startDate: "2026-09-01",
          endDate: "2027-09-01",
        }),
        makeChild("web-input-number", "副本数量步进器", 336, 148, 280, 56, groupId, {
          label: "初始副本数",
          value: 3,
          unit: "节点",
        }),
        makeChild("web-textarea", "需求背景说明", 24, 224, 592, 96, groupId, {
          label: "需求背景描述",
          placeholder: "请输入服务详细描述与发布说明...",
          maxLength: 200,
        }),
        makeChild("divider", "底部底线", 24, 386, 592, 1, groupId, { text: "" }),
        makeChild("web-button", "重置按钮", 436, 404, 80, 36, groupId, {
          text: "重置",
          variant: "secondary",
          shape: "pill",
        }),
        makeChild("web-button", "提交按钮", 526, 404, 90, 36, groupId, {
          text: "保存并提交",
          variant: "primary",
          shape: "pill",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "标准表单录入页",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 4. 用户登录卡片
    case "web-login-card": {
      const width = 380;
      const height = 420;
      const children: EditorElement[] = [
        makeChild("rectangle", "登录卡片容器", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "系统标题", 24, 26, 332, 24, groupId, {
          text: "用户认证与登录中心",
          fontSize: 14,
          fontWeight: 700,
          textAlign: "center",
        }),
        makeChild("text", "副标题说明", 24, 54, 332, 20, groupId, {
          text: "请使用企业域账号与动态密码登录",
          fontSize: 10,
          color: "var(--text-secondary)",
          textAlign: "center",
        }),
        makeChild("web-input", "邮箱账号输入", 24, 92, 332, 56, groupId, {
          label: "账号邮箱",
          placeholder: "admin@enterprise.local",
        }),
        makeChild("web-input", "登录密码输入", 24, 164, 332, 56, groupId, {
          label: "登录密码",
          placeholder: "••••••••••••",
        }),
        makeChild("web-checkbox-group", "记住我选项", 24, 236, 160, 32, groupId, {
          label: "",
          options: "记住登录凭证",
          checkedIndices: "0",
        }),
        makeChild("link", "忘记密码链接", 256, 236, 100, 32, groupId, {
          text: "忘记密码?",
        }),
        makeChild("web-button", "立即登录按钮", 24, 292, 332, 42, groupId, {
          text: "立即登录",
          variant: "primary",
          shape: "rectangle",
        }),
        makeChild("text", "技术支持提示", 24, 356, 332, 20, groupId, {
          text: "如遇登录异常请联系统一运维支持团队",
          fontSize: 9.5,
          color: "var(--text-disabled)",
          textAlign: "center",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "用户登录卡片",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 5. 分步向导表单
    case "web-steps-form": {
      const width = 760;
      const height = 440;
      const children: EditorElement[] = [
        makeChild("rectangle", "向导底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("web-steps", "步骤指示条", 24, 20, 712, 64, groupId, {
          steps: "填写基本信息,配置权限策略,关联数据源,完成创建",
          current: 2,
        }),
        makeChild("divider", "分割线", 24, 94, 712, 1, groupId, { text: "" }),
        makeChild("text", "步骤标题", 24, 114, 400, 24, groupId, {
          text: "第二步：配置集群访问策略与网络路由",
          fontSize: 13,
          fontWeight: 700,
        }),
        makeChild("web-input", "服务标识", 24, 150, 344, 56, groupId, {
          label: "集群服务标识",
          placeholder: "例如：gateway-core-v2",
        }),
        makeChild("web-select", "网络路由", 392, 150, 344, 56, groupId, {
          label: "专有网络方案",
          selected: "高级专有网络 VPC-01",
        }),
        makeChild("web-radio-group", "部署模式", 24, 226, 344, 40, groupId, {
          label: "部署模式",
          options: "高可用集群,单机测试",
          selectedIndex: 0,
        }),
        makeChild("web-switch", "容灾开关", 392, 226, 344, 40, groupId, {
          label: "开启跨可用区自动容灾热备",
          checked: true,
        }),
        makeChild("divider", "底部分割线", 24, 366, 712, 1, groupId, { text: "" }),
        makeChild("web-button", "上一步按钮", 24, 384, 96, 36, groupId, {
          text: "上一步",
          variant: "secondary",
          shape: "pill",
        }),
        makeChild("web-button", "下一步按钮", 616, 384, 120, 36, groupId, {
          text: "下一步: 关联数据",
          variant: "primary",
          shape: "pill",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "分步向导表单",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 6. 中后台管理总览
    case "web-admin-layout": {
      const width = 1080;
      const height = 640;
      const children: EditorElement[] = [
        makeChild("web-top-nav", "顶部导航栏", 0, 0, 1080, 60, groupId, {
          logoText: "后台管理控制中心",
          links: "概览仪表盘,项目管理,数据资产,团队协作,系统配置",
          activeIndex: 0,
          userName: "系统管理员",
        }),
        makeChild("web-menu", "侧边导航菜单", 0, 60, 220, 580, groupId, {
          title: "控制台导航",
          showCategories: true,
          category1: "核心工作台",
          items1: "分析概览,实时大屏",
          category2: "系统与权限",
          items2: "用户列表,角色策略,审计日志",
          activeKey: "分析概览",
        }),
        makeChild("web-breadcrumb", "面包屑导航", 240, 76, 400, 28, groupId, {
          path: "工作台 / 核心工作台 / 分析概览",
        }),
        makeChild("web-statistic-card", "活跃用户指标卡", 240, 116, 260, 110, groupId, {
          title: "今日活跃用户",
          value: "148,290",
          delta: "+18.4%",
          isPositive: true,
        }),
        makeChild("web-statistic-card", "集群负载指标卡", 512, 116, 260, 110, groupId, {
          title: "计算集群负载",
          value: "68.5%",
          delta: "-2.1%",
          isPositive: true,
        }),
        makeChild("web-statistic-card", "并发请求指标卡", 784, 116, 276, 110, groupId, {
          title: "实时并发请求",
          value: "24,510/s",
          delta: "+8.2%",
          isPositive: true,
        }),
        makeChild("web-table", "运行实例列表", 240, 240, 820, 380, groupId, {
          columns: "服务名称,版本号,所属集群,运行状态,最后更新,操作",
          rowCount: 6,
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "中后台管理总览",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 7. 经营数据大屏看板
    case "web-dashboard-page": {
      const width = 960;
      const height = 560;
      const children: EditorElement[] = [
        makeChild("rectangle", "看板底卡", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "看板大标题", 20, 18, 300, 24, groupId, {
          text: "企业级运营监控与数据总览",
          fontSize: 15,
          fontWeight: 700,
        }),
        makeChild("web-button", "导出报表按钮", 844, 16, 96, 32, groupId, {
          text: "导出报表",
          variant: "secondary",
          shape: "rectangle",
        }),
        makeChild("web-statistic-card", "用户总量卡片", 20, 60, 296, 110, groupId, {
          title: "活跃用户总数",
          value: "148,290",
          delta: "+18.4%",
          isPositive: true,
        }),
        makeChild("web-statistic-card", "负载指标卡片", 332, 60, 296, 110, groupId, {
          title: "集群计算负载",
          value: "68.5%",
          delta: "-2.1%",
          isPositive: true,
        }),
        makeChild("web-statistic-card", "告警指标卡片", 644, 60, 296, 110, groupId, {
          title: "服务中断告警",
          value: "0 次",
          delta: "正常",
          isPositive: true,
        }),
        makeChild("web-chart", "趋势图表", 20, 186, 520, 350, groupId, {
          title: "周访问量与算力消耗趋势分析",
          series: "周一:320,周二:420,周三:580,周四:490,周五:720,周六:860,周日:950",
        }),
        makeChild("web-timeline", "业务发布轴", 556, 186, 384, 350, groupId, {
          events: "14:32 提交发布单:done,14:35 自动化单元测试通过:done,14:40 灰度发布至50%流量:process,15:00 全量上线:pending",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "经营数据大屏看板",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 8. 系统与个人配置
    case "web-settings-page": {
      const width = 840;
      const height = 520;
      const children: EditorElement[] = [
        makeChild("rectangle", "配置页面底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("web-menu", "设置导航菜单", 16, 16, 200, 488, groupId, {
          title: "设置目录",
          showCategories: false,
          items1: "个人资料,账号安全,团队成员,消息通知,审计日志",
          activeKey: "个人资料",
        }),
        makeChild("text", "设置项标题", 240, 20, 300, 24, groupId, {
          text: "个人中心与安全配置",
          fontSize: 15,
          fontWeight: 700,
        }),
        makeChild("text", "设置项说明", 240, 48, 400, 20, groupId, {
          text: "维护您的账户基本资料与访问权限",
          fontSize: 11,
          color: "var(--text-secondary)",
        }),
        makeChild("divider", "设置分割线", 240, 76, 580, 1, groupId, { text: "" }),
        makeChild("web-input", "用户姓名输入", 240, 96, 280, 56, groupId, {
          label: "用户姓名",
          placeholder: "系统管理员",
        }),
        makeChild("web-input", "联系邮箱输入", 540, 96, 280, 56, groupId, {
          label: "联系邮箱",
          placeholder: "admin@system.local",
        }),
        makeChild("web-select", "组织架构选择", 240, 176, 280, 56, groupId, {
          label: "所属组织架构",
          selected: "技术中台 / 架构组",
        }),
        makeChild("web-radio-group", "界面主题单选", 540, 176, 280, 56, groupId, {
          label: "默认界面主题",
          options: "深色模式,浅色模式,跟随系统",
          selectedIndex: 0,
        }),
        makeChild("web-checkbox-group", "通知复选框", 240, 256, 580, 56, groupId, {
          label: "订阅系统消息通知",
          options: "系统安全告警,集群故障转移,资源到期提醒,每周运营周报",
          checkedIndices: "0,1,2",
        }),
        makeChild("divider", "底部分割线", 240, 436, 580, 1, groupId, { text: "" }),
        makeChild("web-button", "取消更改按钮", 630, 456, 80, 36, groupId, {
          text: "取消",
          variant: "secondary",
          shape: "pill",
        }),
        makeChild("web-button", "保存更改按钮", 720, 456, 100, 36, groupId, {
          text: "保存更改",
          variant: "primary",
          shape: "pill",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "系统与个人配置",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 9. 产品版本对比矩阵
    case "web-pricing-table": {
      const width = 840;
      const height = 460;
      const children: EditorElement[] = [
        makeChild("rectangle", "价格底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "矩阵标题", 20, 20, 800, 24, groupId, {
          text: "服务版本规格与价格方案",
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
        }),
        makeChild("text", "矩阵副标题", 20, 48, 800, 20, groupId, {
          text: "根据业务规模按需选择最合适方案，支持弹性升降配",
          fontSize: 11,
          color: "var(--text-secondary)",
          textAlign: "center",
        }),
        // Plan 1: Starter
        makeChild("rectangle", "基础版卡片", 24, 88, 250, 344, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 8,
        }),
        makeChild("text", "基础版标题", 40, 104, 218, 22, groupId, {
          text: "基础版 (Free)",
          fontSize: 14,
          fontWeight: 700,
        }),
        makeChild("text", "基础版价格", 40, 132, 218, 28, groupId, {
          text: "¥ 0 /月",
          fontSize: 20,
          fontWeight: 700,
        }),
        makeChild("text", "基础版说明", 40, 166, 218, 60, groupId, {
          text: "适合个人开发者与轻量级测试项目，提供基础算力托管与社区支持。",
          fontSize: 10,
          color: "var(--text-secondary)",
        }),
        makeChild("web-button", "免费开启按钮", 40, 372, 218, 36, groupId, {
          text: "免费开启",
          variant: "secondary",
          shape: "pill",
        }),
        // Plan 2: Pro (Featured)
        makeChild("rectangle", "专业版卡片", 295, 88, 250, 344, groupId, {
          fill: "var(--background)",
          stroke: "var(--foreground)",
          borderWidth: 1,
          radius: 8,
        }),
        makeChild("text", "专业版标题", 311, 104, 218, 22, groupId, {
          text: "专业版 (Pro) ★推荐",
          fontSize: 14,
          fontWeight: 700,
        }),
        makeChild("text", "专业版价格", 311, 132, 218, 28, groupId, {
          text: "¥ 199 /月",
          fontSize: 20,
          fontWeight: 700,
        }),
        makeChild("text", "专业版说明", 311, 166, 218, 60, groupId, {
          text: "适合快速成长的研发团队，提供自动化高可用与多副本容灾热备。",
          fontSize: 10,
          color: "var(--text-secondary)",
        }),
        makeChild("web-button", "立即选购按钮", 311, 372, 218, 36, groupId, {
          text: "立即选购",
          variant: "primary",
          shape: "pill",
        }),
        // Plan 3: Enterprise
        makeChild("rectangle", "企业版卡片", 566, 88, 250, 344, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 8,
        }),
        makeChild("text", "企业版标题", 582, 104, 218, 22, groupId, {
          text: "企业定制版",
          fontSize: 14,
          fontWeight: 700,
        }),
        makeChild("text", "企业版价格", 582, 132, 218, 28, groupId, {
          text: "定制报价",
          fontSize: 20,
          fontWeight: 700,
        }),
        makeChild("text", "企业版说明", 582, 166, 218, 60, groupId, {
          text: "专属私有化集群部署，7×24小时专属技术支持与 SLA 保障。",
          fontSize: 10,
          color: "var(--text-secondary)",
        }),
        makeChild("web-button", "联系顾问按钮", 582, 372, 218, 36, groupId, {
          text: "联系顾问",
          variant: "secondary",
          shape: "pill",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "产品版本对比矩阵",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 10. 常见问题答疑模块
    case "web-faq-section": {
      const width = 720;
      const height = 380;
      const children: EditorElement[] = [
        makeChild("rectangle", "答疑底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "答疑标题", 20, 20, 680, 24, groupId, {
          text: "常见问题与技术支持解答",
          fontSize: 16,
          fontWeight: 700,
        }),
        makeChild("text", "答疑副标题", 20, 48, 680, 20, groupId, {
          text: "针对部署架构、数据安全及团队协作的详细解答",
          fontSize: 11,
          color: "var(--text-secondary)",
        }),
        makeChild("web-collapse", "问答折叠面板", 20, 80, 680, 276, groupId, {
          panels: "支持哪些私有化部署架构？:全面支持容器化云原生部署、物理服务器集群及混合云环境:open;数据如何保证高可靠与灾备？:内置多副本实时数据同步与自动化快照备份恢复能力;是否支持多角色权限控制？:全面支持 RBAC 细粒度权限控制与团队组织架构协同",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "常见问题答疑模块",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // =========================================================================
    // Agent 侧栏与完整模版 (Agent Sidebar & Full Layout Templates)
    // =========================================================================

    // 10. 智能体导航侧栏 (复合区块模版)
    case "agent-nav-sidebar": {
      const width = 240;
      const height = 640;
      const children: EditorElement[] = [
        makeChild("rectangle", "侧栏底框", 0, 0, width, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId, {
          appName: "AGENT CLAW",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId, {
          options: "对话,AI员工",
          active: "对话",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId, {
          title: "置顶会话",
          items: "营销活动月度复盘分析...:active,市场趋势与竞争分析",
        }),
        makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId, {
          projectName: "Project-A",
          items: "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 490, 216, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 12, 586, 216, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "智能体侧边栏",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 11. Agent 对话主页
    case "agent-home-layout": {
      const width = 1080;
      const height = 680;
      const children: EditorElement[] = [
        makeChild("rectangle", "应用窗口底框", 0, 0, width, height, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 16,
        }),
        // 左侧栏子元素
        makeChild("rectangle", "侧栏底框", 0, 0, 240, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId, {
          appName: "AGENT DESKTOP",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId, {
          options: "对话,AI员工",
          active: "对话",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId, {
          title: "置顶会话",
          items: "完善我的报告- 【Part 1】:active,市场趋势与竞争分析",
        }),
        makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId, {
          projectName: "Project-A",
          items: "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 530, 216, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 12, 626, 216, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),

        // 中间主区域
        makeChild("circle", "智能体标志底座", 620, 120, 80, 80, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
        }),
        makeChild("text", "欢迎主标题", 400, 214, 520, 36, groupId, {
          text: "Hi, 有什么可以帮你？",
          fontSize: 20,
          fontWeight: 700,
          align: "center",
          textColor: "var(--foreground)",
        }),
        makeChild("agent-prompt-box", "核心对话输入框", 380, 270, 560, 140, groupId, {
          placeholder: "有什么问题请问我吧，输入 / 可调用技能",
          permissionText: "默认权限",
          modelName: "高级推理模型",
          projectScope: "Project-A",
        }),
        makeChild("agent-prompt-suggestions", "快捷建议技能组", 380, 428, 560, 38, groupId, {
          items: "👍 推荐使用,📖 内容创作,📊 数据分析,@ 邮件处理,📑 学习研究,🔍 市场调研",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "Agent对话主页",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 12. Agent 执行流会话页
    case "agent-chat-stream-layout": {
      const width = 1080;
      const height = 680;
      const children: EditorElement[] = [
        makeChild("rectangle", "会话窗口底框", 0, 0, width, height, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 16,
        }),
        // 左侧栏
        makeChild("rectangle", "侧栏底框", 0, 0, 240, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId, {
          appName: "AGENT DESKTOP",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId, {
          options: "对话,AI员工",
          active: "对话",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId, {
          title: "置顶会话",
          items: "营销活动月度复盘分析报告:active,市场趋势与竞争分析",
        }),
        makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId, {
          projectName: "Project-A",
          items: "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 530, 216, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 12, 626, 216, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),

        // 中间主区域
        makeChild("agent-session-header", "顶部会话标题栏", 240, 0, 840, 48, groupId, {
          title: "营销活动月度复盘分析报告",
          badge: "STREAM ACTIVE",
        }),
        makeChild("agent-file-attachments", "用户上下文附件组", 620, 64, 420, 36, groupId, {
          files: "openclaw-report.md:doc,issue_imgs.png:img",
        }),
        makeChild("agent-user-message", "用户提问气泡", 520, 108, 520, 68, groupId, {
          prompt: "/Skill maker 帮我整理最近关于 OpenClaw 的热门讨论，顺便参考我上传的需求说明和截图。",
          projectScope: "Project-A",
        }),
        makeChild("agent-stream-header", "智能体响应头部", 260, 186, 780, 44, groupId, {
          agentName: "ClawHive 总管",
          consumedPoints: "21",
          elapsedTime: "2m 39s",
        }),
        makeChild("agent-thought-stream", "思考推理流", 260, 238, 780, 72, groupId, {
          statusText: "思考中...",
          thoughtContent: "我会先判断资料类型和完整性，把会议纪要、任务清单和补充说明分开读，避免一上来就混成散文...",
          isThinking: true,
        }),
        makeChild("agent-tool-step", "步骤1-读取输入文件", 260, 318, 780, 38, groupId, {
          toolType: "file",
          toolLabel: "读取输入文件",
          detail: "已解析 openclaw-report.docx (1.2MB)",
          status: "done",
        }),
        makeChild("agent-tool-step", "步骤2-检索全网讨论", 260, 364, 780, 38, groupId, {
          toolType: "search",
          toolLabel: "检索全网热门讨论与社区反馈",
          detail: "检索全网最新 24 条相关讨论",
          status: "done",
        }),
        makeChild("agent-tool-step", "步骤3-参考历史记忆", 260, 410, 780, 38, groupId, {
          toolType: "memory",
          toolLabel: "参考历史复盘记忆库",
          detail: "命中 3 个关联上下文片段",
          status: "done",
        }),
        makeChild("agent-prompt-box", "底部核心输入框", 260, 532, 780, 128, groupId, {
          placeholder: "有什么问题请问我吧，输入 / 可调用技能",
          modelName: "高级推理模型",
          permissionText: "默认权限",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "Agent执行流会话页",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 13. Agent 分栏工作台
    case "agent-split-workspace-layout": {
      const width = 1200;
      const height = 680;
      const children: EditorElement[] = [
        makeChild("rectangle", "分栏工作台底框", 0, 0, width, height, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 16,
        }),
        // 左侧栏组件群
        makeChild("rectangle", "侧栏底框", 0, 0, 200, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 8, 12, 184, 28, groupId, {
          appName: "AGENT CLAW",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 8, 48, 184, 32, groupId, {
          options: "对话,AI员工",
          active: "对话",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 8, 88, 184, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 8, 130, 184, 96, groupId, {
          title: "置顶会话",
          items: "营销活动月度复盘分析...:active,市场趋势与竞争分析",
        }),
        makeChild("agent-project-tree", "项目与会话树", 8, 234, 184, 200, groupId, {
          projectName: "Project-A",
          items: "完善我的报告- 【Part 1】:active,2026年第一季度规划:loading,编辑我的演示文档",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 8, 530, 184, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 8, 626, 184, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),

        // 中间会话分栏
        makeChild("rectangle", "中间会话分栏底框", 200, 0, 380, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-session-header", "会话标题状态栏", 200, 0, 380, 42, groupId, {
          title: "营销活动月度复盘分析报告",
          badge: "",
        }),
        makeChild("agent-stream-header", "执行流头部", 216, 48, 348, 42, groupId, {
          agentName: "ClawHive 总管",
          consumedPoints: "16",
          elapsedTime: "2m 39s",
        }),
        makeChild("agent-thought-stream", "推理思考过程", 216, 98, 348, 72, groupId, {
          statusText: "生成代码中...",
          thoughtContent: "正在为您的项目生成看板控制台代码与监控组件...",
        }),
        makeChild("agent-tool-step", "工件写入步骤", 216, 178, 348, 40, groupId, {
          toolType: "code",
          toolLabel: "写入文件 northstar-dashboard.html",
          detail: "已生成 3 个控制台图表与防护卡片",
          status: "done",
        }),
        makeChild("agent-prompt-box", "中间底部快速输入框", 216, 546, 348, 114, groupId, {
          placeholder: "输入指令继续调整...",
          modelName: "高级推理模型",
        }),

        // 右侧工件与控制台
        makeChild("agent-artifact-tabs", "工件多标签工作栏", 580, 0, 620, 46, groupId, {
          tabs: "northstar-dashboard.html:active,issue_imgs.png,summary-spec.md",
          filePath: "file:///workspace/northstar-dashboard.html",
        }),
        makeChild("text", "工件预览大标题", 604, 64, 360, 28, groupId, {
          text: "Growth Data Overview",
          fontSize: 16,
          fontWeight: 700,
          textColor: "var(--foreground)",
        }),
        makeChild("web-statistic-card", "沙箱安全防护指标卡", 604, 104, 284, 100, groupId, {
          title: "SAFE SANDBOX PROTECTION",
          value: "100%",
          delta: "17 of 17 protected",
          isPositive: true,
        }),
        makeChild("web-statistic-card", "Prompt安全防护指标卡", 896, 104, 284, 100, groupId, {
          title: "SAFE PROMPT PROTECTION",
          value: "100%",
          delta: "Active monitoring",
          isPositive: true,
        }),
        makeChild("agent-console-table", "实例运行监控表格", 604, 216, 576, 390, groupId, {
          title: "Agentic CAS 实例监控",
          rowCount: 5,
        }),
        makeChild("web-button", "保存并运行操作按钮", 1064, 622, 116, 36, groupId, {
          text: "保存并运行",
          variant: "primary",
          shape: "pill",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "Agent分栏工作台",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 14. AI 员工专属工作台
    case "agent-employee-workspace-layout": {
      const width = 1080;
      const height = 680;
      const children: EditorElement[] = [
        makeChild("rectangle", "员工工作台底框", 0, 0, width, height, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 16,
        }),
        // 左侧栏
        makeChild("rectangle", "侧栏底框", 0, 0, 240, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId, {
          appName: "AGENT DESKTOP",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId, {
          options: "对话,AI员工",
          active: "AI员工",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId, {
          title: "专属员工",
          items: "销售宝 (对话类):active,流程画师,视觉设计师",
        }),
        makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId, {
          projectName: "Project-D",
          items: "营销物料生成:active,季度PPT策划,销售对练模拟",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 530, 216, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 12, 626, 216, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),

        // 中间主区域
        makeChild("circle", "角色头像底座", 620, 36, 68, 68, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
        }),
        makeChild("text", "角色名称文本", 400, 114, 512, 26, groupId, {
          text: "销售宝 (对话类)",
          fontSize: 18,
          fontWeight: 700,
          align: "center",
          textColor: "var(--foreground)",
        }),
        makeChild("text", "角色描述文本", 340, 144, 632, 20, groupId, {
          text: "支持产品问答、PPT 制作、销售对练和营销内容生成",
          fontSize: 12,
          textColor: "var(--text-secondary)",
          align: "center",
        }),
        makeChild("text", "模版分类标题", 280, 180, 400, 24, groupId, {
          text: "[ PPT制作 模版 ]",
          fontSize: 13,
          fontWeight: 700,
          textColor: "var(--foreground)",
        }),
        makeChild("agent-template-card", "模版卡片1-新一代智能体", 280, 212, 240, 120, groupId, {
          title: "新一代智能体",
          subtitle: "Next-Gen Agent",
          category: "PPT / 报告",
        }),
        makeChild("agent-template-card", "模版卡片2-LoRA大模型", 532, 212, 240, 120, groupId, {
          title: "LoRA大模型适配",
          subtitle: "Low-Rank Adaptation",
          category: "技术白皮书",
        }),
        makeChild("agent-template-card", "模版卡片3-2026行业周刊", 784, 212, 240, 120, groupId, {
          title: "2026行业周刊",
          subtitle: "Industry Weekly",
          category: "资讯汇总",
        }),
        makeChild("agent-template-card", "模版卡片4-智能健康助手", 280, 344, 240, 120, groupId, {
          title: "智能健康助手",
          subtitle: "Health Companion",
          category: "业务企划",
        }),
        makeChild("agent-template-card", "模版卡片5-自动驾驶系统", 532, 344, 240, 120, groupId, {
          title: "自动驾驶系统",
          subtitle: "Autonomous Driving",
          category: "技术架构",
        }),
        makeChild("agent-template-card", "模版卡片6-空白模版", 784, 344, 240, 120, groupId, {
          title: "空白模版",
          subtitle: "Blank Template",
          category: "自由创作",
        }),
        makeChild("agent-prompt-toolbar", "场景参数配置条", 280, 480, 744, 38, groupId, {
          projectScope: "Project-D",
          pageCount: "4-6 页",
          ratio: "16:9",
          language: "中文",
        }),
        makeChild("agent-prompt-box", "核心对话输入框", 280, 528, 744, 122, groupId, {
          placeholder: "有什么问题请问我吧，输入 / 可调用技能",
          modelName: "高级推理模型",
          projectScope: "Project-D",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "AI员工专属工作台",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    // 15. AI 员工技能市场
    case "agent-employee-market-layout": {
      const width = 1080;
      const height = 680;
      const children: EditorElement[] = [
        makeChild("rectangle", "技能市场底框", 0, 0, width, height, groupId, {
          fill: "var(--background)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 16,
        }),
        // 左侧栏
        makeChild("rectangle", "侧栏底框", 0, 0, 240, height, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border)",
          borderWidth: 1,
          radius: 0,
        }),
        makeChild("agent-sidebar-header", "侧栏窗口头部", 12, 12, 216, 28, groupId, {
          appName: "AGENT DESKTOP",
          showDots: true,
        }),
        makeChild("agent-mode-switch", "模式切换分段器", 12, 48, 216, 32, groupId, {
          options: "对话,AI员工",
          active: "AI员工",
        }),
        makeChild("agent-new-task-button", "新建任务按钮", 12, 88, 216, 34, groupId, {
          text: "新建任务",
          icon: "Plus",
        }),
        makeChild("agent-session-list", "置顶会话列表", 12, 130, 216, 96, groupId, {
          title: "置顶会话",
          items: "技能市场:active,我的员工,招聘中心",
        }),
        makeChild("agent-project-tree", "项目与会话树", 12, 234, 216, 200, groupId, {
          projectName: "Project-D",
          items: "热门推荐:active,研发技术类,内容创作类",
        }),
        makeChild("agent-sidebar-nav", "侧栏快捷导航组", 12, 530, 216, 88, groupId, {
          items: "技能·插件:Zap,知识库:FileText,定时任务:Clock",
        }),
        makeChild("agent-user-footer", "用户身份与设置底栏", 12, 626, 216, 44, groupId, {
          userName: "李 · Jason · io",
          role: "Pro Workspace",
        }),

        // 中间主区域
        makeChild("rectangle", "市场横幅容器底框", 268, 20, 784, 78, groupId, {
          fill: "var(--surface)",
          stroke: "var(--border-visible)",
          borderWidth: 1,
          radius: 12,
        }),
        makeChild("text", "市场大标题", 288, 32, 360, 26, groupId, {
          text: "AI 员工管理与技能市场",
          fontSize: 16,
          fontWeight: 700,
          textColor: "var(--foreground)",
        }),
        makeChild("text", "市场副标题说明", 288, 62, 420, 20, groupId, {
          text: "为您的智能体提供预封装且可复用的最佳实践与工具",
          fontSize: 11,
          textColor: "var(--text-secondary)",
        }),
        makeChild("web-input", "员工检索输入框", 808, 38, 224, 42, groupId, {
          placeholder: "搜索 AI 员工...",
        }),
        makeChild("text", "分类标签指示条", 268, 110, 400, 24, groupId, {
          text: "[ 推荐招募 ]    企业预置    个人创建",
          fontSize: 12,
          fontWeight: 700,
          textColor: "var(--foreground)",
        }),
        makeChild("agent-employee-card", "员工卡片1-流程画师", 268, 144, 248, 140, groupId, {
          name: "流程画师",
          tags: "结构绘制,数据分析",
          description: "将复杂想法转化为高保真清晰流程图",
        }),
        makeChild("agent-employee-card", "员工卡片2-市场经理", 536, 144, 248, 140, groupId, {
          name: "市场经理",
          tags: "规划分析,协调资源",
          description: "负责市场规划与增长策略推进",
        }),
        makeChild("agent-employee-card", "员工卡片3-物流专家", 804, 144, 248, 140, groupId, {
          name: "物流专家",
          tags: "供应链,智能仓储",
          description: "管理供应链优化运输与流转路径",
        }),
        makeChild("agent-employee-card", "员工卡片4-广告策划师", 268, 300, 248, 140, groupId, {
          name: "广告策划师",
          tags: "创意企划,文案传播",
          description: "制定广告创意与策略，确保有效传播",
        }),
        makeChild("agent-employee-card", "员工卡片5-视觉设计师", 536, 300, 248, 140, groupId, {
          name: "视觉设计师",
          tags: "界面美学,品牌形象",
          description: "负责产品视觉效果与统一品牌调性",
        }),
        makeChild("agent-employee-card", "员工卡片6-内容策略师", 804, 300, 248, 140, groupId, {
          name: "内容策略师",
          tags: "内容架构,精准触达",
          description: "制定内容方向，确保信息清晰吸引人",
        }),
        makeChild("agent-prompt-box", "底部快捷对话输入框", 268, 526, 784, 126, groupId, {
          placeholder: "有什么问题请问我吧，输入 / 可调用技能",
          modelName: "高级推理模型",
          projectScope: "Project-D",
        }),
      ];

      return {
        id: groupId,
        type: "group",
        name: "AI员工技能市场",
        x: posX,
        y: posY,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        autoLayout: null,
        parentId,
        props: {},
        children,
      };
    }

    default:
      return null;
  }
}
