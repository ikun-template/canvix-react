import type { PluginContext } from '@canvix-react/dock-editor';

import type { Point } from './types.js';
import { DRAG_THRESHOLD } from './types.js';

interface FlowDragPending {
  origin: Point;
  widgetId: string;
  pageId: string;
}

interface FlowDragActive {
  origin: Point;
  widgetId: string;
  pageId: string;
  originalIndex: number;
  initialLeft: number;
  initialTop: number;
  width: number;
  height: number;
  widgetEl: HTMLElement;
  pageContainer: HTMLElement;
  originalStyle: {
    position: string;
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: string;
    pointerEvents: string;
  };
}

export function createFlowDragMove(ctx: PluginContext) {
  let pending: FlowDragPending | null = null;
  let active: FlowDragActive | null = null;

  function start(e: PointerEvent, widgetId: string, pageId: string) {
    ctx.editorState.setInteracting(true);

    pending = {
      origin: { x: e.clientX, y: e.clientY },
      widgetId,
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

    const widgetEl = document.querySelector<HTMLElement>(
      `[data-widget-id="${pending.widgetId}"]`,
    );
    const pageContainer = document.querySelector<HTMLElement>(
      '[data-page-container]',
    );
    if (!widgetEl || !pageContainer) {
      cleanup();
      return;
    }

    const originalIndex = page.widgets.findIndex(
      (w: { id: string }) => w.id === pending!.widgetId,
    );
    if (originalIndex === -1) {
      cleanup();
      return;
    }

    const initialLeft = widgetEl.offsetLeft;
    const initialTop = widgetEl.offsetTop;
    const width = widgetEl.offsetWidth;
    const height = widgetEl.offsetHeight;

    const originalStyle = {
      position: widgetEl.style.position,
      left: widgetEl.style.left,
      top: widgetEl.style.top,
      width: widgetEl.style.width,
      height: widgetEl.style.height,
      zIndex: widgetEl.style.zIndex,
      pointerEvents: widgetEl.style.pointerEvents,
    };

    widgetEl.style.position = 'absolute';
    widgetEl.style.left = `${initialLeft}px`;
    widgetEl.style.top = `${initialTop}px`;
    widgetEl.style.width = `${width}px`;
    widgetEl.style.height = `${height}px`;
    widgetEl.style.zIndex = '9999';
    widgetEl.style.pointerEvents = 'none';
    widgetEl.setAttribute('data-drag-source', '');

    ctx.editorState.setFlowDrag(pending.widgetId, [width, height]);
    ctx.editorState.setFlowDropIndex(originalIndex);
    ctx.editorState.setInteracting(true);

    active = {
      origin: pending.origin,
      widgetId: pending.widgetId,
      pageId: pending.pageId,
      originalIndex,
      initialLeft,
      initialTop,
      width,
      height,
      widgetEl,
      pageContainer,
      originalStyle,
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

    const zoom = ctx.editorState.zoom;
    const dx = (e.clientX - active.origin.x) / zoom;
    const dy = (e.clientY - active.origin.y) / zoom;

    active.widgetEl.style.left = `${active.initialLeft + dx}px`;
    active.widgetEl.style.top = `${active.initialTop + dy}px`;

    const dropIndex = computeDropIndex(e, active);
    ctx.editorState.setFlowDropIndex(dropIndex);
  }

  function computeDropIndex(e: PointerEvent, s: FlowDragActive): number {
    const doc = ctx.chronicle.getDocument();
    const page = doc.pages.find((p: { id: string }) => p.id === s.pageId);
    if (!page) return s.originalIndex;

    // Build set of slot children
    const slotChildIds = new Set<string>();
    for (const w of page.widgets) {
      if (w.slots) {
        for (const ids of Object.values(w.slots)) {
          for (const id of ids) slotChildIds.add(id);
        }
      }
    }

    // Get flow elements (excluding drag source)
    const flowEls = Array.from(
      s.pageContainer.querySelectorAll<HTMLElement>(
        '[data-widget-id]:not([data-drag-source])',
      ),
    );

    // Convert pointer to page-container coordinates
    const containerRect = s.pageContainer.getBoundingClientRect();
    const zoom = ctx.editorState.zoom;
    const pointerY = (e.clientY - containerRect.top) / zoom;

    // Find visual insertion index among flow elements
    let visualIndex = flowEls.length;
    for (let i = 0; i < flowEls.length; i++) {
      const el = flowEls[i];
      const midY = el.offsetTop + el.offsetHeight / 2;
      if (pointerY < midY) {
        visualIndex = i;
        break;
      }
    }

    // Map visual index to page.widgets full array index
    // Build ordered list of root widget indices (excluding dragged widget)
    const rootIndices: number[] = [];
    for (let i = 0; i < page.widgets.length; i++) {
      const w = page.widgets[i];
      if (w.id !== s.widgetId && !slotChildIds.has(w.id)) {
        rootIndices.push(i);
      }
    }

    if (visualIndex >= rootIndices.length) {
      // Insert after the last root widget
      const lastRootIdx = rootIndices[rootIndices.length - 1];
      return lastRootIdx !== undefined ? lastRootIdx + 1 : s.originalIndex;
    }

    return rootIndices[visualIndex];
  }

  function onEnd() {
    if (pending) {
      cleanup();
      return;
    }
    if (!active) return;

    const dropIndex = ctx.editorState.getSnapshot().flowDropIndex;

    if (dropIndex !== null && dropIndex !== active.originalIndex) {
      // Adjust target index for array move semantics:
      // If moving forward, the target index shifts down by 1 after removal
      const from = active.originalIndex;
      const to = dropIndex > from ? dropIndex - 1 : dropIndex;

      if (from !== to) {
        ctx.update({
          target: 'page',
          id: active.pageId,
          operations: [{ kind: 'move', chain: ['widgets'], from, to }],
        });
      }
    }

    cleanup();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function cleanup() {
    if (active) {
      const s = active;

      // Restore original styles
      s.widgetEl.style.position = s.originalStyle.position;
      s.widgetEl.style.left = s.originalStyle.left;
      s.widgetEl.style.top = s.originalStyle.top;
      s.widgetEl.style.width = s.originalStyle.width;
      s.widgetEl.style.height = s.originalStyle.height;
      s.widgetEl.style.zIndex = s.originalStyle.zIndex;
      s.widgetEl.style.pointerEvents = s.originalStyle.pointerEvents;
      s.widgetEl.removeAttribute('data-drag-source');

      ctx.editorState.setFlowDrag(null);
    }

    ctx.editorState.setInteracting(false);

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('keydown', onKeyDown);

    pending = null;
    active = null;
  }

  return { start };
}
