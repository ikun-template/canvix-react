/*
 * Description: Renders a single widget using its registered editor component.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { useEditorRef } from '@canvix-react/toolkit-editor';
import { useDocumentRef, useWidgetLive } from '@canvix-react/toolkit-shared';

export function WidgetEditor({ widgetId }: { widgetId: string }) {
  const ref = useEditorRef();
  const { pageId } = useWidgetLive();
  const { getDocument } = useDocumentRef();

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  const widget = page?.widgets.find(w => w.id === widgetId);

  if (!widget) return null;

  const definition = ref.registry.get(widget.type);
  const Component = definition?.render.editor;

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
        padding: widget.layout.padding.map(v => `${v}px`).join(' '),
      }}
    >
      {Component && <Component widget={widget} />}
    </div>
  );
}
