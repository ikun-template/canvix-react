# 开发手册：Widget Plugin

## 定义

```typescript
import type { WidgetPluginDefinition } from '@canvix-react/shared-types';
import { MyWidgetEditor } from './editor.js';
import { MyWidgetViewer } from './viewer.js';

interface MyWidgetData {
  content: string;
  color: string;
}

export const myWidgetDefinition: WidgetPluginDefinition<MyWidgetData> = {
  type: 'my-widget',
  meta: {
    name: 'widgets.myWidget', // i18n key
    category: 'basic', // 分组（用于 toolbox 展示）
    icon: MyIcon, // 图标组件
    description: '描述文字', // 可选
  },
  defaultCustomData: {
    content: '默认内容',
    color: '#333333',
  },
  defaultSchema: {
    // 可选，覆盖默认的 widget schema
    layout: { size: [200, 100] },
  },
  render: {
    editor: MyWidgetEditor, // 编辑器画布中的渲染
    viewer: MyWidgetViewer, // 查看器中的渲染
  },
  inspector: {
    // 可选，Inspector 面板配置
    properties: widget => [
      // 属性面板
      createBasePropertyGroup(),
      {
        title: '自定义属性',
        properties: [
          {
            chain: ['custom_data', 'content'],
            renderer: 'text',
            label: '内容',
          },
          { chain: ['custom_data', 'color'], renderer: 'color', label: '颜色' },
        ],
      },
    ],
    // 未来扩展：events, styles, animations 等面板
  },
  slots: [
    // 可选，声明可接受子 widget 的插槽
    {
      name: 'content',
      label: '内容区',
      accept: ['text', 'image'],
      maxCount: 5,
    },
  ],
};
```

---

## 渲染组件

### Props

渲染组件接收完整的 widget 实例数据：

```typescript
import type { WidgetRuntime } from '@canvix-react/schema-widget';

interface WidgetRenderProps<T = unknown> {
  /** 完整的 widget 运行时数据 */
  widget: WidgetRuntime<T>;
}
```

通过 `widget` 可访问所有属性：

| 字段                    | 类型                       | 说明                  |
| ----------------------- | -------------------------- | --------------------- |
| `widget.custom_data`    | `T`                        | 自定义业务数据        |
| `widget.id`             | `string`                   | widget ID             |
| `widget.type`           | `string`                   | widget 类型           |
| `widget.name`           | `string`                   | 显示名称              |
| `widget.mode`           | `'absolute' \| 'flow'`     | 布局模式              |
| `widget.position.axis`  | `[x, y]`                   | 位置（absolute 模式） |
| `widget.layout.size`    | `[w, h]`                   | 尺寸                  |
| `widget.layout.padding` | `number[]`                 | 内边距                |
| `widget.rotation`       | `number`                   | 旋转角度              |
| `widget.opacity`        | `number`                   | 透明度                |
| `widget.hide`           | `boolean`                  | 是否隐藏              |
| `widget.slots`          | `Record<string, string[]>` | 插槽中的子 widget ID  |

> 位置、尺寸、旋转、透明度等由画布容器统一处理样式。渲染组件内部通常只需要读取 `custom_data`，但完整的 widget 数据始终可用。

---

## Editor 端渲染

Editor 端的渲染组件运行在编辑器画布内，拥有**读写能力**。

```typescript
// editor.tsx
import type { WidgetRenderProps } from '@canvix-react/shared-types';
import { useWidgetEditor } from '@canvix-react/toolkit-editor';

export function MyWidgetEditor({ widget }: WidgetRenderProps<MyWidgetData>) {
  const { update } = useWidgetEditor();

  return (
    <div
      style={{ color: widget.custom_data.color }}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        // 修改自身数据
        update([{
          kind: 'update',
          chain: ['custom_data', 'content'],
          value: e.currentTarget.textContent ?? '',
        }]);
      }}
    >
      {widget.custom_data.content}
    </div>
  );
}
```

### Editor 端可用能力

通过 `@canvix-react/toolkit-editor` 的 hooks：

```typescript
import { useWidgetEditor } from '@canvix-react/toolkit-editor';

const { getWidget, update } = useWidgetEditor();
```

