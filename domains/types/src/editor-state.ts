/*
 * Description: Editor UI state types — tool type, state snapshot.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export type EditorToolType = 'select' | 'hand';

export interface EditorStateSnapshot {
  activePageId: string;
  selectedWidgetIds: string[];
  hoveredWidgetId: string | null;
  zoom: number;
  camera: { x: number; y: number };
  activeTool: EditorToolType;
  interacting: boolean;
  flowDragWidgetId: string | null;
  flowDropIndex: number | null;
  flowDragWidgetSize: [number, number] | null;
  /** Whether the document has unsaved changes. */
  dirty: boolean;
}

// ── Editor Store ──────────────────────────────────────────────────────────

export interface EditorStore {
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
}
