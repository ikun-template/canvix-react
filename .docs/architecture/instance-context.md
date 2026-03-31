# 架构设计：实例上下文与数据流

## 核心问题

Widget 级别执行变更需要 `pageId`，参考项目要求调用方每次显式传入，API 冗余且易错。本项目通过 React Context 逐级注入上下文，消费方无感获取上游信息。

---

## Chronicle：数据引擎

Chronicle（`@canvix-react/chronicle`）是文档数据的唯一真实来源。

### 职责边界

Chronicle **只做**三件事：

1. **持有文档状态**：`doc: DocumentRuntime`（可变对象，直接持有引用）
2. **应用操作**：`update(model)` 接收 OperationModel，原地修改文档，记录逆操作到 History
3. **通知变更**：`onUpdate(listener)` 扁平广播，所有监听器收到同一 OperationModel

Chronicle **不做**：

- 不做 page/widget 级别的订阅过滤（由 Context 层负责）
- 不提供 React 集成（框架无关，方便未来支持其他框架或 headless 场景）
- 不管理编辑器 UI 状态（zoom、selection 等由 EditorStateStore 管理）

### API

```typescript
class Chronicle {
  getDocument(): DocumentRuntime; // 返回可变文档引用
  getVersion(): number; // 单调递增版本号
  update(model: OperationModel, options?: UpdateOptions): void;
  undo(): void;
  redo(): void;
  onUpdate(listener: (model: OperationModel) => void): () => void;
}
```

### 与 Context 层的关系

```
Chronicle（扁平数据引擎）
    │
    │  onUpdate() 扁平广播
    │
    ├─→ PageLiveProvider 内部过滤：仅匹配 pageId 的操作触发 version++
    ├─→ WidgetLiveProvider 内部过滤：仅匹配 widgetId 的操作触发 version++
    ├─→ DocumentLiveProvider 内部过滤：仅 document 级操作触发 version++
    └─→ useChronicleSelective 内部过滤：自定义 shouldUpdate 函数
```

Context 层是 Chronicle 的 **React 投影**，负责将扁平通知转化为作用域化的响应式更新。

---

## Context 层级

### Ref / Live 双层模式

| 层       | 命名后缀         | 职责                               | 稳定性                               | 消费方式       |
| -------- | ---------------- | ---------------------------------- | ------------------------------------ | -------------- |
| **Ref**  | `XxxRefContext`  | 原始数据源引用 + 命令式操作        | 值在生命周期内稳定，不触发 re-render | `useXxxRef()`  |
| **Live** | `XxxLiveContext` | 基于 Ref 的响应式投影 + 运行时状态 | 数据变化时触发消费者 re-render       | `useXxxLive()` |

**Ref 层** 持有"数据从哪来、怎么改"——getDocument 方法、状态 setters 等。值稳定，适合传递给命令式闭包（拖拽处理、事件回调）。

**Live 层** 是 Ref 的派生——将 Ref 的原始数据转化为 React 可消费的响应式快照。subscribe 机制将更新通知与数据获取解耦。

### 层级图

```
EditorRefContext                          ← Ref：数据操作 + UI 状态操作
│
├── DocumentRefContext                    ← Ref：getDocument（数据源抽象层）
│   │
│   ├── DocumentLiveContext               ← Live：文档级响应式（title, pageIds, version）
│   │   │
│   │   ├── PageLiveContext               ← Live：当前 page 响应式数据
│   │   │   │
│   │   │   └── WidgetLiveContext         ← Live：当前 widget 身份 + 版本
│   │   │
│
├── EditorLive（hook-based）              ← useEditorLive() 直接从 EditorRef store 读取
```

> `EditorLive` 不通过 Provider 传递，而是 `useEditorLive()` 内部直接从 `useEditorRef()` 获取 store 的 `onChange`/`getSnapshot`，经 `useSelectiveStore` 实现选择性订阅。

对应的 Provider 嵌套：

```
<EditorRefProvider>
  <DocumentRefProvider>
    <DocumentLiveProvider subscribe={...}>
      <PageLiveProvider pageId={id} subscribe={...}>
        <WidgetLiveProvider widgetId={id} subscribe={...}>
          <WidgetRenderer />
        </WidgetLiveProvider>
      </PageLiveProvider>
    </DocumentLiveProvider>
  </DocumentRefProvider>
</EditorRefProvider>
```

