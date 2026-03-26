# 架构设计：类型系统

## 问题

1. `packages/types`（`@canvix-react/types`）仅包含一个 `DeepPartial` 工具类型
2. 插件接口类型（`LayoutPluginContext`、`LayoutPluginDefinition`、`TempSession`）定义在 `dock-editor/src/runtime/types.ts`，布局插件为获取这些类型而依赖 `@canvix-react/dock-editor`——概念上循环（插件依赖宿主）
3. 编辑器状态类型（`EditorStateSnapshot`、`EditorToolType`）定义在 `toolkit-editor/src/store/`，无法被不依赖 toolkit-editor 的包使用
4. 多个类型命名过于中性，脱离上下文后辨识度低
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

## 两层类型体系

```
┌─────────────────────────────────────────────────┐
│  packages/types (@canvix-react/types)            │  ← 框架无关工具类型
│  零依赖                                          │
│  DeepPartial, Prettify, MaybePromise, ...       │
└─────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────┐
│  domains/types (@canvix-react/editor-types)      │  ← 项目级共用业务类型
│  type-only 依赖: chronicle, schemas              │
│  插件接口, widget 类型, 编辑器状态, 配置类型      │
└─────────────────────────────────────────────────┘
```

### `@canvix-react/types` — 工具类型

通用 TypeScript 工具类型，零领域知识，零依赖。所有 schema 包已依赖此包。

```typescript
// 现有
export type DeepPartial<T> = ...;

// 可按需扩展
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type MaybePromise<T> = T | Promise<T>;
```

### `@canvix-react/editor-types` — 业务类型

项目级共用业务类型。仅使用 `import type`（type-only 依赖），不引入运行时代码。

```
domains/types/
├── package.json         # @canvix-react/editor-types
└── src/
    ├── plugin.ts        # LayoutPlugin / ServicePlugin 接口
    ├── widget.ts        # WidgetPlugin 接口 + Inspector 类型
    ├── editor-state.ts  # 编辑器状态类型
    ├── config.ts        # 编辑器配置类型
    └── index.ts         # 统一导出
```

---

## 类型迁移清单

### 迁入 `@canvix-react/editor-types`

| 新名                      | 旧名                      | 原位置                                       | 说明                             |
| ------------------------- | ------------------------- | -------------------------------------------- | -------------------------------- |
| `LayoutPluginDefinition`  | 同名                      | `dock-editor/runtime/types.ts`               | 简化后的声明式插件接口           |
| `ServicePluginDefinition` | 新增                      | —                                            | 命令式服务插件接口               |
| `ServicePluginContext`    | 原 `LayoutPluginContext`  | `dock-editor/runtime/types.ts`               | 重命名 + 调整                    |
| `ServicePluginInstance`   | 原 `LayoutPluginInstance` | `dock-editor/runtime/types.ts`               | 服务插件生命周期                 |
| `DraftSession`            | 原 `TempSession`          | `dock-editor/runtime/temp-session.ts`        | 接口定义（实现留在 dock-editor） |
| `EditorStateSnapshot`     | 同名                      | `toolkit-editor/store/editor-state-store.ts` | 编辑器 UI 状态快照               |
| `EditorToolType`          | 原 `ToolType`             | `toolkit-editor/store/editor-state-store.ts` | 编辑器工具类型                   |
| `EditorConfig`            | 同名                      | `toolkit-editor/context/editor-ref.ts`       | 编辑器配置                       |
| `WidgetPluginDefinition`  | 原 `WidgetDefinition`     | `widget-registry/types.ts`                   | Widget 插件接口                  |
| `WidgetMeta`              | 同名                      | `widget-registry/types.ts`                   | Widget 元信息                    |
| `WidgetRenderMap`         | 同名                      | `widget-registry/types.ts`                   | Widget 渲染组件映射              |
| `WidgetRenderProps`       | 同名                      | `widget-registry/types.ts`                   | Widget 渲染 props                |
| `WidgetInspectorConfig`   | 原 `WidgetInspector`      | `widget-registry/types.ts`                   | Widget 属性面板配置              |
| `InspectorGroup`          | 原 `PropertyGroup`        | `widget-registry/types.ts`                   | Inspector 渲染协议——属性组       |
| `InspectorField`          | 原 `PropertyItem`         | `widget-registry/types.ts`                   | Inspector 渲染协议——属性字段     |
| `WidgetSlot`              | 原 `SlotDeclaration`      | `widget-registry/types.ts`                   | Widget 插槽声明                  |
| `WidgetRegistry`          | 同名                      | `widget-registry/registry.ts`                | 注册表接口                       |

### 不迁移（保留原位）

| 类型                      | 位置                            | 原因                                    |
| ------------------------- | ------------------------------- | --------------------------------------- |
| `OperationModel` 等       | `@canvix-react/chronicle`       | Chronicle 的 API 契约，从原包导入更清晰 |
| `DocumentRuntime`         | `@canvix-react/schema-document` | Schema 层类型，已有明确的导入路径       |
| `PageRuntime`             | `@canvix-react/schema-page`     | 同上                                    |
| `WidgetRuntime`           | `@canvix-react/schema-widget`   | 同上                                    |
| `EditorRefContextValue`   | `@canvix-react/toolkit-editor`  | 含 React 类型依赖，属于 React 集成层    |
| `DocumentRefContextValue` | `@canvix-react/toolkit-shared`  | 同上                                    |
| `PageLiveContextValue`    | `@canvix-react/toolkit-shared`  | 同上                                    |
| `WidgetLiveContextValue`  | `@canvix-react/toolkit-shared`  | 同上                                    |

---

## 依赖方向