| 能力          | 说明                                         |
| ------------- | -------------------------------------------- |
| `getWidget()` | 获取当前 widget 最新数据                     |
| `update(ops)` | 修改自身数据（自动定位到当前 widget + page） |

通过 `@canvix-react/toolkit-shared` 的 hooks：

```typescript
import { useWidgetLive, usePageLive } from '@canvix-react/toolkit-shared';

const { widgetId, pageId, parentId, slotName } = useWidgetLive();
const { layout, widgetIds } = usePageLive();
```

| Hook                | 说明                                                            |
| ------------------- | --------------------------------------------------------------- |
| `useWidgetLive()`   | 当前 widget 身份信息（id, pageId, parentId, slotName, version） |
| `usePageLive()`     | 所属 page 信息（layout, widgetIds, version）                    |
| `useWidgetReader()` | 获取 `getWidget()` 只读方法                                     |

---

## Viewer 端渲染

Viewer 端的渲染组件运行在查看器中，**只读，无编辑能力**。

```typescript
// viewer.tsx
import type { WidgetRenderProps } from '@canvix-react/shared-types';

export function MyWidgetViewer({ widget }: WidgetRenderProps<MyWidgetData>) {
  return (
    <div style={{ color: widget.custom_data.color }}>
      {widget.custom_data.content}
    </div>
  );
}
```

### Viewer 端可用能力

仅 `@canvix-react/toolkit-shared` 的 hooks（**不可** import `toolkit-editor`）：

| Hook                | 说明                   |
| ------------------- | ---------------------- |
| `useWidgetLive()`   | 当前 widget 身份信息   |
| `usePageLive()`     | 所属 page 信息         |
| `useWidgetReader()` | `getWidget()` 只读方法 |

> Viewer 端无 `useWidgetEditor()`、无 `useEditorRef()`、无 Chronicle。

### 共用渲染组件

如果 editor 和 viewer 的渲染完全相同（纯展示，无 inline editing），可以共用：

```typescript
// render.tsx
export function MyWidgetRender({ widget }: WidgetRenderProps<MyWidgetData>) {
  return <div style={{ color: widget.custom_data.color }}>{widget.custom_data.content}</div>;
}

// editor.ts
export { MyWidgetRender as MyWidgetEditor } from './render.js';

// viewer.ts
export { MyWidgetRender as MyWidgetViewer } from './render.js';
```

---

## Inspector 配置

Inspector 支持多种面板类型，当前实现了 `properties` 面板，其他面板预留扩展。

```typescript
interface WidgetInspectorConfig {
  /** 属性面板 — 当前已支持 */
  properties?: (widget: WidgetRuntime) => InspectorGroup[];
  // 未来扩展（暂不实现）：
  // events?: (widget: WidgetRuntime) => EventGroup[];
  // styles?: (widget: WidgetRuntime) => StyleGroup[];
  // animations?: (widget: WidgetRuntime) => AnimationGroup[];
}
```

### 属性面板

```typescript
inspector: {
  properties: (widget) => [
    createBasePropertyGroup(),
    {
      title: '自定义属性',
      properties: [
        { chain: ['custom_data', 'fontSize'], renderer: 'number', label: '字号', options: { min: 12, max: 72 } },
        { chain: ['custom_data', 'color'], renderer: 'color', label: '颜色' },
        { chain: ['custom_data', 'align'], renderer: 'select', label: '对齐', options: {
          options: [
            { label: '左对齐', value: 'left' },
            { label: '居中', value: 'center' },
            { label: '右对齐', value: 'right' },
          ],
        }},
      ],
    },
  ],
},
```

### 属性字段

每个 `InspectorField` 描述一个可编辑属性：

```typescript
{
  chain: ['custom_data', 'fontSize'],  // 属性路径（相对于 widget 根）
  renderer: 'number',                  // 渲染器类型（内置或自定义）
  label: '字号',                        // 显示标签
  span: 2,                             // 列跨度（1-4，默认 4 即整行）
  options: { min: 12, max: 72 },       // 渲染器选项
}
```

### 可用内置渲染器

