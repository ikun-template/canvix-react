# Editor Template — 需求总览

> 提供一套可复用的可视化编辑器模板，实现文档/页面/组件三级实例的 Schema 驱动渲染与高性能编辑体验。

---

## 需求文档索引

| 文档                                     | 说明                           |
| ---------------------------------------- | ------------------------------ |
| [数据模型](./data-model.md)              | 三级实例结构与 Schema 定义     |
| [Schema 驱动渲染](./schema-rendering.md) | 渲染原则与变更传播             |
| [实例上下文](./instance-context.md)      | 三级实例的上下文层级与 Toolkit |
| [变更与历史](./operation-history.md)     | Operation 模型与 undo/redo     |
| [Dock 底座](./dock-plugin.md)            | 容器运行时与插件机制           |
| [组件注册](./widget-registry.md)         | 内置组件的注册与管理           |
| [布局系统](./layout.md)                  | 四区布局与模块化               |
| [性能](./performance.md)                 | 渲染性能与资源调度             |
| [序列化](./serialization.md)             | 持久化与剪贴板                 |
| [主题](./theme.md)                       | 主题切换与变量体系             |
| [国际化](./i18n.md)                      | 多语言资源管理与按应用导出     |
| [接口服务](./services.md)                | Services 层与客户端/服务端分离 |

---

## 技术栈

| 项      | 选型                      |
| ------- | ------------------------- |
| UI 框架 | React 19 + React Compiler |
| 构建    | Vite (rolldown)           |
| 包管理  | pnpm workspace            |
| 类型    | TypeScript strict mode    |

---

## 工程结构

```
editor-template/
├── apps/
│   ├── app-editor              # 编辑器 SPA
│   └── app-viewer              # 只读查看器
├── packages/                   # 基础能力包
├── schemas/                    # 三级 Schema 定义
│   ├── document/
│   ├── page/
│   └── widget/
├── domains/
│   ├── toolkit/                # Toolkit（editor/viewer 双导出）
│   ├── page-renderer/          # Page 渲染引擎（editor/viewer 共用）
│   ├── services/               # 接口服务（client/server 双实现）
│   ├── widgets/                # 内置组件集合
│   └── locales/                # 多语言资源（按应用导出）
├── layouts/                    # 布局区域模块
│   ├── layout-editor-canvas/
│   ├── layout-editor-sidebar/
│   ├── layout-editor-inspector/
│   └── layout-editor-toolbox/
├── docks/
│   ├── dock-editor/            # 编辑器底座
│   └── dock-viewer/            # 查看器底座
└── docs/
    ├── requirements/
    ├── architecture/
    └── todo/
```
