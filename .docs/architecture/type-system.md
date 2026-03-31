# 架构设计：类型系统

## 问题

1. `packages/types`（`@canvix-react/types`）仅包含一个 `DeepPartial` 工具类型
2. 插件接口类型散落在实现包中，布局插件为获取类型而依赖宿主包
3. 多个类型命名过于中性，脱离上下文后辨识度低
4. editor/viewer 两个底座的类型未做分层——共用类型（渲染基础）和 editor-only 类型（编辑能力）混在一个包中，导致 viewer 侧不得不依赖 editor 包
5. 无项目级共用类型包

---

## 命名规范

类型命名应当从名称本身传达其所属领域，避免需要查看定义才能理解用途。

| 旧名               | 新名                     | 理由                                                     |
| ------------------ | ------------------------ | -------------------------------------------------------- |
| `TempSession`      | `DraftSession`           | "临时会话"太泛，"草稿会话"明确表达预览编辑语义           |
| `ToolType`         | `EditorToolType`         | 编辑器级工具，多插件可消费（toolbox 提供、canvas 响应）  |
| `PluginMeta`       | 移除                     | 用 `Pick<LayoutPluginDefinition, 'name' \| 'slot'>` 替代 |
| `PropertyGroup`    | `InspectorGroup`         | Inspector 渲染协议，page 和 widget inspector 共用        |
| `PropertyItem`     | `InspectorField`         | 同上                                                     |
| `SlotDeclaration`  | `WidgetSlot`             | 简洁直接，slot 已隐含"声明"语义                          |
| `WidgetInspector`  | `WidgetInspectorConfig`  | 配置描述，非组件实例                                     |
| `WidgetDefinition` | `WidgetPluginDefinition` | 统一 `XxxPluginDefinition` 命名模式                      |

---

## 三层类型体系

```
┌─────────────────────────────────────────────────┐
│  packages/types (@canvix-react/types)            │  ← 框架无关工具类型
│  零依赖                                          │
│  DeepPartial, Prettify, MaybePromise, ...       │
└─────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────┐
│  domains/shared-types (@canvix-react/shared-types)│  ← editor/viewer 共用业务类型
│  type-only 依赖: schemas                         │
│  渲染基础: Widget 类型, LayoutPlugin, 基础设施接口 │
└─────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────┐
│  domains/editor-types (@canvix-react/editor-types)│  ← editor-only 业务类型
│  type-only 依赖: shared-types, chronicle         │
│  编辑能力: ServicePlugin, DraftSession,           │
│  EditorState, Inspector, Shortcut, EditorConfig  │
└─────────────────────────────────────────────────┘
```

### `@canvix-react/types` — 工具类型

通用 TypeScript 工具类型，零领域知识，零依赖。所有 schema 包已依赖此包。

```typescript
export type DeepPartial<T> = ...;
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type MaybePromise<T> = T | Promise<T>;
```

### `@canvix-react/shared-types` — 共用业务类型

editor 和 viewer 都需要的渲染基础类型。不依赖 Chronicle。

```
domains/shared-types/
├── package.json         # @canvix-react/shared-types
└── src/
    ├── plugin.ts        # LayoutPluginDefinition
    ├── widget.ts        # WidgetPluginDefinition, WidgetMeta, WidgetRenderMap, WidgetSlot, WidgetRegistry
    ├── infra.ts         # HookSystem, EventBus 接口
    └── index.ts
```

### `@canvix-react/editor-types` — Editor-only 业务类型

编辑器专属类型，依赖 shared-types + Chronicle。Viewer 不可依赖此包。

```
domains/editor-types/
├── package.json         # @canvix-react/editor-types
└── src/
    ├── plugin.ts        # ServicePluginDefinition, ServicePluginContext, ServicePluginInstance
    ├── session.ts       # DraftSession
    ├── inspector.ts     # InspectorGroup, InspectorField, WidgetInspectorConfig
    ├── editor-state.ts  # EditorStateSnapshot, EditorToolType, EditorStore
    ├── shortcut.ts      # ShortcutBinding, ShortcutRegistry
    ├── config.ts        # EditorConfig
    └── index.ts         # 统一导出（含 shared-types 重导出，editor 侧只需导入此包）
```

> `editor-types/index.ts` 重导出 `shared-types` 的全部类型，使 editor 侧消费者只需 `import from '@canvix-react/editor-types'` 一个入口。

---

## 类型归属清单

### 共用类型 → `@canvix-react/shared-types`

| 类型                     | 说明                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `LayoutPluginDefinition` | 布局插件接口（editor/viewer 共用，`{ name, slot, component }`） |
| `WidgetPluginDefinition` | Widget 插件接口                                                 |
| `WidgetMeta`             | Widget 元信息                                                   |
| `WidgetRenderMap`        | Widget 渲染组件映射（含 editor + viewer 渲染器）                |
| `WidgetRenderProps`      | Widget 渲染 props                                               |
| `WidgetSlot`             | Widget 插槽声明                                                 |
| `WidgetRegistry`         | Widget 注册表接口                                               |
| `HookSystem`             | 钩子系统接口                                                    |
| `EventBus` / `EventMap`  | 事件总线接口                                                    |

