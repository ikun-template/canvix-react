import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type { TempSession } from '@canvix-react/dock-editor';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { createContext, useContext } from 'react';

export type PluginMeta = { name: string; slot?: string };

export interface EditorRefContextValue {
  chronicle: Chronicle;
  registry: WidgetRegistry;
  plugins: PluginMeta[];
  update(model: OperationModel, options?: UpdateOptions): void;
  beginTemp(): TempSession;
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
