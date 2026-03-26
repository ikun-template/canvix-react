# 架构设计：Dock 底座与插件机制

## 定位

Dock 是编辑器/查看器的运行底座，零业务逻辑。职责三件事：

1. 应用容器——入口初始化、布局挂载点
2. 插件机制——注册、生命周期管理
3. Runtime 钩子——业务逻辑的执行切面

所有业务功能由插件实现。

---

## 插件分类

插件分为三类，职责和生命周期模型不同：

| 类型              | 有 UI                  | 生命周期管理                                | 数据获取方式                         | 典型用途                            |
| ----------------- | ---------------------- | ------------------------------------------- | ------------------------------------ | ----------------------------------- |
| **LayoutPlugin**  | 有 slot + component    | React 管理                                  | React hooks                          | canvas, sidebar, inspector, toolbox |
| **ServicePlugin** | 无 UI                  | Dock 管理（setup → mount → activate → ...） | ServicePluginContext 命令式 API      | 快捷键、保存、协作同步、分析        |
| **WidgetPlugin**  | Widget 渲染 + 属性面板 | WidgetRegistry 管理                         | React hooks（toolkit-shared/editor） | text, image, chart 等业务组件       |

### LayoutPlugin — 声明式 UI 插件

布局插件声明一个 slot 和一个 React 组件，由 Dock 渲染到对应的挂载点。

```typescript
interface LayoutPluginDefinition {
  /** 唯一标识 */
  name: string;
  /** 插槽名（如 'canvas', 'sidebar', 'inspector', 'toolbox'） */
  slot: string;
  /** 渲染到插槽的 React 组件 */
  component: ComponentType;
}
```

**设计要点**：

- 组件无 props。所有数据和操作通过 React hooks 获取（`useEditorRef()`, `useEditorLive()`, `useChronicleSelective()` 等）。详见 [instance-context.md](./instance-context.md)。
- 无 `setup()`。React 组件的 mount/unmount 就是布局插件的生命周期。
- Dock 通过 `createPortal` 将组件渲染到 `data-slot` 挂载点。

### ServicePlugin — 命令式服务插件

服务插件没有 UI，通过 `setup()` 接收运行时能力，注册钩子和事件监听，提供跨切面功能。

```typescript
interface ServicePluginDefinition {
  /** 唯一标识 */
  name: string;
  /** 初始化入口，返回生命周期实例 */
  setup(
    ctx: ServicePluginContext,
  ): ServicePluginInstance | Promise<ServicePluginInstance>;
}

interface ServicePluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}
```

**典型 ServicePlugin 用例**：

| 插件       | 职责                                                    |
| ---------- | ------------------------------------------------------- |
| 快捷键服务 | 注册 Ctrl+S 保存、Ctrl+Z 撤销等全局快捷键               |
| 保存服务   | 监听 `document:beforeSave` hook，序列化文档到 IndexedDB |
| 协作同步   | 监听 `operation:after` hook，同步操作到远端             |
| 分析服务   | 监听操作和页面切换事件，上报使用数据                    |

### WidgetPlugin — 业务组件插件

Widget 插件定义一个可复用的业务组件，包含渲染、属性面板和插槽声明。通过 `WidgetRegistry` 注册和管理。

```typescript
interface WidgetPluginDefinition<T = unknown> {
  /** Widget 类型标识，全局唯一 */
  type: string;
  /** 元信息（名称、分类、图标、描述） */
  meta: WidgetMeta;
  /** 自定义数据默认值 */
  defaultCustomData: T;
  /** 完整的默认 Schema（可选，未提供时由 defaults() 生成） */
  defaultSchema?: WidgetRaw<T>;
  /** 渲染组件（编辑态 + 查看态） */
  render: WidgetRenderMap;
  /** 属性面板定义（可选） */
  inspector?: WidgetInspectorConfig;
  /** 插槽声明（可选，允许子 widget 拖入） */
  slots?: WidgetSlot[]; // 可接受子 widget 的插槽声明
}

interface WidgetMeta {
  name: string;
  category: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  description?: string;
}

interface WidgetRenderMap {
  editor: ComponentType<WidgetRenderProps>;
  viewer: ComponentType<WidgetRenderProps>;
}

interface WidgetSlot {
  name: string;
  label: string;
  accept?: string[]; // 可接受的 widget 类型白名单
  maxCount?: number; // 插槽内最大 widget 数量
}
```

**设计要点**：

- Widget 插件通过 `WidgetRegistry.register()` 注册，在 bootstrap 阶段完成（早于 Runtime 启动）
- 渲染组件通过 React hooks 获取数据（`useWidgetReader()` / `useWidgetEditor()`）
- 属性面板通过 `inspector.render(data)` 返回 `InspectorGroup[]`，由 Inspector 布局插件统一渲染
- 插槽通过 `slots` 声明，Canvas 渲染 drop zone，Sidebar 展示层级树

**与 LayoutPlugin / ServicePlugin 的区别**：

