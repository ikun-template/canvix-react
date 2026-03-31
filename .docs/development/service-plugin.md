# 开发手册：Service Plugin

## 定义

```typescript
import type { ServicePluginDefinition } from '@canvix-react/editor-types';

export const myServicePlugin: ServicePluginDefinition = {
  name: 'service-my-feature',
  setup(ctx) {
    // 初始化逻辑

    return {
      // 生命周期回调（全部可选）
      mount() {
        /* 挂载后 */
      },
      activate() {
        /* 激活后 */
      },
      deactivate() {
        /* 停用时 */
      },
      unmount() {
        /* 卸载时 */
      },
      destroy() {
        /* 销毁时 */
      },
    };
  },
};
```

Service Plugin 无 UI，通过 `setup()` 接收底座能力，用于注册钩子、监听事件、执行后台逻辑。

---

## 生命周期

```
setup → mount → activate ⇄ deactivate → unmount → destroy
```

| 阶段         | 时机                  | 典型用途                       |
| ------------ | --------------------- | ------------------------------ |
| `setup`      | 注册后立即调用        | 注册钩子、订阅事件、初始化状态 |
| `mount`      | 所有插件 setup 完成后 | 绑定外部资源                   |
| `activate`   | mount 完成后          | 开始响应                       |
| `deactivate` | 需要暂停时            | 暂停响应                       |
| `unmount`    | 卸载时                | 释放外部资源                   |
| `destroy`    | 应用销毁时            | 最终清理                       |

---

## 可用能力

`setup(ctx)` 的 `ctx` 提供以下能力：

### 文档数据

```typescript
setup(ctx) {
  // 读取文档
  const doc = ctx.chronicle.getDocument();
  const page = doc.pages[0];

  // 监听变更
  const unsub = ctx.chronicle.onUpdate((model) => {
    if (model.target === 'widget') {
      console.log('widget changed:', model.id);
    }
  });

  return { destroy() { unsub(); } };
}
```

### 数据变更

```typescript
// 直接变更
ctx.update({
  target: 'widget',
  pageId: 'p1',
  id: 'w1',
  operations: [
    { kind: 'update', chain: ['custom_data', 'color'], value: '#ff0000' },
  ],
});

// 草稿模式
const draft = ctx.beginDraft();
draft.update({ ... });
draft.commit();   // 或 draft.rollback()
```

### 编辑器状态

```typescript
// 读取 UI 状态
const { activePageId, selectedWidgetIds, zoom } = ctx.store.getSnapshot();

// 写入 UI 状态
ctx.store.setSelection(['w1', 'w2']);
ctx.store.setDirty(true);

// 监听状态变化
const unsub = ctx.store.onChange(() => {
  const snap = ctx.store.getSnapshot();
  // ...
});
```

### 钩子（拦截流程）

```typescript
setup(ctx) {
  // 同步钩子——监听事件
  ctx.hooks.on('operation:after', (model) => {
    // 操作完成后执行（如：自动保存计时）
  });

  // 瀑布钩子——拦截/修改数据
  ctx.hooks.on('document:beforeSave', ({ document }) => {
    // 可修改 document 后返回
    return { document: processBeforeSave(document) };
  });
}
```

可用的内置钩子：

| Hook                  | 类型      | 说明                     |
| --------------------- | --------- | ------------------------ |
| `app:ready`           | sync      | 应用启动完成             |
| `app:beforeDestroy`   | sync      | 应用即将销毁             |
| `document:loaded`     | sync      | 文档加载完成             |
| `document:beforeSave` | waterfall | 保存前（可拦截修改）     |
| `document:saved`      | sync      | 保存完成                 |
| `operation:before`    | waterfall | 操作执行前（可拦截修改） |
| `operation:after`     | sync      | 操作执行后               |
| `page:beforeSwitch`   | waterfall | 页面切换前（可拦截）     |
| `page:switched`       | sync      | 页面切换后               |

### 事件总线（跨插件通信）

```typescript
setup(ctx) {
  // 发布事件
  ctx.events.emit('my-plugin:data-ready', { count: 42 });

  // 订阅事件
  const unsub = ctx.events.on('other-plugin:notify', (data) => {
    // ...
  });

  return { destroy() { unsub(); } };
}
```

自定义事件类型通过 module augmentation 声明：

```typescript
declare module '@canvix-react/shared-types' {
  interface EventMap {
    'my-plugin:data-ready': { count: number };
  }
}
```

### 快捷键注册

```typescript
setup(ctx) {
  const unsub = ctx.shortcuts.register({
    key: 'mod+shift+e',    // mod = Ctrl(Windows) / Cmd(Mac)
    handler() {
      // 快捷键触发时执行
    },
  });

  return { destroy() { unsub(); } };
}
```

### Widget 注册表

```typescript
const allWidgets = ctx.registry.getAll();
const textDef = ctx.registry.get('text');
```

---

## 注册

Service Plugin 在 app 层声明，传给底座：

```typescript
// apps/app-editor/src/App.tsx
import { myServicePlugin } from './plugins/my-service-plugin.js';

useEditorBootstrap({
  plugins,
  widgets,
  servicePlugins: [myServicePlugin],
  config,
  saveAdapter,
});
```

---

## 适用场景

| 场景       | 示例                                   |
| ---------- | -------------------------------------- |
| 协作同步   | 监听 `operation:after`，同步操作到远端 |
| 数据校验   | 拦截 `operation:before`，校验/修正操作 |
| 分析上报   | 监听操作和页面切换，上报使用数据       |
| 自定义保存 | 拦截 `document:beforeSave`，转换格式   |
| 外部集成   | 连接第三方服务（AI、图片处理等）       |

---

## 文件结构

```
plugins/my-service-plugin/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts           # ServicePluginDefinition 导出
    └── [implementation].ts
```
