import type { WidgetRuntime } from '@canvix-react/schema-widget';
import { useEffect, useRef } from 'react';

import { useRenderer, useWidgetContext } from './context.js';
import { WidgetContent } from './widget-content.js';

export function WidgetShell() {
  const { page, subscribeWidgetUpdates } = useRenderer();
  const { widgetId } = useWidgetContext();
  const shellRef = useRef<HTMLDivElement>(null);

  const widget = page.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    applyStyles(el, widget);
  }, [widgetId]);

  useEffect(() => {
    if (!subscribeWidgetUpdates) return;
    return subscribeWidgetUpdates(updatedWidgetId => {
      if (updatedWidgetId !== widgetId) return;
      const el = shellRef.current;
      if (!el) return;
      applyStyles(el, widget);
    });
  }, [subscribeWidgetUpdates, widgetId]);

  return (
    <div
      ref={shellRef}
      data-widget-id={widgetId}
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
      <WidgetContent widget={widget} />
    </div>
  );
}

function applyStyles(el: HTMLElement, widget: WidgetRuntime) {
  if (widget.mode === 'absolute') {
    el.style.position = 'absolute';
    el.style.left = `${widget.position.axis[0]}px`;
    el.style.top = `${widget.position.axis[1]}px`;
  } else {
    el.style.position = 'relative';
    el.style.left = '';
    el.style.top = '';
  }
  el.style.width = `${widget.layout.size[0]}px`;
  el.style.height = `${widget.layout.size[1]}px`;
}
