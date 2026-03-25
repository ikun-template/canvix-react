# 架构设计：实例上下文

## 问题回顾

Widget 级别执行变更需要 `pageId`，参考项目要求调用方每次显式传入，API 冗余且易错。本项目通过 React Context 逐级注入上下文，消费方无感获取上游信息。

---

## Ref / Live 命名规则

所有 Context 遵循 **Ref / Live 双层** 模式：

| 层       | 命名后缀         | 职责                               | 稳定性                               | 消费方式       |
| -------- | ---------------- | ---------------------------------- | ------------------------------------ | -------------- |
| **Ref**  | `XxxRefContext`  | 原始数据源引用 + 命令式操作        | 值在生命周期内稳定，不触发 re-render | `useXxxRef()`  |
| **Live** | `XxxLiveContext` | 基于 Ref 的响应式投影 + 运行时状态 | 数据变化时触发消费者 re-render       | `useXxxLive()` |

**Ref 层** 持有的是"数据从哪来、怎么改"——chronicle 引用、getDocument 方法、状态 setters 等。值稳定，适合传递给命令式闭包（拖拽处理、事件回调）。

**Live 层** 是 Ref 的派生——将 Ref 的原始数据转化为 React 可消费的响应式快照。除了 Ref 的投影，还可包含模块自身的运行时状态数据（如编辑器的 zoom、selection、hover 等）。subscribe 机制将更新通知与数据获取解耦。

**派生关系**：Live 层 Provider 内部通过 `useXxxRef()` 获取数据源，经 `useSyncExternalStore` 或 subscribe 模式桥接为响应式 context。

---

## Context 层级

```
EditorRefContext                                    ← Ref：config, chronicle, registry, 状态 setters
│
├── DocumentRefContext                              ← Ref：getDocument
│   │
│   ├── DocumentLiveContext                         ← Live：派生自 DocumentRef（title, pageIds, version）
│   │   │
│   │   ├── PageLiveContext                         ← Live：当前 page 响应式数据
│   │   │   │
│   │   │   └── WidgetLiveContext                   ← Live：当前 widget 响应式数据
│   │   │
│
├── EditorLive（hook-based）                        ← useEditorLive() 直接从 EditorRef store 读取
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

### Context 内容

```typescript
// ─── @canvix-react/toolkit-shared ───

// Ref：document 命令式引用（稳定，不触发 re-render）
interface DocumentRefContextValue {
  document: Readonly<DocumentRuntime>;
  getDocument: () => Readonly<DocumentRuntime>;
}

// Live：document 响应式数据（subscribe 触发时 version 变化）
interface DocumentLiveContextValue {
  title: string;
  desc: string;
  cover: string;
  pageIds: string[];
  version: number;
}

// Live：page 响应式数据
interface PageLiveContextValue {
  pageId: string;
  name: string;
  layout: PageRuntime['layout']; // size, direction, wrap, gap, align, justify, padding
  foreground: string;
  background: string;
  widgetIds: string[];
  version: number;
}

// Live：widget 响应式数据
interface WidgetLiveContextValue {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
  version: number;
}

// ─── @canvix-react/toolkit-editor ───

// Ref：编辑器命令式引用（稳定，不触发 re-render）
interface EditorRefContextValue {
  // 静态配置
  config: EditorConfig; // { i18n: I18nManager; theme: ThemeManager }

  // 数据操作
  chronicle: Chronicle;
  registry: WidgetRegistry;
  plugins: PluginMeta[];
  update(model: OperationModel, options?: UpdateOptions): void;
  beginTemp(): TempSession;

  // 编辑器 UI 状态操作（来自 EditorStateStore）
  setActivePage(pageId: string): void;
  setSelection(widgetIds: string[]): void;
  setHoveredWidget(id: string | null): void;
  setActiveTool(tool: ToolType): void;
  setZoom(zoom: number): void;
  setCamera(x: number, y: number): void;
  setInteracting(value: boolean): void;
  setFlowDrag(widgetId: string | null, size?: [number, number]): void;
  setFlowDropIndex(index: number | null): void;
  getSnapshot(): EditorStateSnapshot;
  onChange(listener: () => void): () => void;
}

// Live：编辑器 UI 状态响应式快照（hook-based，非 context provider）
interface EditorLiveContextValue {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  activeTool: ToolType;
  interacting: boolean;
  zoom: number;
  camera: { x: number; y: number };
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
}
```

### 消费方式

每级提供对应的 hook：

```typescript
// ─── 数据层 ───
const { document, getDocument } = useDocumentRef();     // Ref：命令式引用
const { title, pageIds, version } = useDocumentLive();  // Live：响应式
const { pageId, name, layout, ... } = usePageLive();    // Live：响应式
const { widgetId, pageId, ... } = useWidgetLive();      // Live：响应式

