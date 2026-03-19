# 架构设计：UI 组件体系

## 概述

编辑器 UI 采用三层组件体系，自底向上分别是：基础组件、Inspector 原子组件、Inspector 属性控件。

---

## 三层结构

```
packages/ui                    ← shadcn/ui 基础组件（应用级通用）
  ↑
domains/ui-inspector           ← 基于 packages/ui 封装的紧凑版 inspector 原子组件
  ↑
domains/inspector-controls     ← inspector 面板属性编辑组件（供 widget 配置化拼装）
  ├── pi-*                     ← 原子属性控件 (property item)
  └── pg-*                     ← 复合属性控件 (property group)
```

### 依赖方向

- `inspector-controls` → `ui-inspector` → `packages/ui`
- `inspector-controls` → `widget-registry`（类型引用）

---

## packages/ui（@canvix-react/ui）

shadcn/ui 风格的基础组件，应用级通用。不含 CSS，由消费方提供 Tailwind 环境。

组件列表：Button、Input、Label、Select、Separator

---

## domains/ui-inspector（@canvix-react/ui-inspector）

基于 `packages/ui` 封装的紧凑版组件，适用于 inspector 面板（h-7、text-xs 等紧凑尺寸）。

组件列表：NumberInput、TextInput、ColorInput、SelectInput、FieldRow、FieldGroup

设计原则：

- **Thin wrapper**：仅做 className 预设和 props 收窄，不额外增加 DOM 节点
- 所有组件导出 `Props` 类型

---

## domains/inspector-controls（@canvix-react/inspector-controls）

供 widget definition 配置化拼装的属性面板组件。

### 命名规范

| 前缀  | 含义                         | 示例                                    |
| ----- | ---------------------------- | --------------------------------------- |
| `pi-` | Property Item，原子属性控件  | pi-number、pi-text、pi-color、pi-select |
| `pg-` | Property Group，复合属性控件 | pg-position、pg-size、pg-base-props     |

### 目录结构

每个 pi-_/pg-_ 组件为独立目录：

```
src/
├── pi-number/
│   ├── index.ts
│   └── pi-number.tsx
├── pg-base-props/
│   ├── index.ts
│   └── pg-base-props.tsx
└── ...
```

### Props 约定

- **pi-\*** 接收 `label` + `value` + `onChange` + 可选 `options`
- **pg-\*** 接收 `updateField: (chain, value) => void`，内部直接使用 ui-inspector 组件
- pg-\* 内部**不强制经过 pi-\***，直接使用 ui-inspector 组件以减少嵌套

### Renderer 映射机制

`renderer-map.ts` 将 `PropertyItem.renderer` 字符串映射到对应的 pi-\* 组件：

```typescript
const rendererMap = {
  number: PiNumber,
  text: PiText,
  color: PiColor,
  select: PiSelect,
};
```

`PropertyRenderer` 组件根据 `PropertyGroup[]` 配置自动选择并渲染 pi-\* 组件，用于 widget definition 声明式配置的 inspector 面板。
