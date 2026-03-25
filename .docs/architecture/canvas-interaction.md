# 架构设计：Canvas 交互

## 概述

Canvas 是编辑器的核心画布区域，负责 page/widget 渲染和所有用户交互。交互体系基于 **Camera 模型**（世界空间坐标系），通过 pointer 事件分发实现缩放、平移、选中、拖拽移动、拖拽缩放和 flow 排序等操作。

---

## 坐标系与 Camera 模型

### 世界坐标 vs 屏幕坐标

Canvas 使用两套坐标系：

| 坐标系                | 含义                      | 特性                           |
| --------------------- | ------------------------- | ------------------------------ |
| **世界坐标** (world)  | Page 和 widget 的固有坐标 | zoom-independent，不随缩放变化 |
| **屏幕坐标** (screen) | 浏览器视口内的像素坐标    | zoom-dependent，随缩放等比变化 |

### Camera 定义

`camera` 表示视口左上角对应的世界空间坐标，存储在 `EditorStateStore` 中：

```typescript
camera: {
  x: number;
  y: number;
} // 世界空间坐标，zoom-independent
```

### 坐标转换

```
世界坐标 → 屏幕坐标:  screenX = (worldX - camera.x) * zoom
屏幕坐标 → 世界坐标:  worldX  = camera.x + screenX / zoom
```

### CSS Transform

Page container 使用以下 transform 将世界空间映射到屏幕：

```css
transform-origin: 0 0;
transform: scale(zoom) translate(-camera.x, -camera.y);
```

CSS `scale(zoom)` 先应用，再在缩放后的空间中平移 `(-camera.x, -camera.y)`，等价于：先将世界坐标偏移 camera，再按 zoom 缩放。

---

## 交互分发：use-canvas-pointer

所有 pointer 交互通过 `useCanvasPointer` 统一分发，基于 hit test 结果决定行为：

```
pointerDown
  │
  ├── space held 或 hand tool → startPan（平移）
  │
  ├── hit resize handle → createDragResize.start（缩放）
  │
  ├── hit widget
  │   ├── shift + click → 切换多选
  │   ├── flow widget → createFlowDragMove.start（flow 排序）
  │   └── absolute widget → createDragMove.start（自由移动）
  │
  └── hit empty space → 清空选中
```

### 惰性初始化

三种拖拽 handler（`createDragMove`、`createDragResize`、`createFlowDragMove`）采用工厂模式，通过 `useRef` 在首次渲染时惰性创建，避免每次 render 重新实例化。

---

## 缩放与平移：use-zoom-pan

### Zoom-to-cursor

Ctrl/Cmd + 滚轮触发缩放，保持鼠标位置下的世界坐标点不动：

```typescript
// mouseX/Y: 鼠标相对 canvas 元素的屏幕偏移
const newCameraX = camera.x + mouseX * (1 / oldZoom - 1 / newZoom);
const newCameraY = camera.y + mouseY * (1 / oldZoom - 1 / newZoom);
```

**原理**：鼠标位置对应的世界坐标 `W = camera + mouse / zoom`，要求 zoom 变化后 W 不变，解得 camera 增量为 `mouse * (1/oldZoom - 1/newZoom)`。

zoom 和 camera 通过 `ref.batch()` 在同一 notify 周期内更新，避免中间状态闪烁。

缩放范围：`[ZOOM_MIN, ZOOM_MAX]`（0.1 ~ 5），步长 `ZOOM_STEP`（0.05）。

### Pan（平移）

空格键或 hand tool 激活平移模式。拖拽时：

```typescript
// 屏幕位移 → 世界空间位移 → camera 反向移动
const dx = (clientX - originX) / zoom;
const dy = (clientY - originY) / zoom;
ref.setCamera(startCamera.x - dx, startCamera.y - dy);
```

鼠标向右拖→画面向右移→camera.x 减小（世界坐标左移）。

### Camera Clamp

平移操作中对 camera 做世界空间 clamp，防止 page 完全滑出视口：

```typescript
// viewport 在世界空间中的尺寸
viewW = canvas.clientWidth / zoom;
viewH = canvas.clientHeight / zoom;
margin = max(viewW, viewH) * SCROLL_MARGIN_RATIO;

// 每轴独立 clamp
min = -margin; // camera 最小值（page 右/下边缘离视口左/上边缘 margin 距离）
max = pageSize + margin - viewSize; // camera 最大值
```

当 `min >= max`（viewport 大于 page + 2\*margin），camera 居中：`(pageSize - viewSize) / 2`。

Zoom 操作不做 clamp，允许缩放时自由探索。

### 空格键临时 hand tool

`keydown Space` 激活临时平移模式（通过 `spaceHeldRef`），`keyup Space` 恢复。输入框和文本域内不响应。

---

## Widget 拖拽移动：use-drag-move

处理 absolute 定位 widget 的自由拖拽。

### 两阶段设计

所有拖拽交互共用两阶段模式：

1. **Pending**：记录起始位置，监听 pointermove
2. **Active**：超过阈值（`DRAG_THRESHOLD = 4px`）后激活，创建 TempSession

未超过阈值松手视为点击，不触发拖拽。

### 坐标转换

屏幕空间鼠标位移 `/ zoom` 得到世界空间偏移量，叠加 widget 初始位置：

