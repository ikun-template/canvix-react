import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
} from '@canvix-react/toolkit-editor';
import { PageLiveProvider } from '@canvix-react/toolkit-shared';
import { useCallback, useMemo, useRef, type PointerEvent } from 'react';

import { computeStripeBackground } from './color-contrast.js';
import { useCanvasPointer } from './interactions/use-canvas-pointer.js';
import { useZoomPan } from './interactions/use-zoom-pan.js';
import { PageEditor } from './page-editor.js';
import { SelectionOverlay } from './selection-overlay.js';

interface CanvasProps {
  ctx: PluginContext;
}

export function Canvas({ ctx }: CanvasProps) {
  const {
    activePageId,
    activeTool,
    zoom,
    scroll,
    flowDragWidgetId,
    interacting,
  } = useEditorLive();

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

  const { startPan } = useZoomPan({ ctx, canvasRef, spaceHeldRef });

  const { onPointerDown } = useCanvasPointer({
    ctx,
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
          ctx.editorState.setHoveredWidget(widgetId);
          return;
        }
        target = target.parentElement;
      }
      ctx.editorState.setHoveredWidget(null);
    },
    [ctx.editorState, interacting],
  );

  const onPointerLeave = useCallback(() => {
    ctx.editorState.setHoveredWidget(null);
  }, [ctx.editorState]);

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
          width: page.layout.size?.[0],
          height: page.layout.size?.[1],
          background: page.foreground || '#fff',
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${scroll.x}px, ${scroll.y}px) scale(${zoom})`,
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
