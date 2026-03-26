# Phase 2：基础重构

> 基于 Phase 1 设计决策，实施类型治理、Context 重构和代码质量治理。

## 状态：已完成

## 前置：Phase 1 设计文档已确认

---

## 2.1 建立 `domains/types` 包，迁移项目级共用类型

### 任务

- 创建 `domains/types` 包（`@canvix-react/types`）
- 从 `dock-editor/src/runtime/types.ts` 剥离共用类型
- 建立类型包依赖关系（按 Phase 1 type-system.md 设计）
- 更新各消费方的 import 路径

### 涉及文件

- 新建 `domains/types/`
- `docks/dock-editor/src/runtime/types.ts`
- 所有引用 `@canvix-react/dock-editor` 仅为获取类型的文件

---

## 2.2 Context 层级重构

### 任务

基于 Phase 1 instance-context.md 重设计：

- Chronicle 边界调整
- DocumentRefContext 去留决策实施
- PageLive / WidgetLive subscribe 机制调整
- EditorRefContext 职责瘦身（如需要）

### 涉及文件

- `domains/toolkit-shared/src/` — Context 定义、Provider
- `domains/toolkit-editor/src/` — EditorRef、EditorLive
- `apps/app-editor/src/App.tsx` — Provider 组装
- 所有 Context 消费方

---

## 2.3 代码质量治理

### 多组件文件拆分

| 文件                                                | 需要拆出的组件                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/app-editor/src/App.tsx`                       | `SettingsButton` → `settings-button.tsx`                                |
| `layouts/layout-editor-canvas/src/page-editor.tsx`  | `FlowDropPlaceholder`、`WidgetEditorWrapper`、`WidgetEditor` → 各自文件 |
| `layouts/layout-editor-inspector/src/inspector.tsx` | 合并 `Inspector` + `InspectorContent`（消除无意义 wrapper）             |

### 入口文件重构

**App.tsx**：

- 不同阶段的逻辑视觉分层（初始化 / Provider 组装 / 渲染）
- Portal 创建逻辑抽离
- Provider 嵌套简化

**canvas.tsx**（241 行）：

- viewport 居中逻辑 → `useViewportCentering()` hook
- stripe overlay → `FlowDragOverlay` 组件
- page container 样式计算梳理

**page-editor.tsx**：

- slot children 计算 → 工具函数
- drop index 计算 → 工具函数
- widget 渲染元素构建逻辑简化

**inspector-page.tsx**（190 行）：

- layout 属性区域（74 行）→ 独立组件
- color 属性区域 → 独立组件

---

## 完成标准

- [x] `domains/types` 包创建完成，类型迁移完毕
- [x] Context 层级按设计文档重构
- [x] 无文件包含多个非简单 DOM 的 React 组件
- [x] 核心入口文件（App.tsx, canvas.tsx, page-editor.tsx）代码结构清晰，不同职责视觉分层