```typescript
const dx = (clientX - origin.x) / zoom;
const dy = (clientY - origin.y) / zoom;
newPosition = [round(initial[0] + dx), round(initial[1] + dy)];
```

### TempSession

通过 `ctx.beginTemp()` 创建临时会话，拖拽中的中间状态写入 temp，松手时 `commit()` 或按 Esc 时 `rollback()`。支持多选批量移动。

---

## Widget 拖拽缩放：use-drag-resize

处理 8 方向 resize handle 的拖拽缩放。

### 方向因子表

每个 handle 方向映射为 4 个因子 `[fx, fy, fw, fh]`，将鼠标 delta 分别作用于 position 和 size：

```
| Handle | dx→x | dy→y | dx→w | dy→h |
|--------|------|------|------|------|
| nw     | +1   | +1   | -1   | -1   |
| n      |  0   | +1   |  0   | -1   |
| ne     |  0   | +1   | +1   | -1   |
| e      |  0   |  0   | +1   |  0   |
| se     |  0   |  0   | +1   | +1   |
| s      |  0   |  0   |  0   | +1   |
| sw     | +1   |  0   | -1   | +1   |
| w      | +1   |  0   | -1   |  0   |
```

最小尺寸约束：`MIN_WIDGET_SIZE = 20px`。超限时固定对边不动。

同样使用 TempSession + Esc rollback 模式。

---

## Flow 排序拖拽：use-flow-drag

处理 flow 布局（非 absolute）widget 的排序拖拽。

### 视觉反馈

拖拽激活时：

- 被拖拽 widget 切换为 `position: absolute`，跟随鼠标移动
- 通过 `data-drag-source` 标记，其余 flow widget 缩小（CSS `transform: scale(0.95)`）
- Page container 叠加对角条纹背景表示拖拽模式

### Drop Index 计算

1. 临时隐藏 placeholder（`display: none`）获取稳定的元素位置
2. 按 cross axis 分组为行/列
3. 定位指针所在行，在行内按 main axis 中点二分查找插入位置
4. 将 visual index 映射回 `page.widgets` 数组的真实 index（跳过 slot 子 widget 和拖拽源）
5. 恢复 placeholder

松手时通过 `move` operation 提交排序变更。

---

## 选中框与 Hover：selection-overlay

### 测量方式

选中框使用 `offsetLeft/offsetTop`（相对 page container 的世界空间坐标），overlay 元素定位在 page container 内部，无需额外坐标转换。

### 更新策略

| 场景     | 机制                                 |
| -------- | ------------------------------------ |
| 选中变化 | `useEffect` 依赖 `selectedWidgetIds` |
| 拖拽中   | `requestAnimationFrame` 循环测量     |
| DOM 变化 | `MutationObserver` 监听 style 属性   |

### Hover 高亮

通过 `onPointerMove` 冒泡 hit test `[data-widget-id]`，设置 `hoveredWidgetId`。交互中（`interacting = true`）暂停 hover 检测。未选中的 hover widget 显示虚线框。

---

## 常量定义

```typescript
// interactions/types.ts
HANDLE_SIZE = 6; // resize 手柄视觉尺寸
MIN_WIDGET_SIZE = 20; // widget 最小尺寸
ZOOM_MIN = 0.1; // 最小缩放
ZOOM_MAX = 5; // 最大缩放
ZOOM_STEP = 0.05; // 缩放步长
DRAG_THRESHOLD = 4; // 拖拽激活阈值（px）
SCROLL_MARGIN_RATIO = 0.5; // 平移边距比例
```

---

## 文件结构

```
layouts/layout-editor-canvas/src/
├── canvas.tsx                        # Canvas 主组件，camera transform + 居中
├── page-editor.tsx                   # Page 渲染（widget 列表）
├── selection-overlay.tsx             # 选中框 + hover 高亮
├── color-contrast.tsx                # flow drag 条纹背景计算
└── interactions/
    ├── types.ts                      # 常量 + 类型定义
    ├── use-canvas-pointer.ts         # 事件分发入口
    ├── use-zoom-pan.ts               # 缩放 + 平移（camera 模型）
    ├── use-drag-move.ts              # absolute widget 拖拽移动
    ├── use-drag-resize.ts            # widget resize（8 方向）
    └── use-flow-drag.ts              # flow widget 排序拖拽
```

---

## 状态依赖

交互模块通过 `EditorRefContext`（命令式 Ref）读写状态，不直接触发 re-render：

| 状态字段            | 写入方                   | 读取方                                                |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `camera`            | use-zoom-pan             | canvas.tsx (transform)                                |
| `zoom`              | use-zoom-pan             | 所有拖拽 handler (坐标转换)                           |
| `selectedWidgetIds` | use-canvas-pointer       | selection-overlay, inspector                          |
| `hoveredWidgetId`   | canvas.tsx (pointerMove) | selection-overlay, sidebar                            |
| `activeTool`        | toolbox                  | use-canvas-pointer (分发), canvas.tsx (cursor)        |
| `interacting`       | 所有拖拽 handler         | canvas.tsx (暂停 hover), selection-overlay (RAF 测量) |
| `flowDragWidgetId`  | use-flow-drag            | canvas.tsx (条纹背景), selection-overlay (隐藏)       |
| `flowDropIndex`     | use-flow-drag            | use-flow-drag (commit)                                |
