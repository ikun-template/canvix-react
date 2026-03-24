import type {
  LayoutPluginContext,
  TempSession,
} from '@canvix-react/dock-editor';
import type { EditorDispatch } from '@canvix-react/toolkit-editor';

import type { Point } from './types.js';
import { DRAG_THRESHOLD } from './types.js';

interface DragMovePending {
  origin: Point;
  widgetIds: string[];
  pageId: string;
}

interface DragMoveActive {
  origin: Point;
  initialPositions: Map<string, [number, number]>;
  session: TempSession;
  pageId: string;
  widgetIds: string[];
}

export function createDragMove(
  ctx: LayoutPluginContext,
  dispatch: EditorDispatch,
) {
  let pending: DragMovePending | null = null;
  let active: DragMoveActive | null = null;

  function start(e: PointerEvent, widgetIds: string[], pageId: string) {
    dispatch.setInteracting(true);

    pending = {
      origin: { x: e.clientX, y: e.clientY },
      widgetIds,
      pageId,
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('keydown', onKeyDown);
  }

  function activate() {
    if (!pending) return;

    const doc = ctx.chronicle.getDocument();
    const page = doc.pages.find(
      (p: { id: string }) => p.id === pending!.pageId,
    );
    if (!page) {
      cleanup();
      return;
    }

    const initialPositions = new Map<string, [number, number]>();
    for (const id of pending.widgetIds) {
      const widget = page.widgets.find((w: { id: string }) => w.id === id);
      if (widget && widget.mode === 'absolute') {
        initialPositions.set(id, [...widget.position.axis]);
      }
    }

    if (initialPositions.size === 0) {
      cleanup();
      return;
    }

    const session = ctx.beginTemp();
    dispatch.setInteracting(true);

    active = {
      origin: pending.origin,
      initialPositions,
      session,
      pageId: pending.pageId,
      widgetIds: [...initialPositions.keys()],
    };

    pending = null;
  }

  function onMove(e: PointerEvent) {
    if (pending) {
      const dx = e.clientX - pending.origin.x;
      const dy = e.clientY - pending.origin.y;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      activate();
    }

    if (!active) return;

    const zoom = dispatch.getSnapshot().zoom;
    const dx = (e.clientX - active.origin.x) / zoom;
    const dy = (e.clientY - active.origin.y) / zoom;

    for (const id of active.widgetIds) {
      const initial = active.initialPositions.get(id)!;
      active.session.update({
        target: 'widget',
        pageId: active.pageId,
        id,
        operations: [
          {
            kind: 'update',
            chain: ['position', 'axis'],
            value: [Math.round(initial[0] + dx), Math.round(initial[1] + dy)],
          },
        ],
      });
    }
  }

  function onEnd() {
    if (pending) {
      // Never exceeded threshold — just a click
      cleanup();
      return;
    }
    if (!active) return;
    active.session.commit();
    cleanup();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (active) active.session.rollback();
      cleanup();
    }
  }

  function cleanup() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('keydown', onKeyDown);
    dispatch.setInteracting(false);
    pending = null;
    active = null;
  }

  return { start };
}