### Editor-only 类型 → `@canvix-react/editor-types`

| 类型                                   | 说明                  |
| -------------------------------------- | --------------------- |
| `ServicePluginDefinition`              | 服务插件接口          |
| `ServicePluginContext`                 | 服务插件能力上下文    |
| `ServicePluginInstance`                | 服务插件生命周期      |
| `DraftSession`                         | 草稿编辑会话          |
| `EditorStateSnapshot`                  | 编辑器 UI 状态快照    |
| `EditorToolType`                       | 编辑器工具类型        |
| `EditorStore`                          | 编辑器状态 store 接口 |
| `EditorConfig`                         | 编辑器配置            |
| `InspectorGroup`                       | Inspector 属性组      |
| `InspectorField`                       | Inspector 属性字段    |
| `WidgetInspectorConfig`                | Widget Inspector 配置 |
| `Chain` / `UpdateField`                | 属性编辑路径/更新函数 |
| `ShortcutBinding` / `ShortcutRegistry` | 快捷键接口            |

### 不迁移（保留原位）

| 类型                      | 位置                            | 原因                              |
| ------------------------- | ------------------------------- | --------------------------------- |
| `OperationModel` 等       | `@canvix-react/chronicle`       | Chronicle 的 API 契约，从原包导入 |
| `DocumentRuntime`         | `@canvix-react/schema-document` | Schema 层类型                     |
| `PageRuntime`             | `@canvix-react/schema-page`     | 同上                              |
| `WidgetRuntime`           | `@canvix-react/schema-widget`   | 同上                              |
| `EditorRefContextValue`   | `@canvix-react/toolkit-editor`  | 含 React 类型依赖                 |
| `DocumentRefContextValue` | `@canvix-react/toolkit-shared`  | 同上                              |

---

## 依赖方向

```
@canvix-react/types                (零依赖)
         ↑
schemas/widget → page → document   (依赖 types)
         ↑
@canvix-react/shared-types         (type-only 依赖: schemas)
         ↑                          渲染基础: Widget, LayoutPlugin, HookSystem, EventBus
   ┌─────┼──────────────────┐
   │     │                  │
   │  @canvix-react/        │
   │  editor-types          │
   │  (依赖: shared-types   │
   │   + chronicle)         │
   │     ↑                  │
   │     │                  │
   ├─────┼──────┐           │
   │     │      │           │
dock-editor  toolkit-editor │
(编辑底座)   (editor hooks)  │
   │     │                  │
   │     │      dock-viewer │
   │     │      (渲染底座)   │
   │     │         ↑        │
   │     │         │ 仅依赖 shared-types
   │     │         │        │
   └─────┼─────────┼────────┘
         │         │
  layouts/*    viewer-layouts/*
  widgets/*    (共用 widget 定义)
```

**关键规则**：

- viewer 侧（dock-viewer + viewer layouts）**仅依赖** `shared-types`，不可依赖 `editor-types`
- editor 侧通过 `editor-types` 的重导出获取 `shared-types` 的全部类型，**只需一个导入入口**
- widgets 定义依赖 `shared-types`（WidgetPluginDefinition），editor-only 的 inspector 配置通过 `editor-types` 的 `WidgetInspectorConfig` 引用

---

## 基础设施包分层

```
@canvix-react/infra               ← 共用基础设施（editor + viewer）
  EventBus 实现
  HookSystem 实现

dock-editor 内部                   ← editor-only 工具
  ShortcutManager（不放 infra，viewer 不需要）
```

---

## `@canvix-react/shared-types` 详细定义

```typescript
// ── plugin.ts ──

import type { ComponentType } from 'react';

export interface LayoutPluginDefinition {
  name: string;
  slot: string;
  component: ComponentType;
}

// ── widget.ts ──

import type { WidgetRaw } from '@canvix-react/schema-widget';

export interface WidgetPluginDefinition<T = unknown> {
  type: string;
  meta: WidgetMeta;
  defaultCustomData: T;
  defaultSchema?: WidgetRaw<T>;
  render: WidgetRenderMap;
  slots?: WidgetSlot[];
}

export interface WidgetMeta {
  name: string;
  category: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  description?: string;
}

export interface WidgetRenderProps<T = unknown> {
  widget: WidgetRuntime<T>;
}

export interface WidgetRenderMap {
  editor: ComponentType<WidgetRenderProps<any>>;
  viewer: ComponentType<WidgetRenderProps<any>>;
}

export interface WidgetSlot {
  name: string;
  label: string;
  /** 动态校验是否接受插入。未提供则接受所有。 */
  accept?: (ctx: SlotAcceptContext) => boolean;
}

export interface SlotAcceptContext {
  /** 插槽所属的 widget 实例 */
  owner: WidgetRuntime;
  /** 即将插入的 widget 实例列表（可能为多个） */
  incoming: WidgetRuntime[];
}

export interface WidgetRegistry {
  register(definition: WidgetPluginDefinition): void;
  registerAll(definitions: WidgetPluginDefinition[]): void;
  get(type: string): WidgetPluginDefinition | undefined;
  getAll(): WidgetPluginDefinition[];
  getByCategory(category: string): WidgetPluginDefinition[];
  has(type: string): boolean;
}

// ── infra.ts ──

export interface HookSystem {
  register(name: string, type: 'sync' | 'waterfall'): void;
  on<T>(name: string, handler: (data: T) => T | void): () => void;
  call<T>(name: string, data: T): T;
  clear(): void;
}

export interface EventBus {
  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void,
  ): () => void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
  clear(): void;
}

export interface EventMap {}
```