- WidgetPlugin 不参与 Dock 的插件生命周期（setup/mount/activate），而是由 WidgetRegistry 独立管理
- WidgetPlugin 的 "生命周期" 就是 React 组件的 mount/unmount
- WidgetPlugin 不能访问 HookSystem / EventBus（它是业务组件，不是系统扩展点）

---

## ServicePluginContext

服务插件在 `setup()` 中获得的能力上下文：

```typescript
interface ServicePluginContext {
  /** 运行时钩子 */
  hooks: HookSystem;
  /** 事件总线 */
  events: EventBus;
  /** Schema 变更引擎 */
  chronicle: Chronicle;
  /** Widget 组件注册表 */
  registry: WidgetRegistry;
  /** Hook-integrated 变更方法 */
  update(model: OperationModel, options?: UpdateOptions): void;
  /** 创建临时会话（拖拽预览） */
  beginTemp(): DraftSession;
}
```

> ServicePluginContext 是 Runtime 向服务插件暴露的受限接口。插件不持有 Runtime 引用，只能通过 ServicePluginContext 操作。

---

## 通信模型

### 三条核心通道

```
┌──────────────────────────────────────────────────────────────────┐
│                         通信架构                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ① Chronicle（文档数据变更）                                      │
│     写入: chronicle.update(model)                                │
│     通知: chronicle.onUpdate(listener)                           │
│     消费: useChronicleSelective(), PageLiveProvider              │
│                                                                  │
│  ② EditorStateStore（编辑器 UI 状态）                             │
│     写入: ref.setSelection(), ref.setZoom(), ...                 │
│     通知: ref.onChange(listener)                                 │
│     消费: useEditorLive('zoom', 'camera', ...)                  │
│                                                                  │
│  ③ React Context（分层投递机制）                                   │
│     EditorRefContext → DocumentRefContext → PageLiveContext       │
│                                         → WidgetLiveContext      │
│     消费: useEditorRef(), useDocumentRef(), usePageLive(), ...   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ④ HookSystem（流程拦截，仅 ServicePlugin 使用）                   │
│     同步钩子: 顺序执行所有监听器                                   │
│     瀑布钩子: 上一个返回值作为下一个输入，支持拦截/修改             │
│                                                                  │
│  ⑤ EventBus（插件间消息，仅 ServicePlugin 使用）                   │
│     发布: ctx.events.emit('event-name', payload)                 │
│     订阅: ctx.events.on('event-name', handler)                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**通道 ①②③** 是当前实际使用的通信机制，由布局插件和服务插件共用。

**通道 ④⑤** 保留给 ServicePlugin 用于流程拦截和跨插件消息传递。

### LayoutPlugin 如何通信

布局插件（React 组件）通过 hooks 参与通信：

```typescript
// 读取 UI 状态
const { zoom, selectedWidgetIds } = useEditorLive('zoom', 'selectedWidgetIds');

// 读取文档数据（选择性订阅）
const doc = useChronicleSelective(shouldUpdate);

// 写入文档数据
const ref = useEditorRef();
ref.update({ target: 'widget', pageId, id, operations: [...] });

// 写入 UI 状态
ref.setSelection([widgetId]);
```

### ServicePlugin 如何通信

服务插件通过 ServicePluginContext 参与通信：

```typescript
setup(ctx) {
  // 拦截保存前的数据（瀑布钩子）
  ctx.hooks.on('document:beforeSave', ({ document }) => {
    return { document: processBeforeSave(document) };
  });

  // 监听操作后同步
  ctx.hooks.on('operation:after', ({ operations }) => {
    syncToRemote(operations);
  });

  // 跨插件消息
  ctx.events.on('shortcuts:save', () => {
    triggerSave();
  });

  return { destroy() { /* cleanup */ } };
}
```

---

## Runtime

Runtime 是 Dock 内部的运行时中枢，在应用启动时创建，贯穿整个应用生命周期。

### 职责

```
Runtime
  ├── PluginManager      ← 插件注册、生命周期调度
  ├── HookSystem         ← 运行时钩子注册与触发
  ├── Chronicle          ← Schema 变更引擎（实例化并持有）
  ├── TokenResolver      ← Token 解析
  └── EventBus           ← 插件间通信总线
```

> **注**：编辑状态（activePage, selection, zoom 等）不由 Runtime 管理。EditorStateStore 由 App 层创建，通过 EditorRefContext 暴露给布局插件。

### 启动流程

```
1. 创建 Runtime 实例
   │
2. 初始化核心服务（Chronicle, EventBus, HookSystem, TokenResolver）
   │
3. 注册布局插件（仅记录 slot + component）
   │
4. 按注册顺序执行服务插件生命周期：setup → mount → activate
   │
5. 触发 hook: app:ready
   │
6. 应用就绪
```

### 销毁流程

```
1. 触发 hook: app:beforeDestroy
   │
2. 按注册逆序执行服务插件生命周期：deactivate → unmount → destroy
   │
3. 销毁核心服务
   │
