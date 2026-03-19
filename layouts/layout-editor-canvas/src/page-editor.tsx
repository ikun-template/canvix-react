import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  WidgetLiveProvider,
  usePageLive,
  useWidgetLive,
  useDocumentRef,
} from '@canvix-react/toolkit-shared';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { useCallback } from 'react';

interface PageEditorProps {
  ctx: PluginContext;
  registry: WidgetRegistry;
}

export function PageEditor({ ctx, registry }: PageEditorProps) {
  const { pageId, widgetIds } = usePageLive();
  const { getDocument } = useDocumentRef();

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

  return (
    <>
      {rootWidgetIds.map(wId => (
        <WidgetEditorWrapper
          key={wId}
          widgetId={wId}
          pageId={pageId}
          ctx={ctx}
          registry={registry}
        />
      ))}
    </>
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
