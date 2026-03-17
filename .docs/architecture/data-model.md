# 架构设计：数据模型

## 实例结构

```
Document (1)
 └── Page (1..n)
      └── widgets: Widget[]         ← 扁平存储本页所有 widget
```

Widget 通过 slots 引用子 widget ID，形成逻辑树；但物理存储扁平化在 Page 级：

```
Page.widgets[]          ← 存储所有 widget 数据（不论嵌套深度）
  ├── Widget A          ← slots: { content: ['C', 'D'] }
  ├── Widget B
  ├── Widget C          ← A.slots.content 的子 widget
  └── Widget D          ← A.slots.content 的子 widget

根级 widget = widgets 中未被任何 slot 引用的 widget，数组顺序即渲染顺序
```

---

## 设计原则

- **通用性**：Schema 仅定义编辑器通用能力所需的字段，不包含任何业务领域专属字段
- **渲染数据与编辑状态分离**：Schema 只承载最终渲染所需的数据；编辑器运行时状态（缩放、滚动、选中、激活页面等）独立存储，不污染 Schema
- **全字段可选**：三级 Schema 的所有字段均为可选，由缺省服务填充默认值
- **缺省服务**：提供 `defaults` 函数，接收部分字段，与默认值深度合并后返回完整实例

---

## 数据分层

```
┌─────────────────────────────────────┐
│         Editor State (编辑状态)       │ ← 仅编辑器运行时使用，不持久化到 Schema
│  activePage, zoom, scroll, selection │
└──────────────┬──────────────────────┘
               │ 读写
┌──────────────▼──────────────────────┐
│         Schema (渲染数据)             │ ← 持久化，驱动渲染输出
│  Document → Page[] → Widget[]        │
└─────────────────────────────────────┘
```

- **Schema**：描述"最终产物长什么样"，序列化/反序列化的对象，编辑器和查看器共用
- **Editor State**：描述"编辑过程中的临时状态"，仅编辑器使用，不随文档保存

---

## Schema 定义

### Document

```typescript
interface Document {
  schema?: string;
  title?: string;
  desc?: string;
  cover?: string;
  pages?: Page[];
}
```

### Page

```typescript
interface Page {
  schema?: string;
  id?: string;
  name?: string;
  layout?: {
    /** 画布尺寸 */
    size?: [width: number, height: number];
  };
  background?: string;
  /** 扁平存储本页所有 widget（不论嵌套深度），数组顺序即渲染顺序 */
  widgets?: Widget[];
}

type LayoutMode = 'absolute' | 'flow';
```

### Widget

```typescript
interface Widget<CustomData = unknown> {
  schema?: string;
  id?: string;
  /** 组件类型标识，对应注册表中的 key */
  type?: string;
  name?: string;
  /** 自身的渲染模式：absolute 定位渲染 | flow 文档流渲染 */
  mode?: LayoutMode;
  /** 定位属性 —— 仅 mode 为 absolute 时生效 */
  position?: {
    axis?: [x: number, y: number];
  };
  layout?: {
    size?: [width: number, height: number];
  };
  rotation?: number;
  hide?: boolean;
  opacity?: number;
  /** 组件自定义数据，由具体组件类型定义 */
  custom_data?: CustomData;
  /** 具名插槽，key 为插槽名，value 为子 widget 有序 ID 列表 */
  slots?: Record<string, string[]>;
}
```

> - **扁平存储**：所有 widget 数据平铺在 `Page.widgets[]` 中，无论逻辑上嵌套多深。`Widget.slots` 仅存储 ID 引用描述逻辑树结构，未被任何 slot 引用的即为根级 widget
> - `mode` 配置在 Widget 自身，决定"我自己"以什么方式被渲染。缺省 `flow`，仅需要定位渲染的 Widget 才需显式配置为 `absolute`
> - `position`、`rotation` 等定位属性仅在 `mode: 'absolute'` 时生效
> - `slots` 中的 `string[]` 是有序的 widget ID 列表，决定子 widget 的渲染顺序
> - 业务方可通过 TypeScript 模块扩充（module augmentation）向任意层级追加领域字段，追加字段同样纳入缺省服务管理

---

## Editor State 定义

编辑状态独立于 Schema，仅在编辑器运行时存在：

