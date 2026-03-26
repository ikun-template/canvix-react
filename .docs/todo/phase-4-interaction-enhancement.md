# Phase 4：交互增强

> Toolbox 缩放显示、Sidebar 拖拽排序。

## 状态：待开始

## 前置：Phase 3 核心功能完成

---

## 4.1 Toolbox 缩放百分比显示 + 输入调整

### 任务

- 在 toolbox 区域添加缩放百分比 number input
- 显示当前 zoom 值（百分比格式）
- 输入调整：用户输入百分比值，回车应用
- 范围约束：`ZOOM_MIN` ~ `ZOOM_MAX`（10% ~ 500%）

### 涉及文件

- `layouts/layout-editor-toolbox/src/toolbox.tsx` — 添加 zoom input

---

## 4.2 Sidebar page explorer 拖拽排序

### 任务

- 页面列表支持拖拽重排
- 拖拽时视觉反馈（拖拽中项、drop 位置指示）
- 松手提交 move operation（通过 Chronicle）
- 拖拽中其他交互暂停

### 涉及文件

- `layouts/layout-editor-sidebar/src/page-explorer.tsx`

---

## 4.3 Sidebar widget explorer 拖拽排序

### 任务

- widget 列表支持拖拽重排
- 拖拽时视觉反馈
- 区分 absolute / flow widget 的排序语义
- 松手提交 move operation

### 涉及文件

- `layouts/layout-editor-sidebar/src/widget-explorer.tsx`

---

## 完成标准

- [ ] Toolbox 显示当前缩放百分比，可通过输入调整
- [ ] Sidebar page explorer 支持拖拽排序
- [ ] Sidebar widget explorer 支持拖拽排序