// ─── 编辑器层 ───
const ref = useEditorRef();                              // Ref：命令式引用
ref.update(model);                                       //   数据操作
ref.setSelection([widgetId]);                            //   UI 状态写入
ref.getSnapshot().zoom;                                  //   UI 状态同步读取

const { activePageId, zoom, ... } = useEditorLive();     // Live：全量快照（任意字段变化都 re-render）
const activePageId = useEditorLive('activePageId');       // Live：单字段（仅该字段变化时 re-render）
const { zoom, camera } = useEditorLive('zoom', 'camera');// Live：多字段 Pick（shallow-equal 稳定化）
const derived = useEditorLive(s => s.activeTool);         // Live：selector 派生（shallow-equal 稳定化）

// ─── 配置（从 EditorRef.config 派生）───
const { t, locale, setLocale } = useI18n();              // i18n（内部 useSyncExternalStore）
const { theme, setTheme } = useTheme();                  // 主题（内部 useSyncExternalStore）
```

### 编辑器状态架构

`EditorStateStore` 是一个轻量 external store（subscribe/getSnapshot 模式），由 App 层创建并注入 `EditorRefContext`。

`useEditorLive()` 内部通过 `useEditorRef()` 获取 store 的 `onChange` / `getSnapshot`，经 `useSelectiveStore`（基于 `useSyncExternalStore` + shallow-equal）实现选择性订阅：

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
): Result; // useSyncExternalStore + selector + shallow-equal 缓存

// Reader hooks
function useDocumentReader(): {
  getDocument(): Readonly<DocumentRuntime>;
};

function usePageReader(): {
  getPage(): Readonly<PageRuntime>;
};

function useWidgetReader(): {
  getWidget(): Readonly<WidgetRuntime>;
};
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
function useEditorRef(): EditorRefContextValue;      // Ref：命令式引用 + 状态操作

// 编辑器 Live hooks（选择性订阅，无 Provider）
function useEditorLive(): EditorLiveContextValue;                       // 全量快照
function useEditorLive<K extends keyof EditorLiveContextValue>(key: K): EditorLiveContextValue[K];  // 单字段
function useEditorLive<K extends keyof EditorLiveContextValue>(...keys: K[]): Pick<...>;            // 多字段
function useEditorLive<R>(selector: (s: EditorLiveContextValue) => R): R;                           // selector
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

## 稳定性保证

### Context 值稳定性

- `EditorRefContext` 所有字段在应用生命周期内稳定（同一 store/chronicle 实例的方法引用），不触发 re-render
- `DocumentRefContext` 中的 `document` 和 `getDocument` 在应用生命周期内稳定（同一 chronicle 实例），不触发 re-render
- `useEditorLive()` 由 `useSelectiveStore` 驱动，支持选择性订阅，仅关注的字段变化时触发 re-render
- `DocumentLiveContext` 包含 `version` 等响应式数据，version 仅在 subscribe 回调触发时变化，只影响订阅了该 context 的消费者
- `PageLiveContext` 同理，version 仅在 page 相关 subscribe 触发时变化
- `WidgetLiveContext` 同理，仅在对应 widget 的 subscribe 触发时变化

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
- 未来插件扩展 SDK 基于 Toolkit 二次封装，而非直接依赖 Runtime

---

## 包结构

```
domains/
├── toolkit-shared/
│   ├── package.json              # @canvix-react/toolkit-shared
│   └── src/
│       ├── context/
│       │   ├── document-ref.ts   # DocumentRefContext + DocumentRefProvider + useDocumentRef
│       │   ├── document-live.ts  # DocumentLiveContext + useDocumentLive + useDocument
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
│       │   ├── shallow-equal.ts         # 通用浅比较
│       │   └── use-selective-store.ts   # useSyncExternalStore + selector + shallow-equal
│       └── index.ts
│
└── toolkit-editor/
    ├── package.json              # @canvix-react/toolkit-editor
    └── src/
        ├── context/
        │   ├── editor-ref.ts     # EditorRefContext + useEditorRef + useI18n + useTheme
        │   └── editor-live.ts    # useEditorLive（选择性订阅，直接读取 EditorRef store）
        ├── store/
        │   └── editor-state-store.ts  # EditorStateStore（轻量 external store，兼容 useSyncExternalStore）
        ├── hooks/
        │   ├── use-document-editor.ts
        │   ├── use-page-editor.ts
        │   ├── use-widget-editor.ts
        │   ├── use-chronicle-data.ts
        │   └── use-chronicle-selective.ts
        └── index.ts
```
