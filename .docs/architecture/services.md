# 架构设计：接口服务 (Services)

## 概述

Services 层为应用提供统一的数据接口，屏蔽底层存储差异。采用门面模式，按运行时环境分发到 client（HTTP API）或 server（IndexedDB）实现。当前阶段仅实现 server 端。

---

## 三层结构

```
上层调用（Dock Runtime / 插件 / Toolkit）
     │
     ▼
┌─────────────┐
│   Facade     │  ← 门面层：统一接口，按环境分发
└──────┬──────┘
       │
  isClient() ?
       │
  ┌────┴────┐
  ▼         ▼
client/   server/
HTTP API  IndexedDB
(骨架)    (当前实现)
```

---

## 环境检测

```typescript
type Runtime = 'client' | 'server';

function getRuntime(): Runtime {
  // 当前阶段固定返回 'server'
  // 后续可通过环境变量、配置或 UA 检测切换
  return 'server';
}

function isClient(): boolean {
  return getRuntime() === 'client';
}
```

---

## 数据模型 (Models)

纯 TypeScript 类型定义，不含运行时逻辑：

```typescript
// models/document.ts
interface DocumentRecord {
  id: string;
  title: string;
  desc: string;
  cover: string;
  /** 序列化后的 Document JSON 字符串 */
  data: string;
  created_at: number;
  updated_at: number;
}

interface DocumentListItem {
  id: string;
  title: string;
  desc: string;
  cover: string;
  updated_at: number;
}
```

> Models 定义存储层的数据结构，与 Schema 的 `Document` 类型不同。`DocumentRecord.data` 存储的是序列化后的 Document Schema JSON。

---

## 门面层 (Facade)

每个业务域一个门面文件，对外暴露统一接口：

```typescript
// document.ts
import * as client from './client/document';
import * as server from './server/document';

export const documentService = {
  list(): Promise<DocumentListItem[]> {
    return isClient() ? client.list() : server.list();
  },

  get(id: string): Promise<DocumentRecord> {
    return isClient() ? client.get(id) : server.get(id);
  },

  create(title: string): Promise<DocumentRecord> {
    return isClient() ? client.create(title) : server.create(title);
  },

  update(
    id: string,
    data: Partial<Pick<DocumentRecord, 'title' | 'desc' | 'cover' | 'data'>>,
  ): Promise<void> {
    return isClient() ? client.update(id, data) : server.update(id, data);
  },

  delete(id: string): Promise<void> {
    return isClient() ? client.delete(id) : server.delete(id);
  },
};
```

---

## Server 实现（IndexedDB）

当前阶段的完整实现，基于 `idb` 库操作 IndexedDB：

### 数据库设计

```typescript
interface EditorDBSchema extends DBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: {
      'by-updatedAt': number;
    };
  };
}

const DB_NAME = 'ikun-editor';
const DB_VERSION = 1;
```

### 实现示例

```typescript
// server/document.ts
import { openDB } from 'idb';

async function getDB() {
  return openDB<EditorDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('documents', { keyPath: 'id' });
      store.createIndex('by-updatedAt', 'updated_at');
    },
  });
}

export async function list(): Promise<DocumentListItem[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('documents', 'by-updatedAt');
  return all.reverse().map(({ id, title, desc, cover, updated_at }) => ({
    id,
    title,
    desc,
    cover,
    updated_at,
  }));
}

export async function get(id: string): Promise<DocumentRecord> {
  const db = await getDB();
  const record = await db.get('documents', id);
  if (!record) throw new Error(`Document ${id} not found`);
  return record;
}

export async function create(title: string): Promise<DocumentRecord> {
  const db = await getDB();
  const now = Date.now();
  const record: DocumentRecord = {
    id: crypto.randomUUID(),
    title,
    desc: '',
    cover: '',
    data: '',
    created_at: now,
    updated_at: now,
  };
  await db.put('documents', record);
  return record;
}
```

---

## Client 实现（HTTP API 骨架）

当前阶段仅预留接口骨架，不实现具体调用：

```typescript
// client/document.ts

export async function list(): Promise<DocumentListItem[]> {
  throw new Error('client.document.list not implemented');
}

export async function get(id: string): Promise<DocumentRecord> {
  throw new Error('client.document.get not implemented');
}

// ...
```

后续对接真实后端时，引入 HTTP 客户端填充实现：

```typescript
// 未来实现示例
import { http } from '../lib/fetch';

export async function list(): Promise<DocumentListItem[]> {
  const res = await http.get('/documents');
  return res.data;
}
```

---

## 与持久化适配器的关系

序列化文档（`@ikun-kit/serializer`）中的 `PersistenceAdapter` 对接 Services 层：

```typescript
// IndexedDB 适配器
const indexedDBAdapter: PersistenceAdapter = {
  async save(id: string, data: string) {
    await documentService.update(id, { data, updated_at: Date.now() });
  },
  async load(id: string) {
    const record = await documentService.get(id);
    return record.data;
  },
};
```

---

## 初始化

```typescript
// init.ts
export async function initServices(): Promise<void> {
  if (isClient()) {
    // 未来：初始化 HTTP 客户端、认证 token 等
    return;
  }
  // server：确保 IndexedDB 就绪
  await getDB();
}
```

由 Dock Runtime 在启动阶段调用 `initServices()`。

---

## 包结构

```
domains/
└── services/
    ├── package.json            # @ikun-kit/services
    └── src/
        ├── models/
        │   ├── document.ts     # DocumentRecord, DocumentListItem
        │   └── index.ts
        ├── server/
        │   ├── db.ts           # IndexedDB 初始化与 schema
        │   └── document.ts     # IndexedDB 实现
        ├── client/
        │   └── document.ts     # HTTP API 骨架
        ├── lib/
        │   └── fetch.ts        # HTTP 客户端（预留）
        ├── document.ts         # 门面层
        ├── env.ts              # 环境检测
        ├── init.ts             # 初始化入口
        └── index.ts            # 公共导出
```
