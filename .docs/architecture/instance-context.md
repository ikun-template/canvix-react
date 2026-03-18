# 架构设计：实例上下文

## 问题回顾

Widget 级别执行变更需要 `pageId`，参考项目要求调用方每次显式传入，API 冗余且易错。本项目通过 React Context 逐级注入上下文，消费方无感获取上游信息。

---

## Context 层级

三级 Context 逐层嵌套，由外向内注入：

```
<DocumentRefProvider>                             ← 提供 document 命令式引用（getDocument）
  <EditorProvider>                                ← 提供 chronicle（仅编辑器）
    <DocumentLiveProvider subscribe={...}>        ← 提供 document 响应式数据（含 subscribe）
      <PageLiveProvider pageId={id}               ← 提供当前 page 上下文（含 subscribe）
        subscribe={...}>
        <WidgetLiveProvider widgetId={id}         ← 提供当前 widget 上下文（含 subscribe）
          subscribe={...}>
          <WidgetRenderer />
        </WidgetLiveProvider>
      </PageLiveProvider>
    </DocumentLiveProvider>
  </EditorProvider>
</DocumentRefProvider>
```

### Context 内容

```typescript
// @canvix-react/toolkit-shared

// 命令式引用（稳定，不触发 re-render）
interface DocumentRefContextValue {
  document: Readonly<DocumentRuntime>;
  getDocument: () => Readonly<DocumentRuntime>;
}

// 响应式数据（subscribe 触发时 version 变化）
interface DocumentLiveContextValue {
  title: string;
  desc: string;
  cover: string;
  pageIds: string[];
  version: number;
}

interface PageLiveContextValue {
  pageId: string;
  name: string;
  layout: { size: [number, number] };
  background: string;
  widgetIds: string[];
  version: number;
}

interface WidgetLiveContextValue {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
  version: number;
}

// @canvix-react/toolkit-editor
interface EditorContextValue {
  chronicle: Chronicle;
}
```

### 消费方式

每级提供对应的 hook：

```typescript
const { document, getDocument } = useDocumentRef(); // 命令式引用
const { title, pageIds, version } = useDocumentLive(); // 或 useDocument()
const { pageId, name, layout, widgetIds, version } = usePageLive(); // 或 usePage()
const { widgetId, pageId, parentId, slotName, version } = useWidgetLive(); // 或 useWidget()
```

---

## Toolkit

基于 Context 封装的操作能力集合，拆分为两个独立包：

| 包                             | 使用场景        | 说明                                         |
| ------------------------------ | --------------- | -------------------------------------------- |
| `@canvix-react/toolkit-shared` | 编辑器 + 查看器 | Context、Provider、只读 reader hooks         |
| `@canvix-react/toolkit-editor` | 编辑器专用      | EditorContext、chronicle hooks、editor hooks |

### toolkit-shared（通用层）

不依赖 Chronicle，提供 Ref/Live Context 定义、LiveProvider 和只读 reader hooks：

```typescript
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

依赖 Chronicle，提供读写操作：

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

- `DocumentRefContext` 中的 `document` 和 `getDocument` 在应用生命周期内稳定（同一 chronicle 实例），不触发 re-render
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
│       └── index.ts
│
└── toolkit-editor/
    ├── package.json              # @canvix-react/toolkit-editor
    └── src/
        ├── context/
        │   └── editor.ts         # EditorContext + EditorProvider
        ├── hooks/
        │   ├── use-document-editor.ts
        │   ├── use-page-editor.ts
        │   ├── use-widget-editor.ts
        │   ├── use-chronicle-data.ts
        │   └── use-chronicle-selective.ts
        └── index.ts
```
