# Plan 1: 编辑器全局交互状态

## 问题

当前全局交互状态分散且不完整：

- **选中状态**：在 `EditorState` 中，各插件通过 `ctx.editorState` + `useSyncExternalStore` 直接访问，样板代码重复
- **当前工具**：`activeTool` 仅存在于 Toolbox 组件内部 `useState`，canvas 无法感知当前是 select/hand/pen
- **交互模式**：无。canvas 正在拖拽时，inspector/sidebar 无法得知（如拖拽时 inspector 可能需要禁用输入）

## 方案

扩展 `EditorState`，将交互相关的全局状态统一管理。

### 1. 扩展 EditorState

**文件**: `docks/dock-editor/src/runtime/editor-state.ts`

新增字段：

```typescript
interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  zoom: number;
  scroll: { x: number; y: number };
  // ── 新增 ──
  activeTool: ToolType; // 'select' | 'hand'
  interacting: boolean; // true = 正在拖拽/resize 中
}

type ToolType = 'select' | 'hand';
```

新增方法：

- `setActiveTool(tool: ToolType)`
- `setInteracting(value: boolean)`

### 2. 新增 React 便捷 hook

**文件**: `domains/toolkit-editor/src/hooks/use-editor-state.ts`

```typescript
function useEditorState(editorState: EditorState): EditorStateSnapshot;
```

封装 `useSyncExternalStore(editorState.onChange, editorState.getSnapshot)`，消除各插件中的样板代码。

**导出**: 从 `domains/toolkit-editor/src/index.ts` 导出。

### 3. 迁移现有消费方

将以下文件中的 `useSyncExternalStore(ctx.editorState.onChange, ctx.editorState.getSnapshot)` 替换为 `useEditorState(ctx.editorState)`：

| 文件                                                    | 当前用法                                               |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `layouts/layout-editor-canvas/src/canvas.tsx`           | 读取 activePageId, selectedWidgetIds                   |
| `layouts/layout-editor-inspector/src/inspector.tsx`     | 读取 selectedWidgetIds, activePageId                   |
| `layouts/layout-editor-sidebar/src/widget-explorer.tsx` | 读取 selectedWidgetIds, activePageId                   |
| `layouts/layout-editor-toolbox/src/toolbox.tsx`         | 读取 activePageId + 本地 activeTool 迁移到 editorState |

### 4. Toolbox activeTool 迁移

Toolbox 中 `useState('select')` → `ctx.editorState.setActiveTool()`，读取改用 `useEditorState`。

## 文件清单

| 文件                                                    | 操作                                |
| ------------------------------------------------------- | ----------------------------------- |
| `docks/dock-editor/src/runtime/editor-state.ts`         | 修改：新增 activeTool, interacting  |
| `domains/toolkit-editor/src/hooks/use-editor-state.ts`  | 新增                                |
| `domains/toolkit-editor/src/index.ts`                   | 修改：导出新 hook                   |
| `layouts/layout-editor-canvas/src/canvas.tsx`           | 修改：用 useEditorState 替换        |
| `layouts/layout-editor-inspector/src/inspector.tsx`     | 修改：用 useEditorState 替换        |
| `layouts/layout-editor-sidebar/src/widget-explorer.tsx` | 修改：用 useEditorState 替换        |
| `layouts/layout-editor-toolbox/src/toolbox.tsx`         | 修改：activeTool 迁移到 editorState |

## 步骤

1. 扩展 `EditorState`（activeTool + interacting + 对应 setter）
2. 新增 `useEditorState` hook 并导出
3. 迁移 4 个消费方（canvas / inspector / sidebar / toolbox）
4. Toolbox 中 activeTool 从本地 state 改为 editorState
