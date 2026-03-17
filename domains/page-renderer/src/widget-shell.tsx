import type { WidgetRuntime } from '@canvix-react/schema-widget';
import { useEffect, useRef } from 'react';

import { useRenderer, useWidgetContext } from './context.js';
import { WidgetContent } from './widget-content.js';

export function WidgetShell() {
  const { chronicle, page } = useRenderer();
  const { widgetId } = useWidgetContext();
  const shellRef = useRef<HTMLDivElement>(null);

  const widget = page.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  // 初始化 DOM 样式
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    applyStyles(el, widget);
  }, [widgetId]);

  // 订阅变更，精准更新 DOM style
  useEffect(() => {
    return chronicle.onUpdate(model => {
      if (model.target !== 'widget' || model.id !== widgetId) return;
      const el = shellRef.current;
      if (!el) return;

      for (const op of model.operations) {
        if (op.kind !== 'update') continue;
        const chain = op.chain;
        const key = chain[0];

        if (key === 'position' || key === 'layout') {
          applyStyles(el, widget);
        } else if (key === 'rotation') {
          el.style.transform = `rotate(${widget.rotation}deg)`;
        } else if (key === 'opacity') {
          el.style.opacity = String(widget.opacity);
        } else if (key === 'hide') {
          el.style.display = widget.hide ? 'none' : '';
        }
      }
    });
  }, [chronicle, widgetId]);

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
