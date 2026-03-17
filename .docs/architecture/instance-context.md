# 架构设计：实例上下文

## 问题回顾

Widget 级别执行变更需要 `pageId`，参考项目要求调用方每次显式传入，API 冗余且易错。本项目通过 React Context 逐级注入上下文，消费方无感获取上游信息。

---

## Context 层级

三级 Context 逐层嵌套，由外向内注入：

```
<DocumentProvider>                    ← 提供 document 上下文
  <PageProvider pageId={id}>          ← 提供当前 page 上下文
    <WidgetProvider widgetId={id}>    ← 提供当前 widget 上下文
      <WidgetRenderer />
    </WidgetProvider>
  </PageProvider>
</DocumentProvider>
```

### Context 内容

```typescript
interface DocumentContext {
  /** Modifier 实例，变更统一入口 */
  modifier: Modifier;
  /** 只读的 document 数据引用 */
  document: Readonly<Document>;
}

interface PageContext {
  pageId: string;
}

interface WidgetContext {
  widgetId: string;
  /** 所属 page id（从 PageContext 继承） */
  pageId: string;
  /** 父级 widget id（若在 slot 内，否则 null 表示根级 widget） */
  parentId: string | null;
  /** 所在 slot 名称（若在 slot 内） */
  slotName: string | null;
}
```

### 消费方式

每级提供对应的 hook：

```typescript
const { modifier, document } = useDocument();
const { pageId } = usePage();
const { widgetId, pageId, parentId, slotName } = useWidget();
```

---

## Toolkit

基于 Context 封装的操作能力集合，内部从 Context 取 id 组装 `OperationModel`，调用方只关心"改什么"，不关心"改谁的"。

Toolkit 按使用场景拆分为两套导出：

| 导出             | 使用场景                            | 说明                 |
| ---------------- | ----------------------------------- | -------------------- |
| `toolkit/editor` | 编辑器（app-editor）、widget 编辑态 | 完整读写能力         |
| `toolkit/viewer` | 查看器（app-viewer）、widget 查看态 | 只读能力，无变更操作 |

### toolkit/editor

```typescript
// Document 级
function useDocumentToolkit(): {
  getDocument(): Readonly<Document>;
  update(ops: OpUpdate['data']): void;
  addPage(page: Partial<Page>, index?: number): void;
  deletePage(pageId: string): void;
  movePage(pageId: string, to: number): void;
};

// Page 级
function usePageToolkit(): {
  getPage(): Readonly<Page>;
  update(ops: OpUpdate['data']): void;
  addWidget(widget: Partial<Widget>, index?: number): void;
  deleteWidget(widgetId: string): void;
  moveWidget(widgetId: string, to: number): void;
};

// Widget 级
function useWidgetToolkit(): {
  getWidget(): Readonly<Widget>;
  update(ops: OpUpdate['data']): void;
  addToSlot(slotName: string, widget: Partial<Widget>, index?: number): void;
  removeFromSlot(slotName: string, widgetId: string): void;
};
```

### toolkit/viewer

```typescript
// Document 级
function useDocumentToolkit(): {
  getDocument(): Readonly<Document>;
};

// Page 级
function usePageToolkit(): {
  getPage(): Readonly<Page>;
};

// Widget 级
function useWidgetToolkit(): {
  getWidget(): Readonly<Widget>;
};
```

> viewer 导出仅包含只读能力，不暴露任何变更方法。确保查看器和 widget 查看态不会意外修改数据。

### Widget 内使用

Widget 开发时同样区分编辑态和查看态导入：

```typescript
// widget 编辑态
import { useWidgetToolkit } from '@ikun-kit/toolkit/editor';
const { getWidget, update } = useWidgetToolkit();

// widget 查看态
import { useWidgetToolkit } from '@ikun-kit/toolkit/viewer';
const { getWidget } = useWidgetToolkit();
```

---

## 稳定性保证

### Context 值稳定

- DocumentContext 中的 `modifier` 在应用生命周期内不变（单例）
- PageContext 仅包含 `pageId`，在 Page 组件挂载期间不变
- WidgetContext 仅包含 id 信息，在 Widget 组件挂载期间不变
- Context 值均为静态标识信息，不包含响应式数据，不会因为数据变更而触发 Context 消费者 re-render

### 数据读取与 Context 分离

- Context 只传递"我是谁"（id），不传递"我的数据是什么"
- 数据读取通过 Toolkit 的 get 方法按需获取，或通过变更订阅接收增量更新
- 这确保了 Context 变化频率极低（仅在挂载/卸载时），不会成为性能瓶颈

---

## 嵌套 Widget 的 Context 传递

Widget 渲染 slot 内的子 widget 时，为每个子 widget 提供新的 WidgetProvider：

```
<WidgetProvider widgetId="A">           ← Widget A
  <SlotRenderer slotName="content">
    <WidgetProvider widgetId="C"        ← Widget C（A 的 slot 子级）
      parentId="A"
      slotName="content">
      ...
    </WidgetProvider>
  </SlotRenderer>
</WidgetProvider>
```

子 widget 通过 `useWidget()` 可获取完整的层级信息（自身 id、所属 page、父 widget、所在 slot），用于组装 Operation 或 UI 展示（如面包屑导航）。

---

## Runtime 与 Toolkit 的关系

```
dock-editor/
  └── runtime/           ← 编辑器内部中枢（初始化、插件管理、钩子调度）
                           不对外暴露，仅 dock 内部使用

domains/
  └── toolkit/           ← 对外暴露的能力集合
      ├── editor 导出     ← 读写能力，供 app-editor / layouts / widget 编辑态使用
      └── viewer 导出     ← 只读能力，供 app-viewer / widget 查看态使用
```

- **Runtime** 是 dock 内部的运行时中枢，负责初始化 Modifier、管理插件生命周期、调度钩子。不直接暴露给布局模块或 widget
- **Toolkit** 是 Runtime 对外的能力投影，封装 Context + hooks。布局模块和 widget 只依赖 Toolkit，不感知 Runtime 的存在
- 未来插件扩展 SDK 基于 Toolkit 二次封装，而非直接依赖 Runtime

---

## 包结构

```
domains/
└── toolkit/
    ├── package.json          # @ikun-kit/toolkit
    └── src/
        ├── context/
        │   ├── document.ts   # DocumentContext + DocumentProvider
        │   ├── page.ts       # PageContext + PageProvider
        │   └── widget.ts     # WidgetContext + WidgetProvider
        ├── editor/
        │   ├── use-document.ts
        │   ├── use-page.ts
        │   ├── use-widget.ts
        │   └── index.ts      # toolkit/editor 入口
        ├── viewer/
        │   ├── use-document.ts
        │   ├── use-page.ts
        │   ├── use-widget.ts
        │   └── index.ts      # toolkit/viewer 入口
        └── index.ts           # 公共类型导出
```
