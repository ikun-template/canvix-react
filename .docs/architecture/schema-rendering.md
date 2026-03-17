# 架构设计：Schema 驱动渲染

## 核心原则

**UI = f(schema)**。所有渲染由 Schema 数据驱动，UI 组件不自持业务状态。变更流单向：Operation → Modifier → 广播 → 渲染响应。

---

## 渲染管线

从 Schema 数据到屏幕像素的完整路径：

```
Schema (Document)
  │
  ├─ Page 列表渲染
  │   订阅: add-page / delete-page / move-page
  │   职责: 维护 page tab 列表的增删排序
  │
  └─ 当前 Page
      │
      ├─ Widget 列表渲染 (Page Renderer)
      │   订阅: add-widget / delete-widget / move-widget
      │   职责: 维护 widget key 列表的增删排序，map 渲染子组件
      │   不订阅: 具体 widget 的字段变更
      │
      └─ Widget 实例渲染
          订阅: 自身 id 对应的 update 操作
          职责: 根据 chain 判断更新哪部分
```

---

## 分层订阅

渲染层分为列表层和数据层，各自订阅不同粒度的变更：

### 列表层

列表层仅关心集合变动（增删移），负责 React 的 key 列表维护：

```typescript
// Page Renderer 内部
modifier.onUpdate(ops => {
  const listOps = ops.filter(
    op =>
      op.target === 'page' &&
      op.id === pageId &&
      op.operations.some(
        o =>
          o.trigger === 'add-widget' ||
          o.trigger === 'delete-widget' ||
          o.trigger === 'move-widget',
      ),
  );
  if (listOps.length > 0) {
    // 仅更新 widget id 列表，触发 React map 增删
  }
});
```

列表层渲染 widget 时只传递 `widgetId`，不传递 widget 数据：

```tsx
{
  widgetIds.map(id => (
    <WidgetProvider key={id} widgetId={id}>
      <WidgetShell />
    </WidgetProvider>
  ));
}
```

### 数据层

每个 Widget 实例内部自行订阅自身数据变更：

```typescript
// WidgetShell 内部
modifier.onUpdate(ops => {
  const myOps = ops.filter(op => op.target === 'widget' && op.id === widgetId);
  if (myOps.length === 0) return;

  for (const op of myOps) {
    for (const item of op.operations) {
      if (item.trigger !== 'update') continue;
      for (const { chain } of item.data) {
        // 根据 chain 精准响应
        applyUpdate(chain);
      }
    }
  }
});
```

---

## 字段级精准更新

Widget 根据 Operation 的 `chain` 判断需要更新的具体部分，避免整体 re-render：

| chain 前缀             | 更新方式             | 说明                   |
| ---------------------- | -------------------- | ---------------------- |
| `['position', 'axis']` | CSS transform        | 仅更新坐标，不走 React |
| `['layout', 'size']`   | CSS width/height     | 仅更新尺寸             |
| `['rotation']`         | CSS transform rotate | 仅更新旋转             |
| `['opacity']`          | CSS opacity          | 仅更新透明度           |
| `['hide']`             | CSS display          | 仅更新可见性           |
| `['mode']`             | 重新计算布局方式     | 切换定位/流式          |
| `['custom_data', ...]` | 透传到组件内部       | 由组件自行处理渲染     |

### WidgetShell 的职责

WidgetShell 是 widget 的外壳组件，职责分两层：

- **外壳层**：处理通用 schema 字段（position / layout / rotation / opacity / hide / mode），直接操作 DOM 样式，不触发 React re-render
- **内容层**：将 `custom_data` 变更传递给具体组件（从注册表获取的 render 组件），由组件自行决定渲染

```
WidgetShell (外壳)
  ├── DOM style 操作: position, size, rotation, opacity, visibility
  └── WidgetContent (内容)
       └── definition.render.editor / viewer
           └── 通过 Toolkit 订阅 custom_data 变更
```

---

## Page Renderer

Page Renderer 是 Page 渲染引擎，位于 `domains/page-renderer/`，editor 和 viewer 共用核心逻辑：

### 职责

1. 接收当前 page 的 widget 列表，维护 id 数组
2. 按照根级 widget 顺序进行 map 渲染
3. 为每个 widget 注入 WidgetProvider（Context）
4. 渲染 WidgetShell → 从注册表获取组件 → 渲染具体组件
5. 处理 slot 嵌套：当 widget 声明了 slots，递归渲染子 widget 列表

### Slot 渲染

容器类 widget 内部通过 Page Renderer 提供的 `SlotRenderer` 渲染子 widget：

```tsx
// 容器组件内部
function ContainerWidget({ data }) {
  return (
    <div>
      <SlotRenderer slotName="header" />
      <SlotRenderer slotName="content" />
    </div>
  );
}
```

`SlotRenderer` 内部：

1. 从 WidgetContext 获取当前 widgetId
2. 从 schema 读取 `widget.slots[slotName]`（id 列表）
3. 订阅 slot 的 id 列表变更（array:insert / array:remove）
4. map 渲染子 widget，每个子 widget 注入新的 WidgetProvider（含 parentId、slotName）

---

## 变更到渲染的完整流程

以拖拽移动 widget 为例：

```
1. Canvas 拖拽交互产生新坐标 [100, 200]
   │
2. 调用 Toolkit: update([{ chain: ['position', 'axis'], value: [100, 200] }])
   │
3. Toolkit 组装 WidgetOperation: { target: 'widget', pageId, id, operations: [...] }
   │
4. Modifier.update() 执行：就地修改 schema，计算逆操作，压入 history
   │
5. Modifier 广播 operations
   │
6. 列表层接收 → 无 add/delete/move → 不响应
   │
7. WidgetShell (id 匹配) 接收
   │  chain: ['position', 'axis']
   │  → 直接设置 DOM style: left/top
   │  → 不触发 React re-render
   │
8. 渲染完成（单次 DOM 操作）
```

---

## 包结构

```
domains/
└── page-renderer/
    ├── package.json              # @ikun-kit/page-renderer
    └── src/
        ├── page-renderer.tsx     # Page 渲染入口
        ├── widget-shell.tsx      # Widget 外壳（通用字段 → DOM style）
        ├── widget-content.tsx    # Widget 内容（注册表查找 → 渲染具体组件）
        ├── slot-renderer.tsx     # Slot 渲染（递归嵌套）
        └── index.ts
```
