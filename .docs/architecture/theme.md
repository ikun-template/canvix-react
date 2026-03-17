# 架构设计：主题系统

## 概述

基于 shadcn/ui + Tailwind CSS 的主题体系，编辑器 UI 直接使用 shadcn 的 CSS 变量和 Tailwind utility。编辑器特有的视觉元素通过 `--ed-*` 扩展层引用 shadcn 变量，自动跟随主题切换。

---

## 分层结构

```
┌─────────────────────────────────────────────┐
│  Tailwind Utility Layer                     │  ← bg-background, text-primary, ...
│  布局区域直接使用 Tailwind class            │
├─────────────────────────────────────────────┤
│  Editor Extension Layer (--ed-*)            │  ← 编辑器特有视觉元素
│  引用 shadcn 变量，自动跟随主题联动          │
├─────────────────────────────────────────────┤
│  shadcn/ui CSS Variables                    │  ← --background, --primary, ...
│  .dark 类切换 dark/light                    │
└─────────────────────────────────────────────┘
```

---

## 基础层：shadcn + Tailwind

直接使用 shadcn/ui 的主题变量体系：

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  /* ... shadcn 完整 token */
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --border: 217.2 32.6% 17.5%;
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

## 扩展层：--ed-\* 变量

编辑器特有的视觉元素（画布、网格、选中框、拖拽手柄等）不在 shadcn token 范围内，通过 `--ed-*` 前缀扩展，直接引用 shadcn 变量：

```css
:root {
  --ed-canvas-bg: hsl(var(--muted));
  --ed-grid-color: hsl(var(--border));
  --ed-selection: hsl(var(--primary));
  --ed-selection-bg: hsl(var(--primary) / 0.15);
  --ed-drag-handle: hsl(var(--accent-foreground));
  --ed-widget-outline: hsl(var(--ring));
  --ed-drop-target: hsl(var(--primary) / 0.3);
}
```

由于 `--ed-*` 引用的是 shadcn 变量，`.dark` 切换时底层变量自动变化，扩展层无需额外维护 dark 覆盖。

仅当编辑器需要与 shadcn 不同的特殊值时，才单独覆盖：

```css
.dark {
  /* 画布背景想要比 --muted 更深 */
  --ed-canvas-bg: hsl(222 20% 8%);
}
```

### 注册到 Tailwind

Tailwind v4 使用 CSS-first 配置，通过 `@theme` 指令注册 `--ed-*` 变量为 utility class：

```css
/* app.css */
@theme {
  --color-ed-canvas: var(--ed-canvas-bg);
  --color-ed-grid: var(--ed-grid-color);
  --color-ed-selection: var(--ed-selection);
}
```

```tsx
<canvas className="bg-ed-canvas" />
<div className="border-ed-selection" />
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
  /** 合并覆盖当前 --ed-* 扩展层的部分变量 */
  mergeEditorTokens(tokens: Record<string, string>): void;
}
```

- `setTheme('dark')` → 添加 `.dark` 类，shadcn + `--ed-*` 全部联动
- `setTheme('custom')` → 添加 `.dark`（若为暗色基调）+ `[data-theme="custom"]` 选择器加载额外覆盖
- 主题切换触发 `hook: theme:changed`

---

## 自定义主题

在 shadcn dark/light 基础上，支持注册额外主题：

```typescript
themeManager.registerTheme('ocean', {
  // 覆盖 shadcn 变量
  '--primary': '200 80% 50%',
  '--accent': '180 60% 40%',
  // 覆盖 --ed-* 变量
  '--ed-canvas-bg': 'hsl(200 30% 12%)',
});
```

通过 `[data-theme="ocean"]` CSS 选择器注入覆盖变量。

---

## Widget 样式隔离

- Widget 内部渲染不受编辑器主题影响，不继承 `--ed-*` 变量
- Widget 使用自身的样式体系（inline style、CSS Modules 等）
- 若 widget 需要适配 dark/light，通过 Toolkit 获取当前主题标识自行处理

---

## 包结构

```
packages/
└── theme/
    ├── package.json          # @ikun-kit/theme
    └── src/
        ├── types.ts          # ThemeManager 类型
        ├── tokens/
        │   └── editor.css    # --ed-* 扩展层变量定义
        ├── manager.ts        # ThemeManager 实现
        └── index.ts
```

theme 包职责：管理 `--ed-*` 扩展层和 ThemeManager。shadcn 基础层的变量由 shadcn 初始化时自动生成，不在此包管理范围。
