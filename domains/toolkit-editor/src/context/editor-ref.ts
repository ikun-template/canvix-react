import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type { TempSession } from '@canvix-react/dock-editor';
import type { I18nManager } from '@canvix-react/i18n';
import type { ThemeManager } from '@canvix-react/theme';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { createContext, useContext, useSyncExternalStore } from 'react';

import type {
  EditorStateSnapshot,
  ToolType,
} from '../store/editor-state-store.js';

export type PluginMeta = { name: string; slot?: string };

export interface EditorConfig {
  i18n: I18nManager;
  theme: ThemeManager;
}

export interface EditorRefContextValue {
  // 静态配置
  config: EditorConfig;

  // 数据操作
  chronicle: Chronicle;
  registry: WidgetRegistry;
  plugins: PluginMeta[];
  update(model: OperationModel, options?: UpdateOptions): void;
  beginTemp(): TempSession;

  // 编辑器 UI 状态操作（来自 EditorStateStore）
  setActivePage(pageId: string): void;
  setSelection(widgetIds: string[]): void;
  setHoveredWidget(id: string | null): void;
  setActiveTool(tool: ToolType): void;
  setZoom(zoom: number): void;
  setCamera(x: number, y: number): void;
  setInteracting(value: boolean): void;
  setFlowDrag(widgetId: string | null, size?: [number, number]): void;
  setFlowDropIndex(index: number | null): void;
  batch(fn: () => void): void;
  getSnapshot(): EditorStateSnapshot;
  onChange(listener: () => void): () => void;
}

export const EditorRefContext = createContext<EditorRefContextValue | null>(
  null,
);
EditorRefContext.displayName = 'EditorRefContext';

export const EditorRefProvider = EditorRefContext.Provider;

export function useEditorRef(): EditorRefContextValue {
  const ctx = useContext(EditorRefContext);
  if (!ctx)
    throw new Error('useEditorRef must be used within an EditorRefProvider');
  return ctx;
}

export function useI18n() {
  const { config } = useEditorRef();
  const { i18n } = config;

  const locale = useSyncExternalStore(
    cb => i18n.onChange(cb),
    () => i18n.getLocale(),
  );

  return {
    t: i18n.t,
    locale,
    setLocale: i18n.setLocale,
    supportedLocales: i18n.getSupportedLocales(),
  };
}

export function useTheme() {
  const { config } = useEditorRef();
  const { theme } = config;

  const currentTheme = useSyncExternalStore(
    cb => theme.onChange(cb),
    () => theme.getTheme(),
  );

  return {
    theme: currentTheme,
    setTheme: theme.setTheme,
  };
}
