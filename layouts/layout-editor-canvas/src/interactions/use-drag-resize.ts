import type { PluginContext, TempSession } from '@canvix-react/dock-editor';

import type { HandleDirection } from './types.js';
import { DRAG_THRESHOLD, MIN_WIDGET_SIZE } from './types.js';

/**
 * Resize factor table: how handle direction maps delta to position/size changes.
 *
 * | Handle | dx→x | dy→y | dx→w | dy→h |
 * |--------|------|------|------|------|
 * | nw     | +1   | +1   | -1   | -1   |
 * | n      |  0   | +1   |  0   | -1   |
 * | ne     |  0   | +1   | +1   | -1   |
 * | e      |  0   |  0   | +1   |  0   |
 * | se     |  0   |  0   | +1   | +1   |
 * | s      |  0   |  0   |  0   | +1   |
 * | sw     | +1   |  0   | -1   | +1   |
 * | w      | +1   |  0   | -1   |  0   |
 */
const RESIZE_FACTORS: Record<
  HandleDirection,
  [number, number, number, number]
> = {
  nw: [1, 1, -1, -1],
  n: [0, 1, 0, -1],
  ne: [0, 1, 1, -1],
  e: [0, 0, 1, 0],
  se: [0, 0, 1, 1],
  s: [0, 0, 0, 1],
  sw: [1, 0, -1, 1],
  w: [1, 0, -1, 0],
};

interface DragResizePending {
  originX: number;
  originY: number;
  widgetId: string;
  handle: HandleDirection;
  pageId: string;
}

interface DragResizeActive {
  originX: number;
  originY: number;
  initialX: number;
  initialY: number;
  initialW: number;
  initialH: number;
  factors: [number, number, number, number];
  session: TempSession;
  pageId: string;
  widgetId: string;
  isAbsolute: boolean;
}

export function createDragResize(ctx: PluginContext) {
  let pending: DragResizePending | null = null;
  let active: DragResizeActive | null = null;

  function start(
    e: PointerEvent,
    widgetId: string,
    handle: HandleDirection,
    pageId: string,
  ) {
    ctx.editorState.setInteracting(true);

    pending = {
      originX: e.clientX,
      originY: e.clientY,
      widgetId,
      handle,
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

    const widget = page.widgets.find(
      (w: { id: string }) => w.id === pending!.widgetId,
    );
    if (!widget) {
      cleanup();
      return;
    }

    const isAbsolute = widget.mode === 'absolute';
    const session = ctx.beginTemp();
    ctx.editorState.setInteracting(true);

    active = {
      originX: pending.originX,
      originY: pending.originY,
      initialX: isAbsolute ? widget.position.axis[0] : 0,
      initialY: isAbsolute ? widget.position.axis[1] : 0,
      initialW: widget.layout.size[0],
      initialH: widget.layout.size[1],
      factors: RESIZE_FACTORS[pending.handle],
      session,
      pageId: pending.pageId,
      widgetId: pending.widgetId,
      isAbsolute,
    };

    pending = null;
  }

  function onMove(e: PointerEvent) {
    if (pending) {
      const dx = e.clientX - pending.originX;
      const dy = e.clientY - pending.originY;
      if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
      activate();
    }

    if (!active) return;

    const zoom = ctx.editorState.zoom;
    const dx = (e.clientX - active.originX) / zoom;
    const dy = (e.clientY - active.originY) / zoom;
    const [fx, fy, fw, fh] = active.factors;

    let newW = Math.round(active.initialW + fw * dx);
    let newH = Math.round(active.initialH + fh * dy);
    let newX = Math.round(active.initialX + fx * dx);
    let newY = Math.round(active.initialY + fy * dy);

    // Enforce minimum size, fixing the opposite edge
    if (newW < MIN_WIDGET_SIZE) {
      const overflow = MIN_WIDGET_SIZE - newW;
      newW = MIN_WIDGET_SIZE;
      if (fx !== 0) newX -= overflow * Math.sign(fx);
    }
    if (newH < MIN_WIDGET_SIZE) {
      const overflow = MIN_WIDGET_SIZE - newH;
      newH = MIN_WIDGET_SIZE;
      if (fy !== 0) newY -= overflow * Math.sign(fy);
    }

    const operations = [
      {
        kind: 'update' as const,
        chain: ['layout', 'size'],
        value: [newW, newH],
      },
    ];
    if (active.isAbsolute) {
      operations.push({
        kind: 'update' as const,
        chain: ['position', 'axis'],
        value: [newX, newY],
      });
    }
    active.session.update({
      target: 'widget',
      pageId: active.pageId,
      id: active.widgetId,
      operations,
    });
  }

  function onEnd() {
    if (pending) {
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
    ctx.editorState.setInteracting(false);
    pending = null;
    active = null;
  }

  return { start };
}
