import { createContext, useContext } from 'react';

import type {
  EditorStateSnapshot,
  ToolType,
} from '../store/editor-state-store.js';

export interface EditorDispatch {
  setActivePage(pageId: string): void;
  setSelection(widgetIds: string[]): void;
  setHoveredWidget(id: string | null): void;
  setActiveTool(tool: ToolType): void;
  setZoom(zoom: number): void;
  setScroll(x: number, y: number): void;
  setInteracting(value: boolean): void;
  setFlowDrag(widgetId: string | null, size?: [number, number]): void;
  setFlowDropIndex(index: number | null): void;
  getSnapshot(): EditorStateSnapshot;
  onChange(listener: () => void): () => void;
}

export const EditorDispatchContext = createContext<EditorDispatch | null>(null);
EditorDispatchContext.displayName = 'EditorDispatchContext';

export function useEditorDispatch(): EditorDispatch {
  const ctx = useContext(EditorDispatchContext);
  if (!ctx)
    throw new Error(
      'useEditorDispatch must be used within an EditorLiveProvider',
    );
  return ctx;
}
