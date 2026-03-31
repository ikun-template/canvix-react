# 统一拖拽引擎

> 拆分为 `packages/dnd-sort`（通用排序拖拽）和 `domains/dnd-canvas`（canvas 拖拽交互），替代当前分散的拖拽实现。

## 状态：进行中

---

## 背景

当前拖拽逻辑分散在多处，各自独立实现 pointer 监听、ghost 渲染、hit test、drop 提交，代码重复且无法互通：

| 实现                    | 位置                | 场景                           |
| ----------------------- | ------------------- | ------------------------------ |
| `use-flow-drag.ts`      | canvas interactions | flow widget 排序               |
| `use-drag-move.ts`      | canvas interactions | absolute widget 位置拖拽       |
| `use-toolbox-drag.ts`   | toolbox             | 拖入 widget 到 canvas/slot     |
| `use-tree-drag.ts`      | sidebar             | widget 树节点排序（含跨 slot） |
| `use-list-drag-sort.ts` | sidebar             | page 列表排序                  |

**不纳入拖拽引擎**（保持现有实现）：

| 实现                 | 场景          | 原因                                  |
| -------------------- | ------------- | ------------------------------------- |
| `use-drag-resize.ts` | widget resize | 纯尺寸增量 + DraftSession，非拖拽转移 |
| `use-zoom-pan.ts`    | 画布 pan/zoom | 视口控制                              |

---

## 包拆分

### `packages/dnd-sort`（`@canvix-react/dnd-sort`）— 通用排序拖拽

纯机械排序工具，零领域知识。

**职责**：

- Pointer 事件管理（阈值判定、pointermove/up on document）
- Ghost 元素渲染（创建/跟随/销毁）
- 空间 hit test（基于 clientY 计算 drop index）
- Drop index 回调

**不负责**：

- 不知道 widget/page/canvas/zoom
- 不做 accept 校验（消费者自行处理）
- 不管理业务状态

**消费者**：

- Sidebar page 列表排序
- Sidebar widget 树排序（机械部分）

```typescript
interface SortDragOptions<T> {
  /** 拖拽项数据 */
  item: T;
  /** Ghost 渲染 */
  renderGhost?: (item: T) => HTMLElement;
  /** 拖拽阈值（默认 4px） */
  threshold?: number;
  /** 排序方向 */
  direction?: 'vertical' | 'horizontal';
}

interface SortDropResult {
  fromIndex: number;
  toIndex: number;
}

// React hooks
function useSortDrag<T>(options: SortDragOptions<T>): {
  dragProps: { onPointerDown: (e: React.PointerEvent) => void };
};

function useSortContainer(options: {
  onSort: (result: SortDropResult) => void;
}): {
  containerRef: RefCallback<HTMLElement>;
  dropIndex: number | null;
  isDragging: boolean;
};
```

### `domains/dnd-canvas`（`@canvix-react/dnd-canvas`）— Canvas 拖拽交互

Canvas 专属拖拽，有编辑器领域知识。

**职责**：

- **Flow 模式拖拽**：排序 + 可改变父容器（root ↔ slot、slot ↔ slot）
- **Absolute 模式拖拽**：仅改变位置坐标，不可改变父容器
- **Toolbox 拖入**：从 toolbox 拖新 widget 到 canvas root 或 slot
- Slot drop zone 注册和 accept 校验
- Zoom 感知（坐标 `/ zoom` 转换）
- DraftSession 集成（absolute 模式预览）

**核心区分**：

|            | Flow 模式             | Absolute 模式              |
| ---------- | --------------------- | -------------------------- |
| 排序       | ✓ 可在同容器内排序    | ✗                          |
| 改变父容器 | ✓ 可跨 root/slot 移动 | ✗ 锁定在当前父容器         |
| 位置       | 由 flex 布局决定      | 自由坐标 (`position.axis`) |
| 预览       | DOM 重排              | DraftSession 实时更新      |
| 拖入 slot  | ✓                     | ✗                          |

**Slot Drop Zone**：

- `EditorSlotRenderer` 内部注册 drop zone
- 拖拽 hover 时调用 `accept({ owner, incoming })` 校验
- 校验通过高亮、失败禁止反馈
- 仅 flow 模式 widget 和 toolbox 新增可以进入 slot

```typescript
// Canvas 拖拽上下文（由 canvas layout plugin 提供）
interface CanvasDragContext {
  ref: EditorRefContextValue;
  canvasRef: RefObject<HTMLElement>;
  pageContainerRef: RefObject<HTMLElement>;
}

// Flow 模式拖拽
function useFlowDrag(ctx: CanvasDragContext): {
  startFlowDrag(e: PointerEvent, widgetId: string, pageId: string): void;
};

// Absolute 模式拖拽
function useAbsoluteDrag(ctx: CanvasDragContext): {
  startAbsoluteDrag(e: PointerEvent, widgetIds: string[], pageId: string): void;
};

// Toolbox → Canvas 拖入
function useToolboxDrag(ctx: CanvasDragContext): {
  startToolboxDrag(e: PointerEvent, definition: WidgetPluginDefinition): void;
};

// Slot drop zone 注册
function useSlotDropZone(options: {
  slotName: string;
  ownerWidget: WidgetRuntime;
  slotDef: WidgetSlot;
}): {
  zoneRef: RefCallback<HTMLElement>;
  isOver: boolean;
  accepted: boolean;
};
```

