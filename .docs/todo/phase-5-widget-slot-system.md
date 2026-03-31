# Phase 5：Widget 插槽系统

> Widget 底座插槽的完整实现：声明、渲染、拖入交互、层级管理。

## 状态：待开始

## 前置：Phase 4 交互增强完成（拖拽基础设施就绪）

---

## 5.1 Widget 插槽声明与 Drop Zone 渲染

### 任务

- Widget 通过 `WidgetSlot` 声明可接受子 widget 的插槽
- Canvas 内渲染插槽 drop zone（空插槽显示占位提示）
- 插槽区域的视觉样式（边框、空态提示）

### 现有基础

- Schema 已有 `WidgetSlot`（name, label, accept, maxCount）
- `WidgetRuntime.slots` 已有 `Record<string, string[]>` 结构
- `SlotRenderer` 已存在（`domains/page-renderer/src/slot-renderer.tsx`）
- `useWidgetEditor().addToSlot()` API 已存在

### 涉及文件

- `domains/page-renderer/src/slot-renderer.tsx` — 增强渲染
- `layouts/layout-editor-canvas/src/` — drop zone UI

---

## 5.2 拖入 Widget 到插槽

### 任务

- 从 toolbox 拖拽 widget 时，识别 hover 到的插槽 drop zone
- 拖入时校验约束：`accept`（类型白名单）、`maxCount`（数量上限）
- 松手提交：创建 widget + 添加到插槽（`addToSlot`）
- 从 sidebar widget explorer 拖入插槽的交互

### 涉及文件

- `layouts/layout-editor-canvas/src/interactions/` — 拖拽交互
- `layouts/layout-editor-toolbox/src/toolbox.tsx` — 拖拽源

---

## 5.3 Sidebar 插槽层级树

### 任务

- Widget explorer 展示插槽层级结构（树状缩进）
- 插槽节点显示：插槽名称 + 子 widget 列表
- 支持在层级树中拖拽 widget 进出插槽
- 插槽内 widget 的选中、hover 联动

### 涉及文件

- `layouts/layout-editor-sidebar/src/widget-explorer.tsx` — 重构为树状结构

---

## 5.4 插槽约束校验

### 任务

- `accept` 校验：`accept(ctx: { owner, incoming }) => boolean`，拖拽时实时调用。`owner` 为插槽所属 widget（可读 `slots` 判断已有数量），`incoming` 为即将插入的 widget 列表（支持多个）
- 校验失败的视觉反馈（禁止图标、颜色变化）

### 涉及文件

- 校验逻辑工具函数（canvas 拖拽和 sidebar 拖拽共用）
- 拖拽交互中集成校验

---

## 完成标准

- [ ] Widget 可声明插槽，Canvas 内正确渲染 drop zone
- [ ] 从 toolbox 拖入 widget 到插槽功能可用
- [ ] Sidebar 展示插槽层级树
- [ ] accept / maxCount 约束校验生效