---

## Context 定义

### DocumentRefContext — 数据源抽象层

```typescript
// @canvix-react/toolkit-shared
interface DocumentRefContextValue {
  getDocument: () => Readonly<DocumentRuntime>;
}
```

**设计要点**：

- 仅暴露 `getDocument()` 方法，不暴露 `document` 直接引用（避免可变对象被误用）
- 不依赖 Chronicle（viewer 模式下可用 props 驱动的静态数据源）
- 编辑器模式下由 App.tsx 桥接：`getDocument: () => chronicle.getDocument()`

**消费者**：所有 reader hooks（useDocumentReader, usePageReader, useWidgetReader）、editor hooks（useDocumentEditor, usePageEditor, useWidgetEditor）

### DocumentLiveContext — 文档级响应式

```typescript
// @canvix-react/toolkit-shared
interface DocumentLiveContextValue {
  title: string;
  desc: string;
  cover: string;
  pageIds: string[];
  version: number;
}
```

**消费者**：page-explorer（页面列表增删）、document title bar（标题变更）

**subscribe 机制**：编辑器模式下过滤 `model.target === 'document'` 的操作；viewer 模式下由 props 变化驱动。

### PageLiveContext — 页面级响应式

```typescript
// @canvix-react/toolkit-shared
interface PageLiveContextValue {
  pageId: string;
  name: string;
  layout: PageRuntime['layout'];
  foreground: string;
  background: string;
  widgetIds: string[];
  version: number;
}
```

**消费者**：canvas（page-editor）、inspector（inspector-page）、reader hooks

### WidgetLiveContext — Widget 身份与版本

```typescript
// @canvix-react/toolkit-shared
interface WidgetLiveContextValue {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
  version: number;
}
```

**设计要点**：不含 widget 数据本身（仅身份信息）。实际数据通过 `useDocumentRef().getDocument()` 按需查找。version 驱动消费者 re-render 后重新获取最新数据。

**消费者**：page-editor（widget 渲染）、inspector（widget 属性编辑）、reader hooks

### EditorRefContext — 编辑器命令式引用

```typescript
// @canvix-react/toolkit-editor
interface EditorRefContextValue {
  // ── 静态配置 ──
  config: EditorConfig;

  // ── 数据操作 ──
  chronicle: Chronicle;
  registry: WidgetRegistry;
  plugins: Pick<LayoutPluginDefinition, 'name' | 'slot'>[];
  update(model: OperationModel, options?: UpdateOptions): void;
  beginDraft(): DraftSession;

  // ── UI 状态操作（来自 EditorStateStore）──
  setActivePage(pageId: string): void;
  setSelection(widgetIds: string[]): void;
  setHoveredWidget(id: string | null): void;
  setActiveTool(tool: EditorToolType): void;
  setZoom(zoom: number): void;
  setCamera(x: number, y: number): void;
  setInteracting(value: boolean): void;
  setFlowDrag(widgetId: string | null, size?: [number, number]): void;
  setFlowDropIndex(index: number | null): void;
  setDirty(value: boolean): void;
  batch(fn: () => void): void;
  getSnapshot(): EditorStateSnapshot;
  onChange(listener: () => void): () => void;

  /** 保存文档 */
  save(): Promise<void>;
}
```

**设计要点**：

- 所有字段在应用生命周期内稳定（同一 store/chronicle 实例的方法引用），不触发 re-render
- 逻辑分两组但不物理拆分：数据操作组（chronicle, update, beginTemp）+ UI 状态组（setXxx, getSnapshot, onChange）
- `chronicle` 暴露在此处是因为 `useChronicleSelective` 等 editor hooks 需要直接访问

### EditorLive — UI 状态响应式（hook-based）

```typescript
// @canvix-react/toolkit-editor
interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  activeTool: EditorToolType;
  interacting: boolean;
  zoom: number;
  camera: { x: number; y: number };
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
  dirty: boolean;
}
```

消费方式（选择性订阅，仅关注的字段变化时 re-render）：

