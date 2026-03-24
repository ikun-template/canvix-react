import type { ToolType } from '@canvix-react/dock-editor';
import { createContext, useContext } from 'react';

export interface EditorLiveContextValue {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  activeTool: ToolType;
  interacting: boolean;
  zoom: number;
  scroll: { x: number; y: number };
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
}

export const EditorLiveContext = createContext<EditorLiveContextValue | null>(
  null,
);
EditorLiveContext.displayName = 'EditorLiveContext';

export function useEditorLive(): EditorLiveContextValue {
  const ctx = useContext(EditorLiveContext);
  if (!ctx)
    throw new Error('useEditorLive must be used within an EditorLiveProvider');
  return ctx;
}
