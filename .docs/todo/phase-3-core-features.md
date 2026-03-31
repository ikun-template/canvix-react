# Phase 3：核心功能

> 文档持久化、保存功能、快捷键系统、插件架构实现、职责下沉。

## 状态：已完成

## 前置：Phase 2 基础重构完成

---

## 已完成

- [x] 3.1 文档单实例存储（IndexedDB 加载/创建/保存）
- [x] 3.2 保存功能（保存按钮 + Ctrl+S + dirty flag）
- [x] 3.3 快捷键系统（ShortcutManager + shortcuts-plugin）
- [x] 3.4 插件架构基础实现（ServicePlugin 生命周期 + PluginManager 拆分）

---

## 遗留问题

### 3.5 ServicePluginContext 缺少 EditorStateStore 访问

**问题**：`ServicePluginContext` 只有 `chronicle`（数据操作），没有 `EditorStateStore`（UI 状态）。导致快捷键插件无法自包含——只能 emit 事件，实际处理（delete-selected、select-all）被迫留在 App.tsx 做 EventBus → Store 桥接。

**现状代码路径**：

```
shortcuts-plugin → emit('editor:delete-selected')
                          ↓ EventBus
App.tsx useEffect → store.getSnapshot() + chronicle.update()
```

**期望代码路径**：

```
shortcuts-plugin → ctx.getSnapshot() + ctx.update() → 逻辑自包含
```

**解法**：`ServicePluginContext` 增加 EditorStateStore 相关能力（至少 `getSnapshot()`、`setSelection()`、`setDirty()` 等），让 ServicePlugin 能直接读写 UI 状态。

### 3.6 App 层职责下沉到 Dock

**问题**：App.tsx 承担了大量应该属于 dock-editor 的职责：

| 代码                                                 | 应该在 dock                             |
| ---------------------------------------------------- | --------------------------------------- |
| `EditorStateStore` 创建                              | Runtime 内部创建和持有                  |
| `EditorRefContextValue` 组装（store + runtime 桥接） | Runtime 提供 ready-to-use context value |
| `save()` 函数（序列化 + 持久化 + hook 触发）         | Runtime 内置 save 能力                  |
| `dirty` 追踪（chronicle.onUpdate → setDirty）        | Runtime 内部自动管理                    |
| EventBus → Store 桥接（delete/save/select-all）      | 3.5 解决后自然消除                      |
| `subscribeDocument` 工厂                             | Runtime 提供                            |
| `EditorContext` 组合                                 | Runtime 提供                            |

**App.tsx 应该只做**：

- 声明插件列表
- 传入文档来源（documentId 或初始文档）
- 传入配置（i18n、theme）
- 渲染 EditorShell

**期望的 App.tsx**：

```tsx
export default function App() {
  const { state, shellRef, runtime } = useEditorBootstrap(
    plugins,
    servicePlugins,
  );

  return (
    <EditorShell
      ref={shellRef}
      state={state}
      runtime={runtime} // dock 提供 ready-to-use context
      config={editorConfig}
      plugins={plugins}
    />
  );
}
```

**解法**：

- `Runtime` 内部创建和持有 `EditorStateStore`
- `Runtime` 暴露 `getEditorContext()` 返回完整的 `EditorRefContextValue` + `DocumentRefContextValue` + `subscribeDocument`
- `save()` 逻辑迁入 Runtime（或作为内置 ServicePlugin）
- `dirty` 追踪迁入 Runtime
- `EditorShell` 直接接收 `runtime`，内部从 runtime 获取所有 context value

### 涉及文件

- `docks/dock-editor/src/runtime/index.ts` — Runtime 持有 store、提供 context
- `domains/types/src/plugin.ts` — ServicePluginContext 扩展 store 能力
- `apps/app-editor/src/App.tsx` — 大幅简化
- `apps/app-editor/src/editor-shell.tsx` — 改为接收 runtime
- `apps/app-editor/src/builtin-plugins/shortcuts-plugin.ts` — 改为直接操作 store

---

## 遗留问题

### 3.7 shortcuts-plugin 从 App 层迁入 dock-editor 内置

**问题**：`apps/app-editor/src/builtin-plugins/shortcuts-plugin.ts` 定义了编辑器基础快捷键（Ctrl+Z/S/A、Delete 等），但放在了 app 层。这些是编辑器引擎的固有能力，不是应用层定制。

**解法**：将 shortcuts-plugin 迁入 `docks/dock-editor/` 作为内置 ServicePlugin，Runtime 启动时自动加载。App 层不再需要声明和传递它。

### 3.8 WidgetRegistry 创建下沉到 dock-editor

**问题**：`apps/app-editor/src/create-registry.ts` 在 app 层创建 WidgetRegistry 并注册 widgets，然后传给 dock。与 plugins/servicePlugins 的模式不一致——那些是 App 声明列表、dock 内部管理。

**解法**：