```typescript
const { activePageId, zoom, ... } = useEditorLive();      // 全量快照
const activePageId = useEditorLive('activePageId');         // 单字段
const { zoom, camera } = useEditorLive('zoom', 'camera');  // 多字段 Pick
const derived = useEditorLive(s => s.activeTool);           // selector 派生
```

---

## 数据获取：布局插件组件

布局插件组件统一通过 React hooks 获取所有能力，**不接收 props**。

> **注**：布局插件的 `LayoutPluginDefinition.component` 类型为 `ComponentType`（无 props）。插件注册时的 `setup()` 仅供 ServicePlugin 使用。详见 [dock-plugin.md](./dock-plugin.md)。

```typescript
// 布局插件组件内部
const ref = useEditorRef(); // 数据操作 + UI 状态操作
const { zoom, camera } = useEditorLive('zoom', 'camera'); // UI 状态响应式
const doc = useChronicleSelective(shouldUpdate); // 选择性 Chronicle 订阅

// 配置
const { t, locale, setLocale } = useI18n();
const { theme, setTheme } = useTheme();
```

---

## 编辑器状态架构

`EditorStateStore` 是一个轻量 external store（subscribe/getSnapshot 模式），由 App 层创建并注入 `EditorRefContext`。

```
EditorRefContext
  │  持有 EditorStateStore 的 setters + getSnapshot + onChange
  │
  ├── 交互处理函数直接使用 ref.setXxx() / ref.getSnapshot()
  │   （命令式闭包，不触发 re-render）
  │
  └── useEditorLive(...keys / selector)
        useSelectiveStore(ref.onChange, ref.getSnapshot, selector)
        （选择性订阅，仅关注的字段变化时 re-render）
```

交互处理函数（`createDragMove`、`createDragResize`、`createFlowDragMove`、`useZoomPan`）通过 `ref.getSnapshot()` 同步读取 zoom/camera，通过 `ref.setXxx()` 写入状态。

---

## 稳定性保证

### Context 值稳定性

- `EditorRefContext` 所有字段在应用生命周期内稳定（同一 store/chronicle 实例的方法引用），不触发 re-render
- `DocumentRefContext` 的 `getDocument` 在应用生命周期内稳定（同一 chronicle 实例的方法引用），不触发 re-render
- `useEditorLive()` 由 `useSelectiveStore` 驱动，支持选择性订阅，仅关注的字段变化时触发 re-render
- Live Context 包含 `version` 字段，仅在相关 subscribe 回调触发时递增，只影响订阅了该 context 的消费者

### 数据读取与 Context 分离

- Context 传递"我是谁"（id）和"当前版本"（version），不传递完整数据
- 数据读取通过 reader hooks 的 get 方法按需获取
- subscribe 机制将更新通知与数据获取解耦

---

## 嵌套 Widget 的 Context 传递

Widget 渲染 slot 内的子 widget 时，为每个子 widget 提供新的 WidgetLiveProvider：

```
<WidgetLiveProvider widgetId="A" subscribe={...}>     ← Widget A
  <SlotRenderer slotName="content">
    <WidgetLiveProvider widgetId="C"                   ← Widget C（A 的 slot 子级）
      parentId="A"
      slotName="content"
      subscribe={...}>
      ...
    </WidgetLiveProvider>
  </SlotRenderer>
</WidgetLiveProvider>
```

子 widget 通过 `useWidget()` 可获取完整的层级信息（自身 id、所属 page、父 widget、所在 slot），用于组装 Operation 或 UI 展示（如面包屑导航）。

---

## Editor 模式 vs Viewer 模式

Context 层级在两种模式下有本质区别。

### Editor 模式

完整的 Context 层级，支持读写操作和 UI 状态管理。

```
EditorRefContext                   ← chronicle + store + update + beginDraft + save
│
├── DocumentRefContext             ← getDocument（由 chronicle 桥接）
│   ├── DocumentLiveContext        ← subscribe 由 chronicle.onUpdate 驱动
│   │   ├── PageLiveContext
│   │   │   └── WidgetLiveContext
│
├── EditorLive（hook-based）       ← useEditorLive() 从 EditorStateStore 读取
```

