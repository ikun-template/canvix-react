# 开发手册：Layout Plugin

## 定义

```typescript
import type { LayoutPluginDefinition } from '@canvix-react/shared-types';
import { MyPanel } from './my-panel.js';

export const myPlugin: LayoutPluginDefinition = {
  name: 'layout-my-panel',
  slot: 'sidebar', // 挂载到哪个 slot
  component: MyPanel, // React 组件，无 props
};
```

组件无 props。所有数据和操作通过 hooks 获取。

---

## 可用 Slots

| Slot        | 位置     | 现有插件                           |
| ----------- | -------- | ---------------------------------- |
| `sidebar`   | 左侧面板 | 页面列表 + 图层树 + 保存/设置按钮  |
| `canvas`    | 中央画布 | 画布渲染 + widget 编排 + 拖拽/缩放 |
| `inspector` | 右侧面板 | 选中对象的属性编辑                 |
| `toolbox`   | 底部悬浮 | 工具选择 + widget 添加             |

---

## 可用能力

### 编辑器状态（读）

```typescript
import { useEditorLive } from '@canvix-react/toolkit-editor';

// 订阅单个字段
const activePageId = useEditorLive('activePageId');

// 订阅多个字段
const { zoom, camera } = useEditorLive('zoom', 'camera');

// 全量订阅（任意字段变化都 re-render，慎用）
const snapshot = useEditorLive();
```

可订阅的字段：

| 字段                | 类型             | 说明                              |
| ------------------- | ---------------- | --------------------------------- |
| `activePageId`      | `string`         | 当前活跃页面                      |
| `selectedWidgetIds` | `string[]`       | 选中的 widget                     |
| `hoveredWidgetId`   | `string \| null` | hover 中的 widget                 |
| `activeTool`        | `EditorToolType` | 当前工具（`'select'` / `'hand'`） |
| `zoom`              | `number`         | 缩放比例                          |
| `camera`            | `{ x, y }`       | 画布相机位置（世界坐标）          |
| `interacting`       | `boolean`        | 是否正在拖拽/resize               |
| `dirty`             | `boolean`        | 文档是否有未保存修改              |
| `flowDragWidgetId`  | `string \| null` | flow 拖拽中的 widget              |
| `flowDropIndex`     | `number \| null` | flow 拖拽的放置位置               |

### 编辑器状态（写）+ 数据操作

```typescript
import { useEditorRef } from '@canvix-react/toolkit-editor';

const ref = useEditorRef();

// UI 状态操作
ref.setActivePage(pageId);
ref.setSelection([widgetId]);
ref.setHoveredWidget(id);
ref.setActiveTool('hand');
ref.setZoom(1.5);
ref.setCamera(100, 200);
ref.setDirty(true);

// 批量更新（合并为一次通知）
ref.batch(() => {
  ref.setZoom(newZoom);
  ref.setCamera(newX, newY);
});

// 同步读取快照
const { zoom, selectedWidgetIds } = ref.getSnapshot();
```

### 文档数据

```typescript
import { useChronicleSelective } from '@canvix-react/toolkit-editor';

// 选择性订阅（推荐，减少不必要的 re-render）
const doc = useChronicleSelective(model => {
  if (model.target === 'document') return true;
  if (model.target === 'page' && model.id === activePageId) return true;
  return false;
});

const page = doc.pages.find(p => p.id === activePageId);
```

```typescript
// 直接读取（不订阅，适合事件回调内）
const doc = ref.chronicle.getDocument();
```

### 数据变更

```typescript
// 更新 widget 属性
ref.update({
  target: 'widget',
  pageId,
  id: widgetId,
  operations: [
    { kind: 'update', chain: ['custom_data', 'color'], value: '#ff0000' },
  ],
});

// 添加 widget
ref.update({
  target: 'page',
  id: pageId,
  operations: [
    { kind: 'array:insert', chain: ['widgets'], index: -1, value: widgetData },
  ],
});

// 删除 widget
ref.update({
  target: 'page',
  id: pageId,
  operations: [{ kind: 'array:remove', chain: ['widgets'], index }],
});

// 移动 widget 顺序
ref.update({
  target: 'page',
  id: pageId,
  operations: [{ kind: 'move', chain: ['widgets'], from, to }],
});
```

### 草稿编辑（拖拽预览）

```typescript
const session = ref.beginDraft();

// 拖拽中持续更新（不记入 undo 历史）
session.update({
  target: 'widget',
  pageId,
  id: widgetId,
  operations: [{ kind: 'update', chain: ['position', 'axis'], value: [x, y] }],
});

// 确认
session.commit();

// 或取消
session.rollback();
```

### 保存

```typescript
await ref.save();
```

### Widget 注册表

```typescript
const allWidgets = ref.registry.getAll();
const definition = ref.registry.get('text');
const Icon = definition?.meta.icon;
```

### i18n / 主题

```typescript
import { useI18n, useTheme } from '@canvix-react/toolkit-editor';

const { t, locale, setLocale } = useI18n();
const { theme, setTheme } = useTheme();
```

### Page / Widget 作用域数据

在 `PageLiveProvider` 内部的组件可用：

```typescript
import { usePageLive } from '@canvix-react/toolkit-shared';

const { pageId, name, layout, widgetIds, version } = usePageLive();
```

在 `WidgetLiveProvider` 内部的组件可用：

```typescript
import { useWidgetLive } from '@canvix-react/toolkit-shared';

const { widgetId, pageId, parentId, slotName, version } = useWidgetLive();
```

---

## 文件结构

```
layouts/layout-my-panel/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           # 导出 LayoutPluginDefinition
    └── my-panel.tsx       # 主组件
```