- `RuntimeOptions` 接受 `widgets: WidgetPluginDefinition[]` 替代 `registry: WidgetRegistry`
- `createWidgetRegistry()` + 注册逻辑迁入 dock-editor Runtime 内部
- App 层只声明 widget 定义列表，位置和命名需合理（如 `apps/app-editor/src/builtin-widgets.ts`）
- 删除 `apps/app-editor/src/create-registry.ts`

```typescript
// App 层只声明列表
new DockEditor({
  document: doc,
  plugins, // LayoutPluginDefinition[]
  servicePlugins, // ServicePluginDefinition[]
  widgets, // WidgetPluginDefinition[]  ← 替代传 registry
});
```

### 3.9 依赖方向违规：domains → dock

**问题**：`toolkit-editor/src/store/editor-state-store.ts` 从 `@canvix-react/dock-editor` 重导出 `EditorStateStore`。domains 包不可依赖 dock——dock 是底座，只能它依赖别的包，不能反过来。

**现状**：Phase 3 将 `EditorStateStore` 迁入了 dock-editor，然后 toolkit-editor 做重导出。方向反了。

**解法**：`EditorStateStore` 应该放在 domains 层（如 `toolkit-editor` 自身或独立包），dock-editor 从 domains 导入。底座组装 domains 提供的能力，而非 domains 去取底座的实现。

### 3.10 基础设施分层修正

**问题**：`@canvix-react/infra` 混合了共用工具和 editor-only 工具。`ShortcutManager` 是 editor-only 能力（viewer 没有快捷键），但和共用的 `EventBus` / `HookSystem` 放在了同一个包。

**解法**：

- `@canvix-react/infra` 仅保留 `EventBus` + `HookSystem`（editor/viewer 共用）
- `ShortcutManager` 移回 `dock-editor` 内部（editor-only 工具）
- 快捷键注册保持 Runtime 内置逻辑，不走 ServicePlugin

### 3.11 dock-viewer 同步架构重构

**问题**：`docks/dock-viewer/` 完全未被 Phase 2/3 覆盖：

- 类型命名中性（`PluginContext` / `PluginDefinition`），与 editor 侧混淆
- 基础设施（EventBus、HookSystem、PluginManager）各自独立实现，未复用 `@canvix-react/infra`
- 自定义类型未纳入统一类型体系

**解法**：

- 类型改用 `@canvix-react/shared-types`（viewer 仅依赖共用类型，**不依赖 editor-types**）
- 基础设施改为从 `@canvix-react/infra` 导入
- 删除 dock-viewer 内部重复的 EventBus / HookSystem / PluginManager 实现
- viewer Runtime 极简化：仅持有 WidgetRegistry + HookSystem（最小 hooks）+ EventBus，无 Chronicle / EditorStateStore / ShortcutManager

### 3.12 类型包拆分：editor-types → shared-types + editor-types

**问题**：当前 `@canvix-react/editor-types` 混合了共用类型和 editor-only 类型。viewer 侧需要 Widget 类型和 LayoutPluginDefinition 但不应依赖 editor 包。

**解法**（详见 [type-system.md](../.docs/architecture/type-system.md)）：

- 新建 `@canvix-react/shared-types`：渲染基础类型（WidgetPluginDefinition, WidgetMeta, WidgetRenderMap, WidgetSlot, WidgetRegistry, LayoutPluginDefinition, HookSystem/EventBus 接口）
- `@canvix-react/editor-types` 改为仅包含 editor-only 类型（ServicePlugin*, DraftSession, EditorState*, Inspector*, Shortcut*, EditorConfig），并重导出 shared-types
- editor 侧消费者 import 不变（editor-types 重导出 shared-types）
- viewer 侧消费者改为 `import from '@canvix-react/shared-types'`

---

## 完成标准

- [x] 应用启动时从 IndexedDB 加载文档
- [x] 保存按钮可用，Ctrl+S 触发保存
- [x] 快捷键系统框架就绪，内置快捷键可用
- [x] 插件分类和通信机制按设计文档实现
- [x] ServicePluginContext 可访问 EditorStateStore（getSnapshot + setters）
- [x] App.tsx 中的 dock 职责下沉到 Runtime
- [x] App.tsx 仅负责配置 + 文档传入 + 渲染
- [x] shortcuts-plugin 迁入 dock-editor 内置
- [x] WidgetRegistry 创建下沉到 dock-editor，App 只传 widget 定义列表
- [x] 依赖方向修复：EditorStateStore 归还 domains 层
- [x] 快捷键改为 Runtime 内置逻辑，移除 ServicePlugin 包装
- [x] EventBus / HookSystem 抽到 packages/infra
- [x] ShortcutManager 从 infra 移回 dock-editor 内部
- [x] 类型包拆分：新建 shared-types，editor-types 仅保留 editor-only 类型
- [x] dock-viewer 重构：依赖 shared-types + infra，删除内部重复实现
