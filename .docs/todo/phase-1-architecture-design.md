# Phase 1：架构设计

> 纯设计文档，不写代码。产出为更新/新建架构文档，经确认后进入 Phase 2 实施。

## 状态：已完成

---

## 1.1 Chronicle 边界定义 + Context 层级重设计

### 现状问题

数据流路径有两条，职责重叠：

```
路径 1: PluginContext.chronicle → chronicle.getDocument() / chronicle.onUpdate()
路径 2: DocumentRefContext → PageLiveProvider(subscribe) → WidgetLiveProvider(subscribe)
```

- `DocumentRefContext` 本质是 `chronicle.getDocument()` 的 React 包装，几乎无额外价值
- `DocumentLiveContext` 只在自身 provider 内部消费，无外部直接使用者
- `PageLiveContext` / `WidgetLiveContext` 是必要的——提供作用域数据
- Chronicle 既是数据引擎又被当作订阅源，Context 层又重复了一套订阅机制

### 需要决策

- Chronicle 的职责边界：纯数据引擎 vs 数据引擎 + 订阅中心？
- DocumentRefContext 是否应该存在？还是由 Chronicle 直接提供 `getDocument()`？
- PageLive / WidgetLive 的 `subscribe` prop 机制是否应改为从 Chronicle 自动派生？
- 查看器模式（无 Chronicle）下的数据流如何设计？

### 产出

- 更新 `.docs/architecture/instance-context.md`

---

## 1.2 插件分类 + 通信模型

### 现状问题

- 只有一种插件类型 `LayoutPlugin`，无分类
- 布局插件通过 React Context（`useEditorRef()`）直接访问 EditorState，绕过 PluginContext
- PluginContext 是一个扁平的能力袋，不可序列化，无法扩展到 remote plugin
- EventBus module augmentation 声明还指向旧包名 `@ikun-kit/toolkit`

### 需要设计

- 插件分类定义：layout plugin / service plugin / widget plugin 各自的职责和生命周期
- 数据流通模型：plugin 如何接收各分层数据（document、page、editor state）
- 插件与 React 组件的通信机制（当前直接依赖 Context，需要设计解耦方案）
- 面向 remote plugin 的消息化协议设计（即使当前不实现，架构需要预留）
- PluginContext 分层：core context（所有插件共用）vs extended context（按类型扩展）

### 产出

- 更新 `.docs/architecture/dock-plugin.md`

---

## 1.3 类型分包策略

### 现状问题

- `packages/types` 仅一个 `DeepPartial` 工具类型
- 项目级共用类型（PluginContext、OperationModel 等）散落在 `dock-editor/src/runtime/types.ts`
- 无 `domains/types` 包
- 各布局插件直接依赖 `@canvix-react/dock-editor` 获取类型，产生不必要的包依赖

### 需要决策

- `packages/types`：放什么？（跨项目通用工具类型）
- `domains/types`：放什么？（项目级共用业务类型：PluginContext、OperationModel、Schema 类型重导出）
- 哪些类型需要从 `dock-editor` 剥离到 `domains/types`？
- 类型包的依赖关系图

### 产出

- 新建 `.docs/architecture/type-system.md`

---

## 完成标准

- [x] 三份设计文档完成并经确认
- [x] 设计决策明确，无模糊点
- [x] 各设计之间无矛盾
