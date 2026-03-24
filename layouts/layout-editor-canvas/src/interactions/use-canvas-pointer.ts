import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import type { EditorDispatch } from '@canvix-react/toolkit-editor';
import { useCallback, useRef } from 'react';

import type { HandleDirection } from './types.js';
import { createDragMove } from './use-drag-move.js';
import { createDragResize } from './use-drag-resize.js';
import { createFlowDragMove } from './use-flow-drag.js';

interface UseCanvasPointerOptions {
  ctx: LayoutPluginContext;
  dispatch: EditorDispatch;
  pageId: string;
  spaceHeldRef: React.RefObject<boolean>;
  startPan: (e: PointerEvent) => void;
}

export function useCanvasPointer({
  ctx,
  dispatch,
  pageId,
  spaceHeldRef,
  startPan,
}: UseCanvasPointerOptions) {
  const dragMoveRef = useRef<ReturnType<typeof createDragMove> | null>(null);
  const dragResizeRef = useRef<ReturnType<typeof createDragResize> | null>(
    null,
  );
  const flowDragRef = useRef<ReturnType<typeof createFlowDragMove> | null>(
    null,
  );

  // Lazily create factories
  if (!dragMoveRef.current) dragMoveRef.current = createDragMove(ctx, dispatch);
  if (!dragResizeRef.current)
    dragResizeRef.current = createDragResize(ctx, dispatch);
  if (!flowDragRef.current)
    flowDragRef.current = createFlowDragMove(ctx, dispatch);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle primary button
      if (e.button !== 0) return;

      const nativeEvent = e.nativeEvent;
      const target = e.target as HTMLElement;

      // 1. Space held or hand tool → pan
      if (
        spaceHeldRef.current ||
        dispatch.getSnapshot().activeTool === 'hand'
      ) {
        startPan(nativeEvent);
        return;
      }

      // 2. Hit a resize handle → resize
      const handleEl = target.closest<HTMLElement>('[data-handle]');
      if (handleEl) {
        const direction = handleEl.dataset.handle as HandleDirection;
        // Find which widget this handle belongs to
        const selectionBox = handleEl.closest<HTMLElement>(
          '[data-selection-box]',
        );
        if (selectionBox) {
          const widgetId = selectionBox.dataset.selectionBox!;
          dragResizeRef.current!.start(
            nativeEvent,
            widgetId,
            direction,
            pageId,
          );
          return;
        }
      }

      // 3. Hit a widget → select + drag
      const widgetEl = target.closest<HTMLElement>('[data-widget-id]');
      if (widgetEl) {
        const widgetId = widgetEl.dataset.widgetId!;
        const currentSelection = dispatch.getSnapshot().selectedWidgetIds;

        if (e.shiftKey) {
          // Toggle selection
          const isSelected = currentSelection.includes(widgetId);
          if (isSelected) {
            dispatch.setSelection(
              currentSelection.filter(id => id !== widgetId),
            );
          } else {
            dispatch.setSelection([...currentSelection, widgetId]);
          }
        } else {
          // If widget is not in current selection, select only it
          if (!currentSelection.includes(widgetId)) {
            dispatch.setSelection([widgetId]);
          }

          // Check widget mode to dispatch drag type
          const doc = ctx.chronicle.getDocument();
          const currentPage = doc.pages.find(
            (p: { id: string }) => p.id === pageId,
          );
          const widget = currentPage?.widgets.find(
            (w: { id: string }) => w.id === widgetId,
          );

          if (widget && widget.mode !== 'absolute') {
            flowDragRef.current!.start(nativeEvent, widgetId, pageId);
          } else {
            // Start drag with all selected widgets
            const selectedIds = currentSelection.includes(widgetId)
              ? currentSelection
              : [widgetId];
            dragMoveRef.current!.start(nativeEvent, selectedIds, pageId);
          }
        }
        return;
      }

      // 4. Hit empty space → clear selection
      dispatch.setSelection([]);
    },
    [ctx, dispatch, pageId, spaceHeldRef, startPan],
  );

  return { onPointerDown };
}