```
@canvix-react/types               (零依赖)
         ↑
schemas/widget → page → document  (依赖 types)
         ↑
@canvix-react/chronicle           (依赖 schemas)
         ↑
@canvix-react/editor-types        (type-only 依赖: chronicle, schemas)
         ↑                         包含: 插件接口 + widget 类型 + 编辑器状态
   ┌─────┼──────────────┐
   │     │              │
dock-editor  toolkit-editor  widget-registry
(实现接口)   (消费类型)       (实现注册表，消费 widget 类型)
   │         │              │
   └─────────┼──────────────┘
             │
      layouts/*  (消费 editor-types，不再依赖 dock-editor 获取类型)
             │
      widgets/*  (消费 editor-types 的 widget 类型)
```

**关键变化**：

- 布局插件从 `@canvix-react/editor-types` 导入插件类型，而非从 `@canvix-react/dock-editor`
- Widget 类型从 `widget-registry` 上提到 `editor-types`，`widget-registry` 仅保留注册表实现
- 消除了"插件依赖宿主"和"widget 依赖注册表包获取类型"的概念循环

---

## `@canvix-react/editor-types` 详细定义

```typescript
// ── plugin.ts ── 插件接口

import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type { ComponentType } from 'react';

export interface LayoutPluginDefinition {
  name: string;
  slot: string;
  component: ComponentType;
}

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
  update(model: OperationModel, options?: UpdateOptions): void;
  beginTemp(): DraftSession;
}

export interface ServicePluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

export interface DraftSession {
  update(model: OperationModel): void;
  commit(): void;
  rollback(): void;
}

// HookSystem 和 EventBus 接口也在此定义（实现在 dock-editor）

// ── widget.ts ── Widget 插件类型

import type { WidgetRaw, WidgetRuntime } from '@canvix-react/schema-widget';

export interface WidgetPluginDefinition<T = unknown> {
  type: string;
  meta: WidgetMeta;
  defaultCustomData: T;
  defaultSchema?: WidgetRaw<T>;
  render: WidgetRenderMap;
  inspector?: WidgetInspectorConfig;
  slots?: WidgetSlot[];
}

export interface WidgetMeta {
  name: string;
  category: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  description?: string;
}

export interface WidgetRenderProps<T = unknown> {
  data: T;
}

export interface WidgetRenderMap {
  editor: ComponentType<WidgetRenderProps<any>>;
  viewer: ComponentType<WidgetRenderProps<any>>;
}

export type Chain = (string | number)[];
export type UpdateField = (chain: Chain, value: unknown) => void;

export interface InspectorField {
  chain: Chain;
  renderer: string;
  label: string;
  span?: 1 | 2 | 3 | 4;
  options?: Record<string, unknown>;
}

export interface InspectorGroup {
  title: string;
  properties: InspectorField[];
}

export interface WidgetInspectorConfig {
  render: (data: WidgetRuntime) => InspectorGroup[];
}

export interface WidgetSlot {
  name: string;
  label: string;
  accept?: string[];
  maxCount?: number;
}

export interface WidgetRegistry {
  register(definition: WidgetPluginDefinition): void;
  registerAll(definitions: WidgetPluginDefinition[]): void;
  get(type: string): WidgetPluginDefinition | undefined;
  getAll(): WidgetPluginDefinition[];
  getByCategory(category: string): WidgetPluginDefinition[];
  has(type: string): boolean;
}

// ── editor-state.ts ── 编辑器状态

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
}

// ── config.ts ── 编辑器配置

export interface EditorConfig {
  i18n: I18nManager;
  theme: ThemeManager;
}
```

---

## 导入路径变更

### Before

```typescript
// 布局插件
import type {
  LayoutPluginDefinition,
  LayoutPluginContext,
} from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';

// Widget 实现
import type {
  WidgetDefinition,
  SlotDeclaration,
} from '@canvix-react/widget-registry';
```

### After

```typescript
// 布局插件
import type { LayoutPluginDefinition } from '@canvix-react/editor-types';
import type { OperationModel } from '@canvix-react/chronicle';

// Widget 实现
import type {
  WidgetPluginDefinition,
  WidgetSlot,
} from '@canvix-react/editor-types';
```

### dock-editor 重导出

`dock-editor` 的 `index.ts` 从 `@canvix-react/editor-types` 重导出类型（过渡期向后兼容）：

```typescript
// dock-editor/src/index.ts
export { Runtime as DockEditor } from './runtime/index.js';
export type {
  LayoutPluginDefinition,
  ServicePluginDefinition,
  ServicePluginContext,
  ServicePluginInstance,
  DraftSession,
} from '@canvix-react/editor-types';
```

---

## Phase 2 迁移步骤

1. 创建 `domains/types` 包骨架（package.json, tsconfig, src/index.ts）
2. 定义 HookSystem / EventBus 接口（从 dock-editor 的实现中抽取接口）
3. 编写 plugin.ts（LayoutPlugin, ServicePlugin, DraftSession）
4. 编写 widget.ts（从 widget-registry/types.ts 迁移 + 重命名）
5. 编写 editor-state.ts（EditorToolType, EditorStateSnapshot）, config.ts（EditorConfig）
6. dock-editor 的实现类改为 `implements` 对应接口
7. widget-registry 改为从 editor-types 导入类型，仅保留 `createWidgetRegistry()` 实现
8. 更新 dock-editor/src/index.ts 改为从 editor-types 重导出
9. 更新所有布局插件的 import 路径
10. 更新 toolkit-editor 中 EditorStateSnapshot / EditorToolType 改为从 editor-types 导入
11. 更新所有 widget 实现的 import 路径
12. 全局替换旧名→新名（TempSession→DraftSession, ToolType→EditorToolType, PropertyGroup→InspectorGroup 等）
