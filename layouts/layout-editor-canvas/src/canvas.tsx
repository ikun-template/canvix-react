/*
 * Description: Canvas — main editing viewport with zoom, pan, and page rendering.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useEditorRef,
} from '@canvix-react/toolkit-editor';
import { PageLiveProvider } from '@canvix-react/toolkit-shared';
import { useCallback, useMemo, useRef, type PointerEvent } from 'react';

import { computeStripeBackground } from './color-contrast.js';
import { FlowDragOverlay } from './flow-drag-overlay.js';
import { useCanvasPointer } from './interactions/use-canvas-pointer.js';
import { useZoomPan } from './interactions/use-zoom-pan.js';
import { PageEditor } from './page-editor.js';
import { SelectionOverlay } from './selection-overlay.js';
import { useViewportCentering } from './use-viewport-centering.js';

export function Canvas() {
  const ref = useEditorRef();
  const {
    activePageId,
    activeTool,
    zoom,
    camera,
    flowDragWidgetId,
    interacting,
  } = useEditorLive(
    'activePageId',
    'activeTool',
    'zoom',
    'camera',
    'flowDragWidgetId',
    'interacting',
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const spaceHeldRef = useRef(false);

  // ── Data ──

  const shouldUpdate = useCallback(
    (model: OperationModel) => {
      if (model.target === 'document') return true;
      if (model.target === 'page' && model.id === activePageId) return true;
      return false;
    },
    [activePageId],
  );

  const doc = useChronicleSelective(shouldUpdate);
  const page = doc.pages.find(p => p.id === activePageId);

  // ── Viewport ──

  const { startPan } = useZoomPan({
    ref,
    canvasRef,
    spaceHeldRef,
    pageSize: page
      ? [page.layout.size?.[0] ?? 0, page.layout.size?.[1] ?? 0]
      : [0, 0],
  });

  const { viewportReadyRef } = useViewportCentering({
    ref,
    canvasRef,
    pageContainerRef,
    pageId: page?.id ?? null,
  });

  // ── Interactions ──

  const { onPointerDown } = useCanvasPointer({
    ref,
    pageId: page?.id ?? '',
    spaceHeldRef,
    startPan,
  });

  if (!page) return <div style={{ padding: 16, color: '#999' }}>No pages</div>;

  // ── Subscriptions ──

  const subscribePage = useCallback(
    (cb: () => void) =>
      ref.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'page' && model.id === page.id) {
          cb();
          return;
        }
        if (model.target === 'document') {
          const touchesPages = model.operations.some(
            op => op.chain[0] === 'pages',
          );
          if (touchesPages) cb();
        }
      }),
    [ref.chronicle, page.id],
  );

  // ── Hover detection ──

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (interacting) return;
      let target = e.target as HTMLElement | null;
      while (target && target !== e.currentTarget) {
        const widgetId = target.getAttribute('data-widget-id');
        if (widgetId) {
          ref.setHoveredWidget(widgetId);
          return;
        }
        target = target.parentElement;
      }
      ref.setHoveredWidget(null);
    },
    [ref, interacting],
  );

  const onPointerLeave = useCallback(() => {
    ref.setHoveredWidget(null);
  }, [ref]);

  // ── Derived state ──

  const isPanning = activeTool === 'hand' || spaceHeldRef.current;
  const isFlowDragging = flowDragWidgetId !== null;

  const stripeBackground = useMemo(
    () => computeStripeBackground(page.foreground || '#fff'),
    [page.foreground],
  );

  // ── Render ──

  return (
    <div
      ref={canvasRef}
      data-canvas
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: page.background,
        cursor: isPanning ? 'grab' : 'default',
      }}
      onPointerDown={onPointerDown}
    >
      <style>{`
        [data-flow-dragging] > [data-widget-id]:not([data-drag-source]) {
          transform: scale(0.95);
          transition: transform 200ms ease;
        }
      `}</style>
      <div
        ref={pageContainerRef}
        data-page-container
        {...(isFlowDragging ? { 'data-flow-dragging': '' } : {})}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{
          boxSizing: 'border-box',
          width: page.layout.size?.[0],
          height: page.layout.size?.[1],
          background: page.foreground || '#fff',
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `scale(${zoom}) translate(${-camera.x}px, ${-camera.y}px)`,
          visibility: viewportReadyRef.current ? 'visible' : 'hidden',
          display: 'flex',
          flexDirection: page.layout.direction,
          flexWrap: page.layout.wrap,
          gap: page.layout.gap,
          alignItems:
            page.layout.align === 'stretch'
              ? 'stretch'
              : `flex-${page.layout.align}`,
          justifyContent:
            (
              {
                between: 'space-between',
                around: 'space-around',
                evenly: 'space-evenly',
              } as Record<string, string>
            )[page.layout.justify] ?? `flex-${page.layout.justify}`,
          padding: page.layout.padding.map(v => `${v}px`).join(' '),
        }}
      >
        <PageLiveProvider
          key={page.id}
          pageId={page.id}
          subscribe={subscribePage}
        >
          <PageEditor />
        </PageLiveProvider>
        <SelectionOverlay pageContainerRef={pageContainerRef} />
        <FlowDragOverlay
          stripeBackground={stripeBackground}
          visible={isFlowDragging}
        />
      </div>
    </div>
  );
}
