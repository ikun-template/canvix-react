import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useEditorRef,
} from '@canvix-react/toolkit-editor';
import { PageLiveProvider } from '@canvix-react/toolkit-shared';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent,
} from 'react';

import { computeStripeBackground } from './color-contrast.js';
import { useCanvasPointer } from './interactions/use-canvas-pointer.js';
import { useZoomPan } from './interactions/use-zoom-pan.js';
import { PageEditor } from './page-editor.js';
import { SelectionOverlay } from './selection-overlay.js';

interface CanvasProps {
  ctx: LayoutPluginContext;
}

export function Canvas({ ctx }: CanvasProps) {
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

  const { startPan } = useZoomPan({
    ref,
    canvasRef,
    spaceHeldRef,
    pageSize: page
      ? [page.layout.size?.[0] ?? 0, page.layout.size?.[1] ?? 0]
      : [0, 0],
  });

  // Center page in viewport when canvas gets valid size or page switches
  const viewportReadyRef = useRef(false);
  const centeredPageIdRef = useRef<string | null>(null);

  const pageId = page?.id ?? null;
  if (pageId !== centeredPageIdRef.current) {
    viewportReadyRef.current = false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width: vw, height: vh } = entry.contentRect;
      if (vw === 0 || vh === 0) return;
      observer.disconnect();

      const pageEl = pageContainerRef.current;
      if (!pageEl) return;
      const { zoom: currentZoom } = ref.getSnapshot();

      viewportReadyRef.current = true;
      centeredPageIdRef.current = page.id;
      // Camera = world-space coord of viewport top-left
      const pageW = pageEl.offsetWidth;
      const pageH = pageEl.offsetHeight;
      const cameraX = pageW / 2 - vw / (2 * currentZoom);
      const cameraY = pageH / 2 - vh / (2 * currentZoom);
      ref.setCamera(cameraX, cameraY);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [pageId, ref]);

  const { onPointerDown } = useCanvasPointer({
    ctx,
    ref,
    pageId: page?.id ?? '',
    spaceHeldRef,
    startPan,
  });

  if (!page) return <div style={{ padding: 16, color: '#999' }}>No pages</div>;

  const subscribePage = useCallback(
    (cb: () => void) =>
      ctx.chronicle.onUpdate((model: OperationModel) => {
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
    [ctx.chronicle, page.id],
  );

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

  const isPanning = activeTool === 'hand' || spaceHeldRef.current;
  const cursor = isPanning ? 'grab' : 'default';
  const isFlowDragging = flowDragWidgetId !== null;

  const pageFg = page.foreground || '#fff';
  const stripeBackground = useMemo(
    () => computeStripeBackground(pageFg),
    [pageFg],
  );

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
        cursor,
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
          <PageEditor ctx={ctx} registry={ctx.registry} />
        </PageLiveProvider>
        <SelectionOverlay pageContainerRef={pageContainerRef} />
        {/* Flow drag dimming overlay with diagonal stripes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: stripeBackground,
            backgroundRepeat: 'repeat',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: isFlowDragging ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
        />
      </div>
    </div>
  );
}
