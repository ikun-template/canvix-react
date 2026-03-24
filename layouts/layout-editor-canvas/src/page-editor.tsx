import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import { useEditorLive } from '@canvix-react/toolkit-editor';
import {
  WidgetLiveProvider,
  usePageLive,
  useWidgetLive,
  useDocumentRef,
} from '@canvix-react/toolkit-shared';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { useCallback, useMemo } from 'react';

import { computePlaceholderColor } from './color-contrast.js';

interface PageEditorProps {
  ctx: PluginContext;
  registry: WidgetRegistry;
}

export function PageEditor({ ctx, registry }: PageEditorProps) {
  const { pageId, widgetIds } = usePageLive();
  const { getDocument } = useDocumentRef();
  const { flowDragWidgetId, flowDropIndex, flowDragWidgetSize } =
    useEditorLive();

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  if (!page) return null;

  const slotChildIds = new Set<string>();
  for (const w of page.widgets) {
    if (w.slots) {
      for (const ids of Object.values(w.slots)) {
        for (const id of ids) slotChildIds.add(id);
      }
    }
  }

  const rootWidgetIds = widgetIds.filter(id => !slotChildIds.has(id));

  const pageFg = page.foreground || '#fff';
  const placeholderColor = useMemo(
    () => computePlaceholderColor(pageFg),
    [pageFg],
  );

  // During flow drag, the dragged widget is kept in the render tree
  // (so its React component stays mounted and visible on the ghost).
  // use-flow-drag.ts sets it to position:absolute via DOM, so it won't
  // occupy flow space. We insert a placeholder at the drop position.
  const isFlowDragging = flowDragWidgetId !== null;

  // Compute visual drop index among root widgets (excluding dragged one)
  let visualDropIndex: number | null = null;
  if (isFlowDragging && flowDropIndex !== null) {
    let count = 0;
    for (const w of page.widgets) {
      if (w.id === flowDragWidgetId || slotChildIds.has(w.id)) continue;
      const fullIdx = page.widgets.indexOf(w);
      if (fullIdx >= flowDropIndex) break;
      count++;
    }
    visualDropIndex = count;
  }

  // Count non-dragged root widgets for "placeholder at end" check
  const nonDragRootCount = isFlowDragging
    ? rootWidgetIds.filter(id => id !== flowDragWidgetId).length
    : rootWidgetIds.length;

  const elements: React.ReactNode[] = [];
  let visualIdx = 0;
  for (const wId of rootWidgetIds) {
    const isDragTarget = wId === flowDragWidgetId;

    // Insert placeholder before this visual position (skip dragged widget in counting)
    if (!isDragTarget && visualDropIndex === visualIdx) {
      elements.push(
        <FlowDropPlaceholder
          key="__flow-drop-placeholder"
          size={flowDragWidgetSize}
          color={placeholderColor}
        />,
      );
    }

    elements.push(
      <WidgetEditorWrapper
        key={wId}
        widgetId={wId}
        pageId={pageId}
        ctx={ctx}
        registry={registry}
      />,
    );

    if (!isDragTarget) visualIdx++;
  }
  // Placeholder at the end
  if (visualDropIndex !== null && visualDropIndex >= nonDragRootCount) {
    elements.push(
      <FlowDropPlaceholder
        key="__flow-drop-placeholder"
        size={flowDragWidgetSize}
        color={placeholderColor}
      />,
    );
  }

  return <>{elements}</>;
}

function FlowDropPlaceholder({
  size,
  color,
}: {
  size: [number, number] | null;
  color: string;
}) {
  return (
    <div
      style={{
        width: size?.[0] ?? 100,
        height: size?.[1] ?? 40,
        background: color,
        borderRadius: 8,
        transition: 'all 200ms ease',
      }}
    />
  );
}

function WidgetEditorWrapper({
  widgetId,
  pageId,
  ctx,
  registry,
}: {
  widgetId: string;
  pageId: string;
  ctx: PluginContext;
  registry: WidgetRegistry;
}) {
  const subscribeWidget = useCallback(
    (cb: () => void) =>
      ctx.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'widget' && model.id === widgetId) cb();
      }),
    [ctx.chronicle, widgetId],
  );

  return (
    <WidgetLiveProvider
      widgetId={widgetId}
      pageId={pageId}
      parentId={null}
      slotName={null}
      subscribe={subscribeWidget}
    >
      <WidgetEditor widgetId={widgetId} registry={registry} />
    </WidgetLiveProvider>
  );
}

function WidgetEditor({
  widgetId,
  registry,
}: {
  widgetId: string;
  registry: WidgetRegistry;
}) {
  useWidgetLive();

  const { getDocument } = useDocumentRef();
  const { pageId } = usePageLive();

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  const widget = page?.widgets.find(w => w.id === widgetId);

  if (!widget) return null;

  const definition = registry.get(widget.type);
  const Component = definition?.render.editor;

  console.debug('[mine] widget render effect', String(widgetId));

  return (
    <div
      data-widget-id={widget.id}
      style={{
        position: widget.mode === 'absolute' ? 'absolute' : 'relative',
        left: widget.mode === 'absolute' ? widget.position.axis[0] : undefined,
        top: widget.mode === 'absolute' ? widget.position.axis[1] : undefined,
        width: widget.layout.size[0],
        height: widget.layout.size[1],
        transform: widget.rotation
          ? `rotate(${widget.rotation}deg)`
          : undefined,
        opacity: widget.opacity,
        display: widget.hide ? 'none' : undefined,
      }}
    >
      {Component && <Component data={widget.custom_data} />}
    </div>
  );
}
