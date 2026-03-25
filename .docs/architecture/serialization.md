# 架构设计：序列化与持久化

## 概述

Document 序列化为 JSON，支持 Base64 编码传输。大文档解码在 Worker 中执行。持久化支持手动/自动保存，不阻塞编辑。剪贴板支持 Page / Widget 级别的复制粘贴。

---

## 序列化格式

### Document → JSON

Document 对象直接序列化为 JSON 字符串。序列化前通过 `document:beforeSave` 钩子允许插件预处理（如清理临时数据）。

```typescript
function serialize(document: Document): string {
  return JSON.stringify(document);
}

function deserialize(json: string): Document {
  return JSON.parse(json);
}
```

### JSON → Base64（传输编码）

用于网络传输场景，将 JSON 字符串编码为 Base64：

```typescript
function encode(document: Document): string {
  const json = serialize(document);
  return btoa(new TextEncoder().encode(json));
}
```

### 大文档异步解码

解码操作可能耗时（大量 widget），放在 Web Worker 中执行，不阻塞主线程：

```typescript
async function decode(base64: string): Promise<Document> {
  const json = await decodeInWorker(base64);
  return deserialize(json);
}
```

### 反序列化后处理

```
Base64 字符串
  │
  ├─ 1. Worker 解码 → JSON 字符串
  │
  ├─ 2. JSON.parse → 原始对象
  │
  ├─ 3. Schema 版本检查 → 按需执行迁移链（document / page / widget 各级）
  │
  ├─ 4. 缺省服务填充 → 确保所有字段完整
  │
  └─ 5. 交给 Modifier → 就绪
```

---

## 持久化

### 保存状态

```typescript
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
```

保存状态由应用层管理，UI 层可订阅展示保存指示器。

### 手动保存

用户触发（快捷键 / 按钮）→ 调用保存流程：

```
1. 检查 saveStatus !== 'saving'（防止重复提交）
   │
2. 设置 saveStatus = 'saving'
   │
3. 触发 hook: document:beforeSave（插件可预处理/拦截）
   │
4. 序列化 + 编码
   │
5. 通过 PersistenceAdapter → documentService 提交到 Services 层
   │
6. 成功 → saveStatus = 'saved'
   失败 → saveStatus = 'failed'
```

### 自动保存

基于变更检测的自动保存：

- Modifier 每次 `update()` 后标记 `hasUnsavedChanges = true`
- 防抖定时器（可配置间隔，如 30s）触发自动保存
- 自动保存与手动保存共享同一流程，互斥锁防止并发

### 持久化适配器

保存目标通过适配器模式对接 Services 层（`@ikun-kit/services`）：

```typescript
interface PersistenceAdapter {
  save(id: string, data: string): Promise<void>;
  load(id: string): Promise<string>;
}
```

适配器实现直接调用 `documentService`：

```typescript
import { documentService } from '@ikun-kit/services';

const servicesAdapter: PersistenceAdapter = {
  async save(id, data) {
    await documentService.update(id, { data });
  },
  async load(id) {
    const record = await documentService.get(id);
    return record.data;
  },
};
```

- Services 层内部按环境分发到 client（HTTP API）或 server（IndexedDB），适配器不感知底层存储
- 当前阶段 Services 使用 IndexedDB 实现，后续切换到 HTTP API 时适配器代码无需修改

---

## 剪贴板

### 数据格式

剪贴板数据序列化为 JSON，包含类型标识：

```typescript
type ClipboardData =
  | { type: 'copy-page'; pages: Page[] }
  | { type: 'copy-widget'; widgets: Widget[] };
```

写入系统剪贴板时序列化为 JSON 字符串，通过 `navigator.clipboard.writeText()` 存入。

### 复制

```
1. 获取选中的 page 或 widget
   │
2. 深拷贝选中实例的 schema 数据
   │
3. 构造 ClipboardData（附加 type 标识）
   │
4. JSON.stringify → navigator.clipboard.writeText
```

### 粘贴

```
1. navigator.clipboard.readText → JSON.parse
   │
2. 校验 type 标识，确认粘贴目标合法
   │
3. 为所有实例重新分配 ID（nanoid）
   │  - Page: 新 page id
   │  - Widget: 新 widget id
   │  - Slot 内引用的 widget id 同步更新
   │
4. 调用 Toolkit: addPage / addWidget
   │
5. Modifier 执行 Operation，记入 History（可撤销）
```

### Slot 引用一致性

粘贴含 slot 的 widget 时，需保证 id 映射一致：

```
原始: Widget A (slots: { content: ['C', 'D'] }), Widget C, Widget D
            ↓ 重新分配 ID
新增: Widget A' (slots: { content: ['C'', 'D''] }), Widget C', Widget D'
```

构建旧 id → 新 id 的映射表，遍历所有 slot 引用统一替换。

---

## 包结构

```
packages/
└── serializer/
    ├── package.json          # @ikun-kit/serializer
    └── src/
        ├── serialize.ts      # serialize / deserialize
        ├── codec.ts          # Base64 encode / decode
        ├── worker.ts         # Web Worker 解码入口
        ├── clipboard.ts      # 剪贴板操作
        ├── persistence.ts    # PersistenceAdapter 接口 + 内置适配器
        └── index.ts
```