| renderer  | 说明           | options                       |
| --------- | -------------- | ----------------------------- |
| `text`    | 文本输入       | —                             |
| `number`  | 数字输入       | `min`, `max`, `step`          |
| `color`   | 颜色选择器     | —                             |
| `select`  | 下拉选择       | `options: { label, value }[]` |
| `padding` | 四方向 padding | —                             |

### 自定义渲染组件

当内置渲染器不够用时，可以用自定义 React 组件替代 `renderer` 字符串：

```typescript
{
  chain: ['custom_data', 'gradient'],
  renderer: GradientPicker,            // 自定义 React 组件
  label: '渐变',
}
```

自定义渲染组件接收标准 props：

```typescript
interface InspectorFieldRenderProps {
  value: unknown; // 当前字段值
  onChange(value: unknown): void; // 更新字段值
  widget: WidgetRuntime; // 完整 widget 数据
  options?: Record<string, unknown>; // field 配置的 options
}
```

组件内部可以使用 editor toolkit hooks 调用画布层能力：

```typescript
import { useEditorRef } from '@canvix-react/toolkit-editor';

function GradientPicker({ value, onChange, widget }: InspectorFieldRenderProps) {
  const ref = useEditorRef();

  function applyGradient(gradient: GradientValue) {
    onChange(gradient);

    // 也可以直接操作画布层（如联动修改其他字段）
    ref.update({
      target: 'widget',
      pageId: ref.getSnapshot().activePageId,
      id: widget.id,
      operations: [
        { kind: 'update', chain: ['custom_data', 'gradient'], value: gradient },
        { kind: 'update', chain: ['custom_data', 'bgColor'], value: gradient.stops[0].color },
      ],
    });
  }

  return <div>...</div>;
}
```

### 数据劫持（interceptor）

通过 `interceptor` 可以在属性值写入前拦截和篡改更新数据。适用于：值联动（改 A 时顺带改 B）、值校验/修正、格式转换。

```typescript
{
  chain: ['custom_data', 'width'],
  renderer: 'number',
  label: '宽度',
  options: { min: 0 },
  interceptor(value, { widget, update }) {
    // 等比缩放：修改宽度时同步修改高度
    const ratio = widget.layout.size[1] / widget.layout.size[0];
    const newWidth = value as number;
    const newHeight = Math.round(newWidth * ratio);

    // 返回额外的操作（追加到本次更新）
    return [
      { kind: 'update', chain: ['layout', 'size'], value: [newWidth, newHeight] },
    ];
  },
},
```

`interceptor` 签名：

```typescript
interface InspectorFieldInterceptor {
  (
    value: unknown,
    context: {
      widget: WidgetRuntime;
      update: (model: OperationModel) => void;
    },
  ): Operation[] | void;
  // 返回 Operation[] → 追加到本次更新
  // 返回 void → 不追加，仅执行原始更新
}
```

### 基础属性组

`createBasePropertyGroup()` 返回一组通用属性（name、position、size），所有 widget 共用：

```typescript
import { createBasePropertyGroup } from '@canvix-react/inspector-controls';

inspector: {
  properties: (widget) => [
    createBasePropertyGroup(),   // name, x, y, width, height
    // 自定义属性组...
  ],
},
```

---

## 插槽声明

如果 widget 可以容纳子 widget，通过 `slots` 声明。每个插槽默认支持多个子 widget 插入，由 `accept` 和 `maxCount` 控制约束。

```typescript
slots: [
  {
    name: 'header',
    label: '头部区域',
    accept: ({ owner, incoming }) => {
      // 最多 1 个子 widget
      if ((owner.slots?.['header']?.length ?? 0) + incoming.length > 1) return false;
      // 只接受 text 和 image
      return incoming.every(w => ['text', 'image'].includes(w.type));
    },
  },
  {
    name: 'body',
    label: '内容区域',
    // accept 未提供 → 接受所有 widget，不限数量
  },
],
```

### 字段说明

| 字段     | 类型                                  | 说明                           |
| -------- | ------------------------------------- | ------------------------------ |
| `name`   | `string`                              | 插槽标识，在 widget 内唯一     |
| `label`  | `string`                              | 显示名称（用于 UI 提示）       |
| `accept` | `(ctx: SlotAcceptContext) => boolean` | 动态校验函数。未提供则接受所有 |

