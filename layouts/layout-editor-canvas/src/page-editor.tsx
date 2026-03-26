/*
 * Description: Page editor — renders root widgets with flow drag placeholders.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { useEditorLive, useEditorRef } from '@canvix-react/toolkit-editor';
import { usePageLive, useDocumentRef } from '@canvix-react/toolkit-shared';
import { useMemo } from 'react';

import { computePlaceholderColor } from './color-contrast.js';
import { FlowDropPlaceholder } from './flow-drop-placeholder.js';
import { WidgetEditorWrapper } from './widget-editor-wrapper.js';

export function PageEditor() {
  const ref = useEditorRef();
  const { pageId, widgetIds } = usePageLive();
  const { getDocument } = useDocumentRef();
  const { flowDragWidgetId, flowDropIndex, flowDragWidgetSize } = useEditorLive(
    'flowDragWidgetId',
    'flowDropIndex',
    'flowDragWidgetSize',
  );

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);

  const pageFg = page?.foreground || '#fff';
  const placeholderColor = useMemo(
    () => computePlaceholderColor(pageFg),
    [pageFg],
  );

  if (!page) return null;

  // ── Collect slot children to find root widgets ──

  const slotChildIds = new Set<string>();
  for (const w of page.widgets) {
    if (w.slots) {
      for (const ids of Object.values(w.slots)) {
        for (const id of ids) slotChildIds.add(id);
      }
    }
  }

  const rootWidgetIds = widgetIds.filter(id => !slotChildIds.has(id));

  // ── Flow drag state ──

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

  const nonDragRootCount = isFlowDragging
    ? rootWidgetIds.filter(id => id !== flowDragWidgetId).length
    : rootWidgetIds.length;

  // ── Build render elements ──

  const elements: React.ReactNode[] = [];
  let visualIdx = 0;
  for (const wId of rootWidgetIds) {
    const isDragTarget = wId === flowDragWidgetId;

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
        chronicle={ref.chronicle}
      />,
    );

    if (!isDragTarget) visualIdx++;
  }

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
