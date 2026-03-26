/*
 * Description: EditorRefContext — stable editor reference for imperative operations.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type {
  DraftSession,
  EditorConfig,
  EditorStateSnapshot,
  EditorToolType,
  LayoutPluginDefinition,
  WidgetRegistry,
} from '@canvix-react/editor-types';
import { createContext, useContext, useSyncExternalStore } from 'react';

export interface EditorRefContextValue {
  // 静态配置
  config: EditorConfig;

  // 数据操作
  chronicle: Chronicle;
  registry: WidgetRegistry;
  plugins: Pick<LayoutPluginDefinition, 'name' | 'slot'>[];
  update(model: OperationModel, options?: UpdateOptions): void;
  beginDraft(): DraftSession;

  // 编辑器 UI 状态操作（来自 EditorStateStore）
  setActivePage(pageId: string): void;
  setSelection(widgetIds: string[]): void;
  setHoveredWidget(id: string | null): void;
  setActiveTool(tool: EditorToolType): void;
  setZoom(zoom: number): void;
  setCamera(x: number, y: number): void;
  setInteracting(value: boolean): void;
  setFlowDrag(widgetId: string | null, size?: [number, number]): void;
  setFlowDropIndex(index: number | null): void;
  setDirty(value: boolean): void;
  batch(fn: () => void): void;
  getSnapshot(): EditorStateSnapshot;
  onChange(listener: () => void): () => void;

  /** Save the document. Returns a promise that resolves when save completes. */
  save(): Promise<void>;
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
