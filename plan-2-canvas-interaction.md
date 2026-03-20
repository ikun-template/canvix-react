# Plan 2: Canvas 画布交互（依赖 Plan 1）

## 前提

Plan 1 已完成：EditorState 有 `activeTool`、`interacting`，有 `useEditorState` hook。

## 实现范围

| 交互     | 说明                                                  |
| -------- | ----------------------------------------------------- |
| 选中样式 | 蓝色边框 + 8 个 resize 手柄（四角 + 四边中点）        |
| 拖拽移动 | pointerdown 在 widget 上 → 拖拽更新 position          |
| 拖拽缩放 | pointerdown 在 resize 手柄 → 拖拽更新 size + position |
| 多选     | Shift+Click 追加/移除                                 |
| 取消选中 | 点击空白（已有，保持）                                |

不含：快捷键、框选、画布缩放/平移。

## 架构

### SelectionOverlay（覆盖层）

在 canvas 的 page 容器内顶层渲染，不侵入 widget 渲染逻辑：

```
<page-container>           ← position: relative
  <widgets...>             ← 正常渲染
  <SelectionOverlay />     ← position: absolute, inset: 0, pointer-events: none
    <SelectionBox />       ← 每个选中 widget 一个，pointer-events: auto (仅手柄)
```

SelectionBox 读取对应 widget DOM 的位置/尺寸来定位边框。

### useCanvasInteraction（交互状态机）

```typescript
type Interaction =
  | { type: 'idle' }
  | {
      type: 'dragging';
      widgetIds: string[];
      origin: Point;
      startPositions: Map<string, Point>;
    }
  | {
      type: 'resizing';
      widgetId: string;
      handle: HandleDir;
      origin: Point;
      startRect: Rect;
    };
```

流程：

- **pointerdown** 在 widget 上 → 判断 Shift 多选 → 进入 `dragging`
- **pointerdown** 在 handle 上 → 进入 `resizing`
- **pointermove** → `TempSession.update()` 实时更新 position/size
- **pointerup** → `TempSession.commit()`，回到 `idle`
- 拖拽开始时 `editorState.setInteracting(true)`，结束时 `false`

使用 `setPointerCapture` 确保拖出画布也能正常结束。

### 事件分层

canvas 容器上统一 `onPointerDown`，根据 target 分发：

1. `[data-handle]` → resizing
2. `[data-widget-id]` → 选中 + dragging
3. 其他 → 清空选中

`pointermove`/`pointerup` 在 pointerdown 时绑定到 document，pointerup 时移除。

## 文件清单

| 文件                                                         | 操作 | 说明                                     |
| ------------------------------------------------------------ | ---- | ---------------------------------------- |
| `layouts/layout-editor-canvas/src/selection-overlay.tsx`     | 新增 | 选中边框 + 8 个 resize 手柄              |
| `layouts/layout-editor-canvas/src/use-canvas-interaction.ts` | 新增 | 拖拽/resize 状态机 + pointer 事件        |
| `layouts/layout-editor-canvas/src/canvas.tsx`                | 修改 | 集成 overlay + interaction，替换 onClick |

## 实现细节

### SelectionOverlay

- 遍历 `selectedWidgetIds`，对每个 id 查找 page 容器内 `[data-widget-id="xxx"]`
- 读取 `offsetLeft / offsetTop / offsetWidth / offsetHeight`
- 渲染边框：`1px solid` `border-primary`，绝对定位
- 8 个手柄：`8×8` 白色方块 + `1px` `border-primary`，定位在四角和四边中点
- 手柄带 `data-handle="nw|n|ne|e|se|s|sw|w"` 属性
- 手柄 `pointer-events: auto`，边框本身 `pointer-events: none`（不拦截 widget 点击）
- 需要在 widget 数据变化时（position/size 改变）重新计算位置 — 监听 chronicle update 或用 ResizeObserver

### useCanvasInteraction

```typescript
function useCanvasInteraction(
  ctx: PluginContext,
  pageContainerRef: RefObject<HTMLElement>,
): {
  onPointerDown: (e: React.PointerEvent) => void;
};
```

- 内部用 `useRef` 管理 interaction state（不触发 re-render）
- **dragging**：
  - delta = currentPointer - origin
  - 对每个选中 widget：newPos = startPosition + delta
  - `tempSession.update({ target: 'widget', pageId, id, operations: [{ kind: 'update', chain: ['position', 'axis'], value: [newX, newY] }] })`
- **resizing**：
  - 根据 handle 方向计算新 size 和 position 偏移
  - 最小尺寸 20×20
  - 同样用 tempSession
- pointerup 时 `tempSession.commit()`

### 多选行为

- **非 Shift 点击 widget**：`setSelection([widgetId])`（单选替换）
- **Shift 点击 widget**：已选中则移除，未选中则追加
- **拖拽移动**：所有选中 widget 同步移动
- **Resize**：仅操作单个 widget（多选时操作鼠标命中的那个 widget 的手柄）

## 步骤

1. 新增 `use-canvas-interaction.ts` — 交互状态机
2. 新增 `selection-overlay.tsx` — 选中 UI
3. 修改 `canvas.tsx` — 集成，传入 page 容器 ref