## `@canvix-react/editor-types` 详细定义

```typescript
// 重导出 shared-types 全部（editor 侧单入口）
export * from '@canvix-react/shared-types';

// ── plugin.ts ──

import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type {
  EventBus,
  HookSystem,
  WidgetRegistry,
} from '@canvix-react/shared-types';

export interface ServicePluginDefinition {
  name: string;
  setup(
    ctx: ServicePluginContext,
  ): ServicePluginInstance | Promise<ServicePluginInstance>;
}

export interface ServicePluginContext {
  hooks: HookSystem;
  events: EventBus;
  chronicle: Chronicle;
  registry: WidgetRegistry;
  store: EditorStore;
  shortcuts: ShortcutRegistry;
  update(model: OperationModel, options?: UpdateOptions): void;
  beginDraft(): DraftSession;
}

export interface ServicePluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

// ── session.ts ──

export interface DraftSession {
  update(model: OperationModel): void;
  commit(): void;
  rollback(): void;
}

// ── inspector.ts ──

import type { WidgetRuntime } from '@canvix-react/schema-widget';

export type Chain = (string | number)[];
export type UpdateField = (chain: Chain, value: unknown) => void;

export interface InspectorField {
  chain: Chain;
  renderer: string | ComponentType<InspectorFieldRenderProps>;
  label: string;
  span?: 1 | 2 | 3 | 4;
  options?: Record<string, unknown>;
  interceptor?: InspectorFieldInterceptor;
}

export interface InspectorFieldRenderProps {
  value: unknown;
  onChange(value: unknown): void;
  widget: WidgetRuntime;
  options?: Record<string, unknown>;
}

export interface InspectorFieldInterceptor {
  (
    value: unknown,
    context: { widget: WidgetRuntime; update: (model: OperationModel) => void },
  ): Operation[] | void;
}

export interface InspectorGroup {
  title: string;
  properties: InspectorField[];
}

export interface WidgetInspectorConfig {
  properties?: (widget: WidgetRuntime) => InspectorGroup[];
  // 未来扩展：events, styles, animations 等面板
}

// ── editor-state.ts ──

export type EditorToolType = 'select' | 'hand';

export interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  zoom: number;
  camera: { x: number; y: number };
  activeTool: EditorToolType;
  interacting: boolean;
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
  dirty: boolean;
}

export interface EditorStore {
  /* setters + getSnapshot + onChange */
}

// ── shortcut.ts ──

export interface ShortcutBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler(): void;
}

export interface ShortcutRegistry {
  register(binding: ShortcutBinding): () => void;
}

// ── config.ts ──

export interface EditorConfig {
  i18n: I18nManager;
  theme: ThemeManager;
}
```

---

## 导入路径

```typescript
// editor 侧（只需一个入口）
import type {
  LayoutPluginDefinition,
  ServicePluginDefinition,
  EditorStateSnapshot,
} from '@canvix-react/editor-types';

// viewer 侧（仅共用类型）
import type {
  LayoutPluginDefinition,
  WidgetPluginDefinition,
} from '@canvix-react/shared-types';

// widget 定义（共用）
import type {
  WidgetPluginDefinition,
  WidgetSlot,
} from '@canvix-react/shared-types';
```

---

## 迁移步骤

1. 新建 `domains/shared-types`（`@canvix-react/shared-types`）：LayoutPlugin, Widget\*, HookSystem, EventBus 接口
2. 现有 `domains/types`（`@canvix-react/editor-types`）改为依赖 shared-types，移除共用类型，保留 editor-only 类型，index.ts 重导出 shared-types
3. `@canvix-react/infra` 移除 ShortcutManager（移回 dock-editor 内部）
4. dock-viewer 改为依赖 `@canvix-react/shared-types`，删除内部重复的 EventBus / HookSystem / types
5. widget-registry 改为依赖 `@canvix-react/shared-types`
6. 所有 editor 侧消费者保持 `import from '@canvix-react/editor-types'`（因为重导出，无需改 import）
7. 所有 viewer 侧消费者改为 `import from '@canvix-react/shared-types'`