插件组件可使用：`toolkit-shared`（reader hooks）+ `toolkit-editor`（editor hooks, chronicle hooks, EditorRef/Live）。

### Viewer 模式

最小 Context 层级，仅支持只读渲染。**无 EditorRefContext，无 Chronicle。**

```
DocumentRefContext                 ← getDocument（由 props 直接注入）
│
├── DocumentLiveContext            ← subscribe 由外部 props 变化驱动（或不传 subscribe）
│   ├── PageLiveContext
│   │   └── WidgetLiveContext
```

插件组件仅可使用：`toolkit-shared`（reader hooks）。**不可 import toolkit-editor 的任何内容。**

### 关键区别

| 项目                    | Editor 模式                     | Viewer 模式        |
| ----------------------- | ------------------------------- | ------------------ |
| 数据源                  | Chronicle（可变，支持操作）     | Props 注入（只读） |
| EditorRefContext        | ✓                               | ✗ 不存在           |
| EditorStateStore        | ✓                               | ✗ 不存在           |
| DocumentRefContext      | ✓（chronicle 桥接）             | ✓（props 注入）    |
| Live Provider subscribe | chronicle.onUpdate 过滤         | props 变化或不传   |
| Widget 渲染器           | `render.editor`                 | `render.viewer`    |
| Toolkit 依赖            | toolkit-shared + toolkit-editor | 仅 toolkit-shared  |

> 这种分层设计使 `toolkit-shared` 的 Context 和 Provider 对数据源完全无感——通过 `subscribe` prop 和 `getDocument()` 抽象，同一套 Provider 代码同时服务于 editor 和 viewer。

---

## Toolkit

基于 Context 封装的操作能力集合，拆分为两个独立包：

| 包                             | 使用场景        | 说明                                         |
| ------------------------------ | --------------- | -------------------------------------------- |
| `@canvix-react/toolkit-shared` | 编辑器 + 查看器 | Context、Provider、只读 reader hooks         |
| `@canvix-react/toolkit-editor` | 编辑器专用      | EditorContext、chronicle hooks、editor hooks |

### toolkit-shared（通用层）

不依赖 Chronicle，提供 Ref/Live Context 定义、LiveProvider、只读 reader hooks 和通用工具：

```typescript
// 通用工具
function shallowEqual(a: unknown, b: unknown): boolean;
function useSelectiveStore<Snapshot, Result>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => Snapshot,
  selector: (s: Snapshot) => Result,
): Result;

// Reader hooks
function useDocumentReader(): { getDocument(): Readonly<DocumentRuntime> };
function usePageReader(): { getPage(): Readonly<PageRuntime> };
function useWidgetReader(): { getWidget(): Readonly<WidgetRuntime> };
```

`DocumentLiveProvider` / `PageLiveProvider` / `WidgetLiveProvider` 通过可选 `subscribe` prop 抽象更新源：

- 编辑器模式：传入 chronicle.onUpdate 过滤后的回调
- 查看器模式：不传 subscribe，由 props 变化自然驱动

### toolkit-editor（编辑器层）

依赖 Chronicle，提供读写操作和编辑器状态管理：

```typescript
// Document 级
function useDocumentEditor(): {
  getDocument(): Readonly<DocumentRuntime>;
  update(ops): void;
  addPage(page: PageRaw): void;
  deletePage(pageId: string): void;
  movePage(pageId: string, to: number): void;
};

// Page 级
function usePageEditor(): {
  getPage(): Readonly<PageRuntime>;
  update(ops): void;
  addWidget(widget: WidgetRaw): void;
  deleteWidget(widgetId: string): void;
  moveWidget(widgetId: string, to: number): void;
};

// Widget 级
function useWidgetEditor(): {
  getWidget(): Readonly<WidgetRuntime>;
  update(ops): void;
  addToSlot(slotName: string, widget: WidgetRaw): void;
  removeFromSlot(slotName: string, widgetId: string): void;
};

// Chronicle hooks
function useChronicleData(): Readonly<DocumentRuntime>;
function useChronicleSelective(shouldUpdate?): Readonly<DocumentRuntime>;

// 编辑器状态 hooks
function useEditorRef(): EditorRefContextValue;

// 编辑器 Live hooks（选择性订阅，无 Provider）
function useEditorLive(): EditorStateSnapshot;
function useEditorLive<K extends keyof EditorStateSnapshot>(
  key: K,
): EditorStateSnapshot[K];
function useEditorLive<K extends keyof EditorStateSnapshot>(
  ...keys: K[]
): Pick<EditorStateSnapshot, K>;
function useEditorLive<R>(selector: (s: EditorStateSnapshot) => R): R;

// 配置 hooks（从 EditorRef.config 派生）
function useI18n(): { t; locale; setLocale; supportedLocales };
function useTheme(): { theme; setTheme };
```

