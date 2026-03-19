# 架构设计：主题系统

## 概述

基于 shadcn/ui + Tailwind CSS 的主题体系，编辑器 UI 直接使用 shadcn 的 CSS 变量和 Tailwind utility。编辑器特有的视觉元素通过 `--cvx-*` 扩展层定义独立 token，自动跟随主题切换。

---

## 分层结构

```
┌─────────────────────────────────────────────┐
│  Tailwind Utility Layer                     │  ← bg-background, text-primary, ...
│  布局区域直接使用 Tailwind class            │
├─────────────────────────────────────────────┤
│  Editor Extension Layer (--cvx-*)           │  ← 编辑器特有视觉元素
│  :root 定义 light 值，.dark 覆盖 dark 值     │
├─────────────────────────────────────────────┤
│  shadcn/ui CSS Variables                    │  ← --background, --primary, ...
│  .dark 类切换 dark/light                    │
└─────────────────────────────────────────────┘
```

---

## Token 定义模式

采用 `@theme inline` 桥接模式，确保 `.dark` 覆盖能正确生效：

```
:root        → 定义 shadcn 变量 + --cvx-* 变量（light 值）
.dark        → 覆盖所有变量（dark 值）
@theme inline → 桥接到 Tailwind：--color-background: var(--background), --color-cvx-*: var(--cvx-*)
```

**为什么用 `@theme inline` 而非 `@theme`？**

`@theme` 会将值作为静态值写入 `:root`，导致 `.dark` 选择器的覆盖被 `:root` 优先级压住。`@theme inline` 只注册 Tailwind utility 映射，不生成额外的 `:root` 规则，让 `.dark` 的变量覆盖能正常工作。

---

## 基础层：shadcn + Tailwind

直接使用 shadcn/ui 的主题变量体系（oklch 色彩空间）：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --muted: oklch(0.965 0 0);
  --border: oklch(0.922 0 0);
  /* ... shadcn 完整 token */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --border: oklch(0.269 0 0);
  /* ... */
}
```

布局区域（Sidebar / Inspector / Toolbox 等）直接使用 Tailwind utility：

```tsx
<div className="bg-background text-foreground border-border">
  <h2 className="text-sm text-muted-foreground">属性</h2>
</div>
```

主题切换 = 切换 `<html>` 上的 `.dark` 类，shadcn 组件和 Tailwind utility 自动生效。

---

## 扩展层：--cvx-\* 变量

编辑器特有的视觉元素（画布、网格、选中框、拖拽手柄等）不在 shadcn token 范围内，通过 `--cvx-*` 前缀扩展：

```css
:root {
  --cvx-canvas-bg: oklch(0.965 0 0);
  --cvx-grid: oklch(0.922 0 0);
  --cvx-selection: oklch(0.205 0 0);
  --cvx-selection-bg: oklch(0.205 0 0 / 0.15);
  --cvx-drag-handle: oklch(0.205 0 0);
  --cvx-widget-outline: oklch(0.708 0 0);
  --cvx-drop-target: oklch(0.205 0 0 / 0.3);
}

.dark {
  --cvx-canvas-bg: oklch(0.178 0 0);
  --cvx-grid: oklch(0.269 0 0);
  --cvx-selection: oklch(0.985 0 0);
  --cvx-selection-bg: oklch(0.985 0 0 / 0.15);
  --cvx-drag-handle: oklch(0.985 0 0);
  --cvx-widget-outline: oklch(0.439 0 0);
  --cvx-drop-target: oklch(0.985 0 0 / 0.3);
}
```

### 注册到 Tailwind

通过 `@theme inline` 桥接为 Tailwind utility class：

```css
@theme inline {
  --color-cvx-canvas-bg: var(--cvx-canvas-bg);
  --color-cvx-grid: var(--cvx-grid);
  --color-cvx-selection: var(--cvx-selection);
  /* ... */
}
```

```tsx
<canvas className="bg-cvx-canvas-bg" />
<div className="border-cvx-selection" />
```

---

## 运行时切换

```typescript
interface ThemeManager {
  /** 获取当前主题标识 */
  getTheme(): 'light' | 'dark' | string;
  /** 切换主题（操作 .dark 类 + 可选的自定义主题类） */
  setTheme(name: string): void;
  /** 注册自定义主题（额外的 CSS 变量覆盖） */
  registerTheme(name: string, tokens: Record<string, string>): void;
  /** 合并覆盖当前 --cvx-* 扩展层的部分变量 */
  mergeEditorTokens(tokens: Record<string, string>): void;
}
```

- `setTheme('dark')` → 添加 `.dark` 类，shadcn + `--cvx-*` 全部联动
- `setTheme('custom')` → 添加 `.dark`（若为暗色基调）+ `[data-theme="custom"]` 选择器加载额外覆盖
- 主题切换触发 `hook: theme:changed`

---

## 自定义主题

在 shadcn dark/light 基础上，支持注册额外主题：

```typescript
themeManager.registerTheme('ocean', {
  // 覆盖 shadcn 变量
  '--primary': 'oklch(0.6 0.15 240)',
  '--accent': 'oklch(0.5 0.12 180)',
  // 覆盖 --cvx-* 变量
  '--cvx-canvas-bg': 'oklch(0.12 0.02 240)',
});
```

通过 `[data-theme="ocean"]` CSS 选择器注入覆盖变量。

---

## Widget 样式隔离

- Widget 内部渲染不受编辑器主题影响，不继承 `--cvx-*` 变量
- Widget 使用自身的样式体系（inline style、CSS Modules 等）
- 若 widget 需要适配 dark/light，通过 Toolkit 获取当前主题标识自行处理

---

## 包结构

```
domains/
└── theme/
    ├── package.json          # @canvix-react/theme
    └── src/
        ├── types.ts          # ThemeManager 类型
        ├── tokens/
        │   └── editor.css    # --cvx-* 扩展层变量定义
        ├── manager.ts        # ThemeManager 实现
        └── index.ts
```

theme 包职责：管理 `--cvx-*` 扩展层和 ThemeManager。shadcn 基础层的变量由 shadcn 初始化时自动生成，不在此包管理范围。