### accept 参数

```typescript
interface SlotAcceptContext {
  /** 插槽所属的 widget 实例（含当前 slots 数据，可用于判断已有子 widget 数量） */
  owner: WidgetRuntime;
  /** 即将插入的 widget 实例列表（可能为多个，如批量粘贴/拖入） */
  incoming: WidgetRuntime[];
}
```

`accept` 可以基于任意条件做动态判断：

```typescript
accept: ({ owner, incoming }) => {
  const currentCount = owner.slots?.['content']?.length ?? 0;

  // 数量限制
  if (currentCount + incoming.length > 5) return false;

  // 类型过滤
  if (!incoming.every(w => w.type === 'text')) return false;

  // 基于自定义数据过滤
  if (incoming.some(w => !w.custom_data.src)) return false;

  return true;
},
```

---

## 插槽渲染

Widget 渲染组件需要在内部决定插槽的渲染位置。Editor 端和 viewer 端分别使用不同的插槽渲染组件。

### Editor 端 — 可编辑插槽

使用 `EditorSlotRenderer`，渲染子 widget 列表 + 空态 drop zone：

```tsx
// editor.tsx
import type { WidgetRenderProps } from '@canvix-react/shared-types';
import { EditorSlotRenderer } from '@canvix-react/page-renderer';

export function MyWidgetEditor({ widget }: WidgetRenderProps<MyWidgetData>) {
  return (
    <div style={{ color: widget.custom_data.color }}>
      <header>
        {/* 在 header 位置渲染 'header' 插槽 */}
        <EditorSlotRenderer slotName="header" />
      </header>
      <main>
        {/* 在 main 位置渲染 'body' 插槽 */}
        <EditorSlotRenderer slotName="body" />
      </main>
    </div>
  );
}
```

`EditorSlotRenderer` 行为：

- 读取当前 widget 的 `slots[slotName]` 获取子 widget ID 列表
- 为每个子 widget 包裹 `WidgetLiveProvider`（设置 `parentId` 和 `slotName`）
- 渲染子 widget 的 editor 渲染组件
- 插槽为空时显示占位提示（虚线边框 + 插槽名称）
- 标记 `[data-slot-zone]` 用于拖拽 hit test

### Viewer 端 — 只读插槽

使用 `ViewerSlotRenderer`，仅渲染子 widget，无 drop zone 和编辑交互：

```tsx
// viewer.tsx
import type { WidgetRenderProps } from '@canvix-react/shared-types';
import { ViewerSlotRenderer } from '@canvix-react/page-renderer';

export function MyWidgetViewer({ widget }: WidgetRenderProps<MyWidgetData>) {
  return (
    <div style={{ color: widget.custom_data.color }}>
      <header>
        <ViewerSlotRenderer slotName="header" />
      </header>
      <main>
        <ViewerSlotRenderer slotName="body" />
      </main>
    </div>
  );
}
```

`ViewerSlotRenderer` 行为：

- 读取子 widget ID 列表，渲染 viewer 渲染组件
- 无占位提示、无 drop zone、无编辑交互
- 插槽为空时不渲染任何内容

---

## 注册

Widget 定义在 app 层声明列表，由底座内部注册：

```typescript
// apps/app-editor/src/App.tsx
import { myWidgetDefinition } from '@canvix-react/widget-my-widget/definition';

const widgets = [textDefinition, imageDefinition, myWidgetDefinition];

useEditorBootstrap({ plugins, widgets, config, saveAdapter });
```

---

## 文件结构

```
widgets/widget-my-widget/
├── package.json
├── tsconfig.json
└── src/
    ├── definition.ts     # WidgetPluginDefinition 导出
    ├── types.ts          # MyWidgetData 类型
    ├── render.tsx        # 共用渲染组件（如果 editor/viewer 相同）
    ├── editor.tsx        # editor 端渲染（可 import render.tsx 或独立实现）
    └── viewer.tsx        # viewer 端渲染（可 import render.tsx 或独立实现）
```
