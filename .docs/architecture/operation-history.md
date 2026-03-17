# 架构设计：变更与历史

## 概述

所有 Schema 数据的变更通过 Operation 模型描述，经统一入口执行。每次变更自动计算逆操作，支持 undo/redo。

---

## Operation 模型

### 目标层级

Operation 通过 `target` 区分变更作用的层级：

```typescript
type OperationModel = DocumentOperation | PageOperation | WidgetOperation;
```

```typescript
interface DocumentOperation {
  target: 'document';
  operations: DocumentOp[];
}

interface PageOperation {
  target: 'page';
  id: string; // 目标 page id
  operations: PageOp[];
}

interface WidgetOperation {
  target: 'widget';
  pageId: string; // 所属 page id
  id: string; // 目标 widget id（扁平存储，直接定位）
  operations: WidgetOp[];
}
```

> 由于 widget 扁平存储在 `Page.widgets[]` 中，无论嵌套多深，`pageId + id` 即可直接定位任意 widget，无需路径段描述。

---

### 操作类型

每个层级的 `operations[]` 由以下操作类型组成：

**字段更新**（所有层级通用）

```typescript
interface OpUpdate {
  trigger: 'update';
  data: { chain: Chain; value: unknown }[];
}

/** 字段路径，如 ['layout', 'size'] 或 ['custom_data', 'title'] */
type Chain = (string | number)[];
```

**数组元素操作**（所有层级通用）

```typescript
interface OpArrayInsert {
  trigger: 'array:insert';
  data: {
    chain: Chain;
    updates: { index?: number; value: unknown }[];
  };
}

interface OpArrayRemove {
  trigger: 'array:remove';
  data: {
    chain: Chain;
    indexes: number[];
  };
}
```

**集合操作**（Document 对 Page / Page 对 Widget）

```typescript
interface OpAdd<T extends string, D> {
  trigger: T; // 'add-page' | 'add-widget'
  data: { index?: number; item: D }[];
}

interface OpDelete<T extends string> {
  trigger: T; // 'delete-page' | 'delete-widget'
  data: string[]; // 待删除的 id 列表
}

interface OpMove<T extends string> {
  trigger: T; // 'move-page' | 'move-widget'
  data: { id: string; from: number; to: number }[];
}
```

各层级可用操作汇总：

| 层级     | update | array:\* | add/delete/move |
| -------- | ------ | -------- | --------------- |
| Document | ✓      | ✓        | page 增删移     |
| Page     | ✓      | ✓        | widget 增删移   |
| Widget   | ✓      | ✓        | —               |

> Widget 的 slot 子级增删本质是对 `slots.xxx` 这个 `string[]` 的 array:insert / array:remove，加上在 `Page.widgets` 上的 add-widget / delete-widget。两个操作组合在一次 `update()` 调用中完成，作为一条原子历史记录。

---

## 变更执行

### 统一入口

```typescript
interface Modifier {
  update(
    operations: OperationModel[],
    options?: UpdateOptions,
  ): OperationModel[];
  undo(): OperationModel[] | null;
  redo(): OperationModel[] | null;
}

interface UpdateOptions {
  /** 是否记入历史，默认 true */
  memorize?: boolean;
  /** 是否与上一条历史合并，默认 false */
  merge?: boolean;
}
```

### 执行流程

```
update(operations) 调用
  │
  ├─ 1. 遍历 OperationModel[]，按 target 分发
  │     ├─ document → 在 doc 对象上执行
  │     ├─ page     → 按 id 查找 page，执行
  │     └─ widget   → 按 pageId 查找 page，再按 id 在 widgets[] 中查找，执行
  │
  ├─ 2. 每个操作就地修改数据，同时计算逆操作
  │
  ├─ 3. 若 memorize !== false，将 { undo, redo } 压入 History
  │
  └─ 4. 广播本次 operations，供消费方响应
```

### 就地修改 + 逆操作计算

变更直接修改数据对象（mutable），在修改前捕获旧值生成逆操作：

| 正向操作                         | 逆操作                                    |
| -------------------------------- | ----------------------------------------- |
| `update` (chain + newValue)      | `update` (chain + oldValue)               |
| `array:insert` (chain + indexes) | `array:remove` (chain + indexes)          |
| `array:remove` (chain + indexes) | `array:insert` (chain + 被移除的元素)     |
| `add-page/widget` (items)        | `delete-page/widget` (ids)                |
| `delete-page/widget` (ids)       | `add-page/widget` (被删除的元素 + 原索引) |
| `move-page/widget` (from → to)   | `move-page/widget` (to → from)            |

---

## History

```typescript
interface HistoryEntry {
  undo: OperationModel[];
  redo: OperationModel[];
}
```

### 行为

- **push**：截断当前位置之后的所有记录（丢弃 redo 分支），追加新 entry，指针前移
- **undo**：指针后移，取出 entry.undo 交给 `update(ops, { memorize: false })` 执行
- **redo**：指针前移，取出 entry.redo 交给 `update(ops, { memorize: false })` 执行
- **容量上限**：超出最大条目数时，丢弃最早的记录

### 操作合并

连续的同类变更可合并为一条历史记录（如拖拽中的连续 position 更新）。合并策略：

- 调用方通过 `update(ops, { merge: true })` 指示本次变更可与上一条合并
- 合并条件：上一条记录存在且 merge 为 true
- 合并方式：用本次的 redo 替换上一条的 redo，保留上一条的 undo（即最初状态）
- 最终效果：多次拖拽中间态 → 一条从起始位置到最终位置的历史记录

---

## 变更订阅

变更执行完成后广播本次 `OperationModel[]`。订阅分两层，实现列表与数据的更新解耦：

### 列表层订阅

列表层（如 Page 的 widget 列表渲染）仅关心增删移操作，负责 React 的 map 渲染（key 列表变化）。不订阅具体 widget 的数据内容变更。

```typescript
// 列表层仅响应 add-widget / delete-widget / move-widget
// 触发 React 列表的 key 增删重排，不关心 widget 内部字段
```

### 数据层订阅

具体 widget 内部自行订阅自身数据变更，根据 Operation 中的 chain 判断是否需要响应。列表层的 map 渲染不会因为某个 widget 的字段更新而重新执行。

```typescript
// widget 内部订阅示例
modifier.onUpdate(ops => {
  // 只处理 target 为自身 id 的 widget operation
  // 根据 chain 决定更新哪部分 DOM
});
```

> 这种分层订阅确保：单个 widget 字段变更不触发列表层 re-render，列表增删不触发无关 widget 内部更新。

---

## 字段变更检测

提供工具函数，消费方用于判断某次变更是否影响自己关心的字段：

```typescript
function hasFieldChanged(
  operations: OperationModel[],
  target: 'document' | 'page' | 'widget',
  chain: Chain,
): boolean;
```

匹配规则：前缀匹配。查询 `['layout']` 会匹配 `['layout', 'size']` 的变更。

---

## 包结构

```
packages/
└── modifier/
    ├── package.json        # @ikun-kit/modifier
    └── src/
        ├── types.ts        # OperationModel, Chain 等类型
        ├── operation.ts    # 变更执行 + 逆操作计算
        ├── history.ts      # History 栈
        ├── utils.ts        # hasFieldChanged 等工具函数
        └── index.ts        # Modifier 统一入口
```