```typescript
interface EditorState {
  /** 当前激活页面 ID */
  activePage?: string;
  /** 各页面的编辑视图状态，key 为 page id */
  pageStates?: Record<string, PageEditorState>;
  /** 当前选中的 widget id 集合 */
  selection?: string[];
}

interface PageEditorState {
  zoom?: number;
  scroll?: [x: number, y: number];
}
```

- Editor State 不参与文档序列化，不随文档保存/传输
- Editor State 可选择性持久化到本地存储（如记住用户上次的缩放比例），但这属于编辑器偏好，不属于文档数据
- Editor State 同样由缺省服务管理，全字段可选

---

## 缺省服务

每级 Schema package 导出 `defaults` 函数，职责：

1. 将用户传入的部分数据与预设默认值深度合并
2. 自动填充缺失字段（如 `id`、`schema` 版本）
3. 返回完整实例

```typescript
// 调用示例
const page = pageDefaults({ name: '首页' });
// → { schema: '0.1.0', id: 'a1b2c3', name: '首页', layout: { size: [1920, 1080] }, background: '', widgets: [] }
```

### Schema 默认值

| 层级     | 字段               | 默认值                        |
| -------- | ------------------ | ----------------------------- |
| Document | schema             | `'0.1.0'`                     |
| Document | title, desc, cover | `''`                          |
| Document | pages              | `[]`                          |
| Page     | schema             | `'0.1.0'`                     |
| Page     | id                 | `nanoid(6)`                   |
| Page     | name               | `''`                          |
| Page     | layout.size        | `[1920, 1080]`                |
| Page     | background         | `''`                          |
| Page     | widgets            | `[]`                          |
| Widget   | schema             | `'0.1.0'`                     |
| Widget   | id                 | `nanoid(6)`                   |
| Widget   | type               | `''`                          |
| Widget   | name               | `''`                          |
| Widget   | mode               | `'flow'`                      |
| Widget   | position.axis      | `[0, 0]`                      |
| Widget   | layout.size        | `[300, 200]`                  |
| Widget   | rotation           | `0`                           |
| Widget   | hide               | `false`                       |
| Widget   | opacity            | `1`                           |
| Widget   | custom_data        | `{}`                          |
| Widget   | slots              | `undefined`（无插槽时不创建） |

### Editor State 默认值

| 字段                   | 默认值                           |
| ---------------------- | -------------------------------- |
| activePage             | 首个 page 的 id，无 page 则 `''` |
| pageStates             | `{}`                             |
| selection              | `[]`                             |
| PageEditorState.zoom   | `1`                              |
| PageEditorState.scroll | `[0, 0]`                         |

---

## ID 策略

- `nanoid` 生成，长度 6 位
- 文档内唯一，不要求全局唯一
- `defaults` 函数自动分配，粘贴操作时重新分配

---

## Schema 版本迁移

每级 Schema package 包含迁移注册表：

```typescript
type Migrator = (data: unknown) => unknown;

const migrations: Record<string, Migrator> = {
  '0.1.0 -> 0.2.0': data => {
    /* ... */
  },
};

export function migrate(data: unknown, fromVersion: string): T;
```

迁移时机：反序列化后、渲染前，检查 `schema` 版本，低于当前版本则执行迁移链。缺省服务在迁移后运行，确保新增字段自动填充。

---

## 模块扩充

业务方通过 module augmentation 扩展 Schema：

```typescript
declare module '@ikun-kit/schema-page' {
  interface Page {
    color_variables?: ColorVariables;
    content_display?: ContentDisplay;
  }
}
```

扩充后的字段需同步注册默认值到缺省服务，确保 `defaults` 函数能覆盖。

---

## 包结构

```
schemas/
├── document/
│   ├── package.json        # @ikun-kit/schema-document
│   └── src/
│       ├── types.ts        # Document 类型
│       ├── defaults.ts     # 缺省服务
│       ├── migration.ts    # 迁移注册表
│       └── index.ts
├── page/
│   ├── package.json        # @ikun-kit/schema-page
│   └── src/
└── widget/
    ├── package.json        # @ikun-kit/schema-widget
    └── src/
```

Editor State 不单独成包，由 `dock-editor` 内部管理。

依赖方向：`schema-document` → `schema-page` → `schema-widget`（单向）。