4. Runtime 实例释放
```

---

## 钩子系统（HookSystem）

### 钩子类型

- **同步钩子（SyncHook）**：顺序执行所有监听器
- **瀑布钩子（WaterfallHook）**：上一个监听器的返回值作为下一个的输入，支持拦截/修改

### 内置钩子

```typescript
interface BuiltinHooks {
  // 应用级
  'app:ready': SyncHook<void>;
  'app:beforeDestroy': SyncHook<void>;

  // 文档级
  'document:loaded': SyncHook<{ document: Document }>;
  'document:beforeSave': WaterfallHook<{ document: Document }>;
  'document:saved': SyncHook<void>;
  'document:beforeClose': SyncHook<void>;

  // 变更级
  'operation:before': WaterfallHook<{ operations: OperationModel[] }>;
  'operation:after': SyncHook<{ operations: OperationModel[] }>;

  // 视图级
  'page:beforeSwitch': WaterfallHook<{ from: string; to: string }>;
  'page:switched': SyncHook<{ pageId: string }>;
}
```

### 使用方式（仅 ServicePlugin）

```typescript
// 保存服务插件
setup(ctx) {
  ctx.hooks.on('document:beforeSave', ({ document }) => {
    return { document: processBeforeSave(document) };
  });
}

// 快捷键服务插件
setup(ctx) {
  ctx.hooks.on('operation:after', ({ operations }) => {
    markDocumentDirty();
  });
}
```

### 自定义钩子

服务插件可注册自定义钩子，供其他服务插件监听：

```typescript
setup(ctx) {
  ctx.hooks.register('collaboration:conflict', SyncHook);
}
```

---

## 事件总线（EventBus）

用于服务插件间的松耦合通信，与钩子系统的区别：

|          | HookSystem                | EventBus       |
| -------- | ------------------------- | -------------- |
| 触发方   | Runtime（生命周期时机）   | 任意服务插件   |
| 用途     | 切面拦截、流程控制        | 插件间消息传递 |
| 支持拦截 | Waterfall 钩子可拦截/修改 | 不支持         |

```typescript
// 发布
ctx.events.emit('shortcuts:save', {});

// 订阅
ctx.events.on('shortcuts:save', () => {
  performSave();
});
```

EventBus 类型安全，事件名和 payload 类型由服务插件通过 module augmentation 扩展：

```typescript
declare module '@canvix-react/editor-types' {
  interface EventMap {
    'shortcuts:save': {};
    'collaboration:conflict': { widgetId: string };
  }
}
```

---

## Remote Plugin 设计方向（Future）

> 以下为未来扩展方向，当前不实现，仅作为架构预留参考。

当前架构对 remote plugin（iframe / Web Worker 隔离）的兼容性评估：

| 能力                    | 可序列化 | 说明                         |
| ----------------------- | -------- | ---------------------------- |
| OperationModel          | ✓        | 纯 JSON 结构                 |
| EditorStateSnapshot     | ✓        | 纯 JSON 结构                 |
| Chronicle.getDocument() | ✓        | DocumentRuntime 可序列化     |
| HookSystem waterfall    | △        | 需要异步支持（当前是同步的） |
| EventBus                | ✓        | 天然适合消息传递             |
| React Context           | ✗        | 不可跨进程                   |

Remote plugin 路径：

- ServicePlugin 的 `ServicePluginContext` 方法包装为消息协议
- 操作通过消息通道序列化/反序列化
- Hook waterfall 需要改为 async waterfall
- Layout plugin 不支持 remote（需要 React 渲染上下文）

---

## Dock 应用结构

```
docks/
├── dock-editor/
│   ├── package.json
│   └── src/
│       ├── runtime/
│       │   ├── index.ts           # Runtime 类
│       │   ├── plugin-manager.ts  # 插件注册、生命周期调度
│       │   ├── hook-system.ts     # 钩子注册与触发
│       │   ├── event-bus.ts       # 类型安全事件总线
│       │   ├── token-resolver.ts  # Token 解析
│       │   └── temp-session.ts    # 临时编辑会话
│       └── index.ts               # 导出 DockEditor, 类型从 @canvix-react/editor-types 重导出
└── dock-viewer/
    └── src/                       # 同上结构，仅 LayoutPlugin，无 ServicePlugin
```

dock-editor 和 dock-viewer 各自独立的 Runtime 实例，加载不同的插件集合。编辑器 UI 状态（EditorStateStore）由 App 层创建并注入 EditorRefContext，不在 dock 层。

---

## Phase 2 迁移要点

1. 将 `LayoutPluginDefinition` 从 `dock-editor/runtime/types.ts` 迁移到 `@canvix-react/editor-types`
2. 新增 `ServicePluginDefinition` + `ServicePluginContext` 类型到 `@canvix-react/editor-types`
3. 简化 `LayoutPluginDefinition`：移除 `setup()`，`component` 改为无 props
4. App.tsx 停止传递 `ctx` prop 给布局插件组件
5. 各布局插件组件移除 `ctx` 参数，改用 hooks
6. Runtime 中硬编码的键盘快捷键处理提取为 ServicePlugin 候选（Phase 3 实施）
7. EventBus module augmentation 目标模块改为 `@canvix-react/editor-types`
