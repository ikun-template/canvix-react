# Canvas Editor Template (React)

基于 React 19 的画布类可视化编辑器模板，采用 Schema 驱动渲染架构，提供三级数据模型（Document → Page → Widget）、插件化布局系统和完整的编辑操作链路。

## 技术栈

| 类别   | 技术                 |
| ------ | -------------------- |
| 框架   | React 19             |
| 构建   | Vite (rolldown-vite) |
| 语言   | TypeScript 5.9       |
| 包管理 | pnpm workspace       |
| Lint   | oxlint / oxfmt       |

## 项目结构

```
├── apps/             # 应用入口
├── docks/            # Dock 插件（编辑器/查看器运行时）
├── domains/          # 业务领域逻辑
├── layouts/          # 编辑器布局区域
├── packages/         # 基础工具包
└── schemas/          # 三级数据 Schema
```

## 核心概念

| 概念                 | 说明                                                      | 所在包              |
| -------------------- | --------------------------------------------------------- | ------------------- |
| **Schema**           | 三级数据模型 Document → Page → Widget，描述编辑器内容结构 | `schemas/*`         |
| **Modifier**         | 变更引擎，执行 Operation 并生成逆操作，驱动 undo/redo     | `packages/modifier` |
| **Dock**             | 零业务逻辑的运行时容器，管理插件生命周期和 Hook 系统      | `docks/*`           |
| **Layout**           | 编辑器四大布局区域：Canvas、Sidebar、Inspector、Toolbox   | `layouts/*`         |
| **Widget Registry**  | 组件注册中心，定义渲染、属性面板、默认数据和插槽声明      | TBD                 |
| **Schema Rendering** | UI = f(schema)，Operation → Modifier → 广播 → 渲染响应    | TBD                 |
| **Services**         | 数据接口门面，按运行环境分发到 Client/Server 实现         | `packages/config`   |
| **DeepPartial**      | 通用类型工具，自动派生存储用的可缺省类型                  | `packages/types`    |

## Schema 类型体系

每个 Schema 包提供两种类型：

| 类型         | 用途                                             | 示例                                              |
| ------------ | ------------------------------------------------ | ------------------------------------------------- |
| `XxxRuntime` | 运行时完整类型，所有字段必填，直接使用           | `WidgetRuntime`, `PageRuntime`, `DocumentRuntime` |
| `XxxRaw`     | 存储/传输类型，字段可缺省，由 `DeepPartial` 派生 | `WidgetRaw`, `PageRaw`, `DocumentRaw`             |

`xxxDefaults(input?: XxxRaw): XxxRuntime` — 传入可缺省数据，返回完整运行时对象。

## Workspace 包一览

| 包名                            | 路径                 | 说明                                          |
| ------------------------------- | -------------------- | --------------------------------------------- |
| `@canvix-react/schema-widget`   | `schemas/widget`     | Widget 数据定义 + 默认值 + 迁移               |
| `@canvix-react/schema-page`     | `schemas/page`       | Page 数据定义                                 |
| `@canvix-react/schema-document` | `schemas/document`   | Document 数据定义                             |
| `@canvix-react/chronicle`       | `packages/chronicle` | 变更引擎（Operation / History / undo / redo） |
| `@canvix-react/types`           | `packages/types`     | 通用类型工具（DeepPartial 等）                |
| `@ikun-kit/config`              | `packages/config`    | 配置管理（YAML，支持 Node/Browser）           |
| `app-editor`                    | `apps/app-editor`    | 编辑器应用入口                                |
| `app-viewer`                    | `apps/app-viewer`    | 查看器应用入口                                |