---

## 实施任务

### 1. ✅ 创建 `packages/dnd-sort`

- ✅ 包骨架（package.json, tsconfig.json）
- ✅ 实现排序拖拽核心 `SortEngine`：pointer 管理、ghost、空间 hit test
- ✅ React hooks：`useSortDrag`, `useSortContainer`, `useSortMonitor`
- 无外部依赖，纯 React + DOM

### 2. 创建 `domains/dnd-canvas`

- 包骨架
- 依赖：`@canvix-react/editor-types`, `@canvix-react/shared-types`
- 实现 `useFlowDrag`：flow widget 排序 + 跨容器移动
- 实现 `useAbsoluteDrag`：absolute widget 位置拖拽（从 `use-drag-move.ts` 迁入）
- 实现 `useToolboxDrag`：toolbox 拖入 canvas/slot
- 实现 `useSlotDropZone`：slot drop zone 注册 + accept 校验
- Zoom 感知、DraftSession 集成

### 3. 改造 Canvas 交互

- `use-canvas-pointer.ts` 改为调用 `dnd-canvas` 的 hooks
- 删除 `use-flow-drag.ts`（逻辑迁入 `dnd-canvas`）
- 删除 `use-drag-move.ts`（逻辑迁入 `dnd-canvas`）
- `use-drag-resize.ts` 保持不变
- `use-zoom-pan.ts` 保持不变
- `FlowDragOverlay` 等视觉反馈改为响应 `dnd-canvas` 状态

### 4. 改造 Toolbox

- 删除 `use-toolbox-drag.ts`
- Widget 按钮改用 `dnd-canvas` 的 `useToolboxDrag`

### 5. ✅ 改造 Sidebar

- ✅ 删除 `use-tree-drag.ts`、`use-list-drag-sort.ts`
- ✅ Page 列表排序改用 `dnd-sort`（`page-explorer.tsx`）
- ✅ Widget 树排序改用 `dnd-sort`（`widget-explorer.tsx`）+ 消费者层处理跨 slot accept 校验和 move 提交

### 6. Slot zone 集成

- `EditorSlotRenderer` 中使用 `useSlotDropZone` 注册 drop zone
- `accept` 调用 `slotDef.accept?.({ owner, incoming })` 校验
- Drop 调用 `addToSlot()`

### 7. 清理

- 删除旧文件：`use-flow-drag.ts`, `use-drag-move.ts`, `use-toolbox-drag.ts`, `use-tree-drag.ts`, `use-list-drag-sort.ts`
- 确认 `use-drag-resize.ts`, `use-zoom-pan.ts` 不受影响

---

## 文件结构

```
packages/dnd-sort/
├── package.json            # @canvix-react/dnd-sort
├── tsconfig.json
└── src/
    ├── types.ts            # SortDragOptions, SortDropResult
    ├── sort-engine.ts      # 排序拖拽核心（pointer、ghost、hit test）
    ├── hooks.ts            # useSortDrag, useSortContainer
    └── index.ts

domains/dnd-canvas/
├── package.json            # @canvix-react/dnd-canvas
├── tsconfig.json
└── src/
    ├── types.ts            # CanvasDragContext 等
    ├── use-flow-drag.ts    # flow 模式拖拽（排序 + 跨容器）
    ├── use-absolute-drag.ts # absolute 模式拖拽（位置 + 锁定父容器）
    ├── use-toolbox-drag.ts # toolbox → canvas 拖入
    ├── use-slot-drop-zone.ts # slot drop zone 注册
    ├── utils.ts            # computeDropIndex、zoom 转换等
    └── index.ts
```

---

## 完成标准

- [x] `packages/dnd-sort` 创建，通用排序拖拽可用
- [ ] `domains/dnd-canvas` 创建，flow/absolute/toolbox 拖拽可用
- [ ] Canvas flow 拖拽：排序 + 跨容器移动正常
- [ ] Canvas absolute 拖拽：位置拖拽正常，不可改变父容器
- [ ] Toolbox 拖入：widget 可拖入 canvas root 和 slot
- [ ] Slot drop zone：accept 校验生效，视觉反馈正确
- [x] Sidebar page 排序：使用 dnd-sort
- [x] Sidebar widget 树排序：使用 dnd-sort + 跨 slot 校验
- [ ] 旧拖拽文件清理完成
- [ ] drag-resize / zoom-pan 不受影响
