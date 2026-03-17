# 架构设计：Dock 底座与插件机制

## 定位

Dock 是编辑器/查看器的运行底座，零业务逻辑。职责三件事：

1. 应用容器——入口初始化、布局挂载点
2. 插件机制——注册、生命周期管理
3. Runtime 钩子——业务逻辑的执行切面

所有业务功能由插件（layouts）实现。

---

## Runtime

Runtime 是 Dock 内部的运行时中枢，在应用启动时创建，贯穿整个应用生命周期。

### 职责

```
Runtime
  ├── PluginManager      ← 插件注册、生命周期调度
  ├── HookSystem         ← 运行时钩子注册与触发
  ├── Modifier           ← Schema 变更引擎（实例化并持有）
  ├── EditorState        ← 编辑状态管理（activePage, selection 等）
  └── EventBus           ← 插件间通信总线
```

### 启动流程

```
1. 创建 Runtime 实例
   │
2. 初始化核心服务（Modifier, EditorState, EventBus, HookSystem）
   │
3. 注册插件（静态注册列表）
   │
4. 按注册顺序执行插件生命周期：setup → mount → activate
   │
6. 触发 hook: app:ready
   │
7. 应用就绪
```

### 销毁流程

```
1. 触发 hook: app:beforeDestroy
   │
2. 按注册逆序执行插件生命周期：deactivate → unmount → destroy
   │
3. 销毁核心服务
   │
4. Runtime 实例释放
```

---

## 插件机制

### 插件定义

```typescript
interface PluginDefinition {
  /** 唯一标识 */
  name: string;
  /** 生命周期钩子 */
  setup(ctx: PluginContext): PluginInstance | Promise<PluginInstance>;
}

interface PluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}
```

- `setup` 是插件的入口函数，接收 `PluginContext`，返回生命周期实例
- `setup` 阶段可访问 Runtime 提供的能力（注册钩子、订阅事件、读写状态）
- 返回的 `PluginInstance` 各方法由 Runtime 在对应阶段调用

### PluginContext

插件在 `setup` 中获得的能力上下文：

```typescript
interface PluginContext {
  /** 运行时钩子 */
  hooks: HookSystem;
  /** 事件总线 */
  events: EventBus;
  /** Schema 变更引擎 */
  modifier: Modifier;
  /** 编辑状态 */
  editorState: EditorState;
}
```

> PluginContext 是 Runtime 向插件暴露的受限接口。插件不持有 Runtime 引用，只能通过 PluginContext 操作。

### 生命周期

```
registered → setup → mounted → active ⇄ inactive → unmounted → destroyed
```

| 阶段       | 时机         | 说明                                     |
| ---------- | ------------ | ---------------------------------------- |
| setup      | 注册后       | 初始化插件，注册钩子/事件，返回实例      |
| mount      | setup 完成后 | 挂载 DOM、绑定事件                       |
| activate   | mount 完成后 | 激活，开始响应用户交互                   |
| deactivate | 停用时       | 暂停响应（如切换页面导致某些插件不可见） |
| unmount    | 卸载时       | 移除 DOM、解绑事件                       |
| destroy    | 应用销毁时   | 清理所有资源                             |

### 执行顺序

- 插件按注册顺序依次执行 setup → mount → activate
- 销毁时按注册逆序执行 deactivate → unmount → destroy
- 当前阶段不做依赖管理，通过注册顺序保证初始化次序即可。后续若需外部插件开发，可扩展 dependencies 声明

---

## 钩子系统（HookSystem）

### 钩子类型

钩子分为两类：

- **同步钩子（SyncHook）**：顺序执行所有监听器
- **瀑布钩子（WaterfallHook）**：上一个监听器的返回值作为下一个的输入，支持拦截/修改

### 内置钩子

```typescript
interface BuiltinHooks {
  // 应用级
  'app:ready': SyncHook<void>;
  'app:beforeDestroy': SyncHook<void>;

  // 文档级
  'document:loaded': SyncHook<{ document: Document }>;
  'document:beforeSave': WaterfallHook<{ document: Document }>;
  'document:saved': SyncHook<void>;
  'document:beforeClose': SyncHook<void>;

  // 变更级
  'operation:before': WaterfallHook<{ operations: OperationModel[] }>;
  'operation:after': SyncHook<{ operations: OperationModel[] }>;

  // 视图级
  'page:beforeSwitch': WaterfallHook<{ from: string; to: string }>;
  'page:switched': SyncHook<{ pageId: string }>;
}
```

### 使用方式

```typescript
// 插件中注册钩子
setup(ctx) {
  // 监听变更后
  ctx.hooks.on('operation:after', ({ operations }) => {
    // 如：自动保存、同步状态
  });

  // 拦截保存前的数据
  ctx.hooks.on('document:beforeSave', ({ document }) => {
    // 可修改 document 后返回
    return { document: processBeforeSave(document) };
  });
}
```

### 自定义钩子

插件可注册自定义钩子，供其他插件监听：

```typescript
setup(ctx) {
  // 注册自定义钩子
  ctx.hooks.register('canvas:selectionChanged', SyncHook);

  // 其他插件监听
  ctx.hooks.on('canvas:selectionChanged', (data) => { /* ... */ });
}
```

---

## 事件总线（EventBus）

用于插件间的松耦合通信，与钩子系统的区别：

|          | HookSystem                | EventBus       |
| -------- | ------------------------- | -------------- |
| 触发方   | Runtime（生命周期时机）   | 任意插件       |
| 用途     | 切面拦截、流程控制        | 插件间消息传递 |
| 支持拦截 | Waterfall 钩子可拦截/修改 | 不支持         |

```typescript
// 发布
ctx.events.emit('sidebar:pageSelected', { pageId: 'p1' });

// 订阅
ctx.events.on('sidebar:pageSelected', ({ pageId }) => {
  /* ... */
});
```

EventBus 类型安全，事件名和 payload 类型由插件通过 module augmentation 扩展：

```typescript
declare module '@ikun-kit/toolkit' {
  interface EventMap {
    'sidebar:pageSelected': { pageId: string };
  }
}
```

---

## Dock 应用结构

```
docks/
├── dock-editor/
│   ├── package.json
│   └── src/
│       ├── runtime/
│       │   ├── index.ts           # Runtime 类
│       │   ├── plugin-manager.ts  # 插件注册、生命周期调度
│       │   ├── hook-system.ts     # 钩子注册与触发
│       │   ├── event-bus.ts       # 类型安全事件总线
│       │   └── editor-state.ts    # 编辑状态管理
│       ├── plugins.ts             # 静态插件注册列表
│       └── main.ts                # 应用入口，创建 Runtime 并启动
└── dock-viewer/
    └── src/                       # 同上结构，但无 editor-state、插件列表不同
```

dock-editor 和 dock-viewer 各自独立的 Runtime 实例，加载不同的插件集合。viewer 的 Runtime 不包含 EditorState、不注册变更相关钩子。
