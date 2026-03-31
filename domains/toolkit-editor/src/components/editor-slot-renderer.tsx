/*
 * Description: Editor-side slot renderer — renders slot children with drop zone placeholder.
 *              Uses editor hooks (useEditorRef, useDocumentRef, useWidgetLive).
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type { OperationModel } from '@canvix-react/chronicle';
import type { WidgetRuntime } from '@canvix-react/schema-widget';
import {
  useDocumentRef,
  useWidgetLive,
  WidgetLiveProvider,
} from '@canvix-react/toolkit-shared';
import { memo, useCallback } from 'react';

import { useEditorRef } from '../context/editor-ref.js';

interface EditorSlotRendererProps {
  slotName: string;
}

export function EditorSlotRenderer({ slotName }: EditorSlotRendererProps) {
  const ref = useEditorRef();
  const { widgetId: parentId, pageId } = useWidgetLive();
  const { getDocument } = useDocumentRef();

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  const parentWidget = page?.widgets.find(w => w.id === parentId);
  if (!parentWidget) return null;

  const definition = ref.registry.get(parentWidget.type);
  const slotDef = definition?.slots?.find(s => s.name === slotName);
  const label = slotDef?.label ?? slotName;

  const childIds = parentWidget.slots?.[slotName] ?? [];

  return (
    <div data-slot-zone="" data-slot-name={slotName} data-owner-id={parentId}>
      {childIds.map(childId => {
        const childWidget = page?.widgets.find(w => w.id === childId);
        if (!childWidget) return null;

        return (
          <SlotChildWrapper
            key={childId}
            widget={childWidget}
            pageId={pageId}
            parentId={parentId}
            slotName={slotName}
          />
        );
      })}

      {childIds.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 40,
            border: '1px dashed currentColor',
            borderRadius: 4,
            opacity: 0.4,
            fontSize: 12,
            padding: '8px 12px',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── Slot child wrapper ───────────────────────────────────────────────────────

const SlotChildWrapper = memo(function SlotChildWrapper({
  widget,
  pageId,
  parentId,
  slotName,
}: {
  widget: WidgetRuntime;
  pageId: string;
  parentId: string;
  slotName: string;
}) {
  const ref = useEditorRef();

  const subscribeWidget = useCallback(
    (cb: () => void) =>
      ref.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'widget' && model.id === widget.id) cb();
      }),
    [ref.chronicle, widget.id],
  );

  return (
    <WidgetLiveProvider
      widgetId={widget.id}
      pageId={pageId}
      parentId={parentId}
      slotName={slotName}
      subscribe={subscribeWidget}
    >
      <SlotChildRenderer widgetId={widget.id} />
    </WidgetLiveProvider>
  );
});

// ── Slot child renderer (mirrors WidgetEditor logic) ─────────────────────────

function SlotChildRenderer({ widgetId }: { widgetId: string }) {
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
