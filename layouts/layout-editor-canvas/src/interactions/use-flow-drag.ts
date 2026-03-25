import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import type { EditorRefContextValue } from '@canvix-react/toolkit-editor';

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

export function createFlowDragMove(
  ctx: LayoutPluginContext,
  ref: EditorRefContextValue,
) {
  let pending: FlowDragPending | null = null;
  let active: FlowDragActive | null = null;

  function start(e: PointerEvent, widgetId: string, pageId: string) {
    ref.setInteracting(true);

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

    ref.setFlowDrag(pending.widgetId, [width, height]);
    ref.setFlowDropIndex(originalIndex);
    ref.setInteracting(true);

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

    const zoom = ref.getSnapshot().zoom;
    const dx = (e.clientX - active.origin.x) / zoom;
    const dy = (e.clientY - active.origin.y) / zoom;

    active.widgetEl.style.left = `${active.initialLeft + dx}px`;
    active.widgetEl.style.top = `${active.initialTop + dy}px`;

    const dropIndex = computeDropIndex(e, active);
    ref.setFlowDropIndex(dropIndex);
  }

  function computeDropIndex(e: PointerEvent, s: FlowDragActive): number {
    const doc = ctx.chronicle.getDocument();
    const page = doc.pages.find((p: { id: string }) => p.id === s.pageId);
    if (!page) return s.originalIndex;

    const isRow = page.layout.direction === 'row';

    // Build set of slot children
    const slotChildIds = new Set<string>();
    for (const w of page.widgets) {
      if (w.slots) {
        for (const ids of Object.values(w.slots)) {
          for (const id of ids) slotChildIds.add(id);
        }
      }
    }

    // ── Step 1: Remove old placeholder from flex flow ──
    // This gives us stable element positions unaffected by the placeholder.
    // display:none → read positions → display:'' happens within one JS task,
    // so the browser won't paint the hidden state.
    const placeholderEl = s.pageContainer.querySelector<HTMLElement>(
      '[data-flow-placeholder]',
    );
    if (placeholderEl) placeholderEl.style.display = 'none';

    // ── Step 2: Snapshot + compute ──
    const flowEls = Array.from(
      s.pageContainer.querySelectorAll<HTMLElement>(
        '[data-widget-id]:not([data-drag-source])',
      ),
    );

    const containerRect = s.pageContainer.getBoundingClientRect();
    const zoom = ref.getSnapshot().zoom;
    const pointerX = (e.clientX - containerRect.left) / zoom;
    const pointerY = (e.clientY - containerRect.top) / zoom;

    // Group elements into lines by cross-axis position
    const lines: HTMLElement[][] = [];
    let currentLine: HTMLElement[] = [];
    let currentCross = -Infinity;
    for (const el of flowEls) {
      const cross = isRow ? el.offsetTop : el.offsetLeft;
      if (currentLine.length === 0 || Math.abs(cross - currentCross) < 2) {
        currentLine.push(el);
        currentCross = cross;
      } else {
        lines.push(currentLine);
        currentLine = [el];
        currentCross = cross;
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    // Find which line the pointer is in
    const pointerCross = isRow ? pointerY : pointerX;
    let targetLine = lines[lines.length - 1] ?? [];
    let lineStartIndex = 0;
    let accumulated = 0;
    for (const line of lines) {
      const firstEl = line[0];
      const lastEl = line[line.length - 1];
      const crossStart = isRow ? firstEl.offsetTop : firstEl.offsetLeft;
      const crossEnd = isRow
        ? lastEl.offsetTop + lastEl.offsetHeight
        : lastEl.offsetLeft + lastEl.offsetWidth;
      const crossMid = (crossStart + crossEnd) / 2;
      if (pointerCross < crossMid) {
        targetLine = line;
        lineStartIndex = accumulated;
        break;
      }
      accumulated += line.length;
      lineStartIndex = accumulated;
      targetLine = line;
    }

    // Find insertion point within the target line
    const pointerMain = isRow ? pointerX : pointerY;
    let inLineIndex = targetLine.length;
    for (let i = 0; i < targetLine.length; i++) {
      const el = targetLine[i];
      const mid = isRow
        ? el.offsetLeft + el.offsetWidth / 2
        : el.offsetTop + el.offsetHeight / 2;
      if (pointerMain < mid) {
        inLineIndex = i;
        break;
      }
    }

    // ── Step 3: Restore placeholder ──
    if (placeholderEl) placeholderEl.style.display = '';

    const visualIndex = lineStartIndex + inLineIndex;

    // Map visual index to page.widgets full array index
    const rootIndices: number[] = [];
    for (let i = 0; i < page.widgets.length; i++) {
      const w = page.widgets[i];
      if (w.id !== s.widgetId && !slotChildIds.has(w.id)) {
        rootIndices.push(i);
      }
    }

    if (visualIndex >= rootIndices.length) {
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

    const dropIndex = ref.getSnapshot().flowDropIndex;

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

      ref.setFlowDrag(null);
    }

    ref.setInteracting(false);

    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('keydown', onKeyDown);

    pending = null;
    active = null;
  }

  return { start };
}