### Widget 内使用

Widget 开发时区分编辑态和查看态导入：

```typescript
// widget 编辑态
import { useWidgetEditor } from '@canvix-react/toolkit-editor';
const { getWidget, update } = useWidgetEditor();

// widget 查看态
import { useWidgetReader } from '@canvix-react/toolkit-shared';
const { getWidget } = useWidgetReader();
```

---

## Runtime 与 Toolkit 的关系

```
dock-editor/
  └── runtime/              ← 编辑器内部中枢（初始化、插件管理、钩子调度）
                              不对外暴露，仅 dock 内部使用

domains/
  ├── toolkit-shared/       ← 通用层：Context、Provider、reader hooks
  │                           不依赖 Chronicle，编辑器 + 查看器共用
  └── toolkit-editor/       ← 编辑器层：EditorContext、editor hooks、chronicle hooks
                              依赖 Chronicle + toolkit-shared
```

- **Runtime** 是 dock 内部的运行时中枢，负责初始化 Chronicle、管理插件生命周期、调度钩子。不直接暴露给布局模块或 widget
- **Toolkit** 是 Runtime 对外的能力投影。布局模块和 widget 只依赖 Toolkit，不感知 Runtime 的存在

---

## 包结构

```
domains/
├── toolkit-shared/
│   ├── package.json              # @canvix-react/toolkit-shared
│   └── src/
│       ├── context/
│       │   ├── document-ref.ts   # DocumentRefContext + DocumentRefProvider + useDocumentRef
│       │   ├── document-live.ts  # DocumentLiveContext + useDocumentLive
│       │   ├── page-live.ts      # PageLiveContext + PageProvider + usePageLive
│       │   └── widget-live.ts    # WidgetLiveContext + WidgetProvider + useWidgetLive
│       ├── providers/
│       │   ├── document-live-provider.tsx  # subscribe? prop 驱动
│       │   ├── page-live-provider.tsx      # subscribe? prop 驱动
│       │   └── widget-live-provider.tsx    # subscribe? prop 驱动
│       ├── hooks/
│       │   ├── use-document-reader.ts
│       │   ├── use-page-reader.ts
│       │   └── use-widget-reader.ts
│       ├── utils/
│       │   ├── shallow-equal.ts
│       │   └── use-selective-store.ts
│       └── index.ts
│
└── toolkit-editor/
    ├── package.json              # @canvix-react/toolkit-editor
    └── src/
        ├── context/
        │   ├── editor-ref.ts     # EditorRefContext + useEditorRef + useI18n + useTheme
        │   └── editor-live.ts    # useEditorLive（选择性订阅，直接读取 EditorRef store）
        ├── store/
        │   └── editor-state-store.ts  # EditorStateStore
        ├── hooks/
        │   ├── use-document-editor.ts
        │   ├── use-page-editor.ts
        │   ├── use-widget-editor.ts
        │   ├── use-chronicle-data.ts
        │   └── use-chronicle-selective.ts
        └── index.ts
```

---

## Phase 2 迁移要点

1. `DocumentRefContextValue` 移除 `document` 字段，仅保留 `getDocument()`
2. App.tsx 中 `docRefValue` 简化
3. 布局插件组件移除 `ctx` prop（配合 dock-plugin.md 的 LayoutPlugin 简化）
4. 确认 DocumentLiveContext 消费者（page-explorer 应使用 `useDocumentLive()`）
5. 更新 `useDocumentRef()` 的返回类型
