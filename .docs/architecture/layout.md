# 架构设计：布局系统

## 概述

编辑器 UI 划分为四个布局区域，每个区域为独立的插件模块，通过 Dock 插件机制注册挂载。区域间通过 EventBus 通信，不直接依赖。

---

## 布局区域

```
┌──────────┬─────────────────────────┬────────────┐
│          │                         │            │
│ Sidebar  │        Canvas           │ Inspector  │
│          │                         │            │
│          │                         │            │
│          ├─────────────────────────┤            │
│          │        Toolbox          │            │
└──────────┴─────────────────────────┴────────────┘
```

| 区域      | 包名                      | 职责                                  |
| --------- | ------------------------- | ------------------------------------- |
| Canvas    | `layout-editor-canvas`    | 画布渲染、widget 编排、拖拽/缩放/框选 |
| Sidebar   | `layout-editor-sidebar`   | 页面列表、图层树、资源管理            |
| Inspector | `layout-editor-inspector` | 选中对象的属性编辑面板                |
| Toolbox   | `layout-editor-toolbox`   | 可用组件列表，拖入画布添加            |

---

## 布局插件注册

每个布局区域是一个标准的 Dock 插件，通过 `PluginDefinition` 注册：

```typescript
// layout-editor-canvas/src/index.ts
const canvasPlugin: PluginDefinition = {
  name: 'layout-canvas',
  setup(ctx) {
    return {
      mount() {
        // 渲染 Canvas React 组件到挂载点
      },
      activate() {
        // 开始监听用户交互
      },
      deactivate() {
        // 暂停交互监听
      },
      unmount() {
        // 卸载 React 组件
      },
    };
  },
};
```

### 挂载点

Dock 容器在 DOM 中预留具名挂载点，布局插件在 mount 阶段将 React 组件树渲染到对应挂载点：

```html
<div id="dock-editor">
  <div data-slot="sidebar"></div>
  <div data-slot="canvas"></div>
  <div data-slot="inspector"></div>
  <div data-slot="toolbox"></div>
</div>
```

布局插件通过 `LayoutPluginContext` 获取挂载点引用，不硬编码 DOM 查询。

---

## 区域间通信

布局区域之间不直接引用，所有通信走 EventBus：

### 典型通信流

**选中 widget：**

```
Canvas: 用户点击 widget
  → events.emit('selection:changed', { widgetIds: ['w1'] })
  → Inspector: 监听，渲染 w1 的属性面板
  → Sidebar: 监听，高亮图层树中的 w1
```

**从 Toolbox 添加组件：**

```
Toolbox: 用户拖拽组件
  → events.emit('widget:dragStart', { type: 'text' })
  → Canvas: 监听，显示放置预览
  → Canvas: 用户松手
  → 调用 Toolkit: addWidget({ type: 'text', position: ... })
  → Modifier 广播 operation
  → Canvas: 响应 add-widget，渲染新组件
  → Sidebar: 响应 add-widget，更新图层树
```

**切换页面：**

```
Sidebar: 用户点击页面
  → 调用 dispatch.setActivePage('p2')
  → 触发 hook: page:switched
  → Canvas: 响应，渲染新页面的 widget 列表
  → Inspector: 响应，清空属性面板
```

---

## 容器布局管理

Dock 容器负责布局区域的空间分配：

### 面板尺寸

- Sidebar、Inspector 支持拖拽调整宽度
- Canvas 和 Toolbox 上下分布，共同占据中间区域
- Toolbox 位于 Canvas 下方

### 面板显隐

- 各区域支持折叠/展开
- 折叠状态持久化到本地存储
- 未注册的布局区域对应的挂载点不渲染，不影响其他区域

---

## 包结构

```
layouts/
├── layout-editor-canvas/
│   ├── package.json            # @ikun-kit/layout-editor-canvas
│   └── src/
│       ├── index.ts            # PluginDefinition 导出
│       ├── canvas.tsx          # Canvas 主组件
│       └── ...
├── layout-editor-sidebar/
│   ├── package.json            # @ikun-kit/layout-editor-sidebar
│   └── src/
├── layout-editor-inspector/
│   ├── package.json            # @ikun-kit/layout-editor-inspector
│   └── src/
└── layout-editor-toolbox/
    ├── package.json            # @ikun-kit/layout-editor-toolbox
    └── src/
```

每个布局包导出 `PluginDefinition`，由 Dock 的插件注册列表统一引入。
