# 架构设计：组件注册

## 概述

所有可用组件通过统一注册表管理。当前阶段组件为内置预设，存放在 `domains/widgets/*`，注册接口不限定来源，后续可扩展。

---

## 组件定义

每个内置组件为独立模块，导出一个 `WidgetDefinition`：

```typescript
interface WidgetDefinition<T = unknown> {
  /** 唯一类型标识，对应 Widget Schema 中的 type 字段 */
  type: string;
  /** 元信息 */
  meta: WidgetMeta;
  /** 默认 custom_data 预设值 */
  defaultCustomData: T;
  /** 默认 Widget Schema 覆盖（尺寸、mode 等） */
  defaultSchema?: Partial<Widget<T>>;
  /** 渲染实现 */
  render: WidgetRenderMap;
  /** 属性面板配置（仅 editor） */
  inspector?: WidgetInspector;
  /** 插槽声明（若为容器类组件） */
  slots?: SlotDeclaration[];
}
```

### 元信息

```typescript
interface WidgetMeta {
  /** 显示名称（i18n key） */
  name: string;
  /** 分类标识，用于 Toolbox 分组展示 */
  category: string;
  /** 图标 */
  icon: string;
  /** 描述（i18n key） */
  description?: string;
}
```

### 渲染实现

组件区分编辑态和查看态的渲染：

```typescript
interface WidgetRenderMap {
  /** 编辑态渲染组件 */
  editor: ComponentType<WidgetRenderProps>;
  /** 查看态渲染组件 */
  viewer: ComponentType<WidgetRenderProps>;
}

interface WidgetRenderProps<T = unknown> {
  /** 当前 widget 的 custom_data */
  data: T;
}
```

> 组件渲染实现内部通过 Toolkit 的 `useWidgetToolkit()` 获取完整能力（读取 schema、订阅变更、执行更新），`WidgetRenderProps` 仅传入 `custom_data` 作为初始数据。

### 属性面板配置

```typescript
interface WidgetInspector {
  /** 属性面板渲染组件，或声明式属性组配置 */
  render: ComponentType<InspectorProps> | PropertyGroup[];
}

interface PropertyGroup {
  /** 组标题（i18n key） */
  title: string;
  /** 属性项列表 */
  properties: PropertyItem[];
}

interface PropertyItem {
  /** 对应的 chain 路径 */
  chain: Chain;
  /** 渲染器类型 */
  renderer: string;
  /** 显示标签（i18n key） */
  label: string;
  /** 渲染器配置 */
  options?: Record<string, unknown>;
}
```

属性面板支持两种模式：

- **声明式**：通过 `PropertyGroup[]` 描述，由内置渲染器（text / number / color / select 等）渲染
- **自定义**：直接提供 React 组件，完全自控

### 插槽声明

容器类组件需声明自己支持的插槽：

```typescript
interface SlotDeclaration {
  /** 插槽名，对应 Widget.slots 的 key */
  name: string;
  /** 显示名称（i18n key） */
  label: string;
  /** 允许放入的 widget 类型，不指定则不限制 */
  accept?: string[];
  /** 最大子组件数量，不指定则不限制 */
  maxCount?: number;
}
```

---

## 注册表

### 结构

```typescript
interface WidgetRegistry {
  /** 注册组件 */
  register(definition: WidgetDefinition): void;
  /** 批量注册 */
  registerAll(definitions: WidgetDefinition[]): void;
  /** 按类型查询 */
  get(type: string): WidgetDefinition | undefined;
  /** 获取所有已注册组件 */
  getAll(): WidgetDefinition[];
  /** 按分类获取 */
  getByCategory(category: string): WidgetDefinition[];
  /** 判断类型是否已注册 */
  has(type: string): boolean;
}
```

### 注册时机

注册在 Dock Runtime 启动阶段完成，作为一个内置插件执行：

```typescript
const widgetRegistryPlugin: PluginDefinition = {
  name: 'widget-registry',
  setup(ctx) {
    const registry = createWidgetRegistry();
    // 注册所有内置组件
    registry.registerAll(builtinWidgets);
    return {};
  },
};
```

注册完成后注册表内容不再变化，运行时只读。

---

## 组件实例化流程

从 Toolbox 添加组件到画布：

```
1. 用户从 Toolbox 选择组件类型
   │
2. 从注册表获取 WidgetDefinition
   │
3. 构造 Widget Schema：
   │  - widgetDefaults() 生成基础 schema
   │  - 合并 definition.defaultSchema（尺寸、mode 等覆盖）
   │  - 填入 type、custom_data（definition.defaultCustomData）
   │
4. 调用 Toolkit: addWidget(widgetSchema)
   │
5. Modifier 执行 add-widget Operation
```

## 画布渲染流程

```
1. 遍历 Page.widgets[]
   │
2. 对每个 widget，取 widget.type
   │
3. 从注册表获取 WidgetDefinition
   │
4. 根据当前应用场景选择 definition.render.editor 或 definition.render.viewer
   │
5. 渲染对应的 React 组件
```

---

## 内置组件目录结构

```
domains/
└── widgets/
    ├── package.json              # @ikun-kit/widgets
    ├── src/
    │   ├── text/                 # 文本组件
    │   │   ├── definition.ts     # WidgetDefinition 导出
    │   │   ├── editor.tsx        # 编辑态渲染
    │   │   ├── viewer.tsx        # 查看态渲染
    │   │   └── inspector.tsx     # 属性面板（可选，也可用声明式）
    │   ├── image/                # 图片组件
    │   ├── container/            # 容器组件（含 slots 声明）
    │   └── ...
    └── index.ts                  # 汇总导出所有 WidgetDefinition[]
```

每个组件独立目录，包含定义、编辑态渲染、查看态渲染，可选属性面板。`index.ts` 汇总为数组供注册表批量注册。
