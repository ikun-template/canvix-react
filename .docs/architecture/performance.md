# 架构设计：性能

## 核心目标

编辑器场景下大量 widget 共存，必须保证：单个 widget 变更 → 最小 DOM 操作，不波及无关组件。

---

## 组件级隔离

### 列表层不订阅数据

Page Renderer 的 widget 列表仅维护 id 数组，map 渲染时只传递 `widgetId`（通过 Context），不传递 widget 数据：

```tsx
{
  widgetIds.map(id => (
    <WidgetProvider key={id} widgetId={id}>
      <WidgetShell />
    </WidgetProvider>
  ));
}
```

- widget 字段变更 → 列表层不感知 → 不触发列表 re-render
- 集合变更（add/delete/move）→ 列表层响应 → 仅增删 key，React diff 复用已有实例

### Context 值稳定

Context 只传递 id（字符串），在组件挂载期间不变。不会因数据变更触发 Context 消费者 re-render。

### Widget 自订阅

每个 WidgetShell 独立订阅 Modifier 广播，过滤出自身 id 的 Operation 后才响应。其他 widget 的变更对自身完全无感。

---

## 字段级精准更新

WidgetShell 对通用 schema 字段按更新频率分为两类处理：

### 高频字段 → 直接 DOM 操作

拖拽、缩放、旋转等交互中持续触发的属性变更，绕过 React reconciliation：

| 字段            | DOM 操作                                                |
| --------------- | ------------------------------------------------------- |
| `position.axis` | `style.left` / `style.top`（或 `transform: translate`） |
| `layout.size`   | `style.width` / `style.height`                          |
| `rotation`      | `transform: rotate`                                     |
| `opacity`       | `style.opacity`                                         |
| `hide`          | `style.display`                                         |

通过 `ref` 持有 DOM 引用，在 Modifier 订阅回调中直接赋值：

```typescript
modifier.onUpdate(ops => {
  // ... 过滤出自身 widget 的 update 操作
  if (hasFieldChanged(myOps, ['position', 'axis'])) {
    const [x, y] = getWidget().position.axis;
    shellRef.current.style.left = `${x}px`;
    shellRef.current.style.top = `${y}px`;
  }
});
```

### 低频字段 → React 状态更新

`mode`、`custom_data` 等不频繁变更的字段，走正常 React 状态更新触发 re-render。只影响当前 widget 子树，不波及外部。

---

## 挂载调度

### 空闲队列

大量 widget 首次渲染时通过 `requestIdleCallback` 分批挂载，避免长帧阻塞：

```typescript
class IdleQueue {
  private queue: (() => void)[] = [];

  enqueue(task: () => void) {
    this.queue.push(task);
    this.schedule();
  }

  private schedule() {
    requestIdleCallback(deadline => {
      while (this.queue.length > 0 && deadline.timeRemaining() > 0) {
        this.queue.shift()!();
      }
      if (this.queue.length > 0) this.schedule();
    });
  }
}
```

### 视口优先

优先挂载视口内可见的 widget，视口外的 widget 延后挂载：

1. 根据 Canvas 当前 scroll 位置和 zoom 计算可见区域
2. 将 widget 按是否在可见区域内分为两组
3. 可见组立即进入空闲队列（高优先），不可见组追加在后

---

## 数据只读保护

对外暴露的 Schema 数据通过 `Object.freeze` 或 `Proxy` 包装为只读：

- Toolkit 的 `getDocument()` / `getPage()` / `getWidget()` 返回只读引用
- 开发环境下写入只读对象抛出错误，便于排查
- 生产环境可省略 Proxy 开销，直接返回原始引用（因为变更只能通过 Modifier 入口）

---

## 按需加载

### 组件模块懒加载

注册表中的组件渲染实现支持 `lazy` 形式：

```typescript
const definition: WidgetDefinition = {
  type: 'chart',
  render: {
    editor: lazy(() => import('./editor')),
    viewer: lazy(() => import('./viewer')),
  },
  // ...
};
```

未使用的组件类型不参与首屏 bundle。首次渲染时动态加载，配合 `Suspense` 显示 loading 状态。

### 并发控制

当页面包含多种未加载的组件类型时，并发 import 数量通过信号量控制，防止同时发起过多请求：

```typescript
class Semaphore {
  constructor(private max: number) {}
  async acquire(): Promise<() => void>;
}

// 限制最大并发加载数
const loadSemaphore = new Semaphore(3);
```

---

## 性能策略总览

| 场景            | 策略                     | 效果                 |
| --------------- | ------------------------ | -------------------- |
| widget 字段变更 | 自订阅 + chain 过滤      | 仅目标 widget 响应   |
| 高频属性变更    | 直接 DOM 操作            | 绕过 React diff      |
| widget 列表变更 | 列表层只维护 id          | 不触发子组件数据更新 |
| 首次大量挂载    | requestIdleCallback 队列 | 不阻塞主线程         |
| 视口外 widget   | 延迟挂载                 | 减少首屏渲染量       |
| 数据保护        | 只读代理                 | 防止意外修改         |
| 未使用组件      | lazy + Suspense          | 不参与首屏 bundle    |
| 并发加载        | 信号量控制               | 防止网络拥塞         |
