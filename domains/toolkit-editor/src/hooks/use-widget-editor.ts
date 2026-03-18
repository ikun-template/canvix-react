import type { WidgetRuntime, WidgetRaw } from '@canvix-react/schema-widget';
import { useDocumentRef, useWidget } from '@canvix-react/toolkit-shared';

import { useEditor } from '../context/editor.js';

export function useWidgetEditor() {
  const { chronicle } = useEditor();
  const { getDocument } = useDocumentRef();
  const { widgetId, pageId } = useWidget();

  return {
    getWidget(): Readonly<WidgetRuntime> {
      const doc = getDocument();
      const page = doc.pages.find(p => p.id === pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      const widget = page.widgets.find(w => w.id === widgetId);
      if (!widget) throw new Error(`Widget not found: ${widgetId}`);
      return widget;
    },

    update(data: { chain: (string | number)[]; value: unknown }[]) {
      chronicle.update({
        target: 'widget',
        pageId,
        id: widgetId,
        operations: data.map(d => ({
          kind: 'update' as const,
          chain: d.chain,
          value: d.value,
        })),
      });
    },

    addToSlot(slotName: string, widget: WidgetRaw) {
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'add', chain: ['widgets'], value: widget }],
      });
      const wId = widget.id;
      if (wId) {
        const doc = getDocument();
        const page = doc.pages.find(p => p.id === pageId);
        const parent = page?.widgets.find(w => w.id === widgetId);
        const slotArr = parent?.slots?.[slotName];
        const idx = slotArr ? slotArr.length : 0;
        chronicle.update(
          {
            target: 'widget',
            pageId,
            id: widgetId,
            operations: [
              {
                kind: 'array:insert',
                chain: ['slots', slotName],
                index: idx,
                value: wId,
              },
            ],
          },
          { memorize: false },
        );
      }
    },

    removeFromSlot(slotName: string, targetWidgetId: string) {
      const doc = getDocument();
      const page = doc.pages.find(p => p.id === pageId);
      const parent = page?.widgets.find(w => w.id === widgetId);
      const slotArr = parent?.slots?.[slotName];
      const idx = slotArr?.indexOf(targetWidgetId) ?? -1;
      if (idx >= 0) {
        chronicle.update({
          target: 'widget',
          pageId,
          id: widgetId,
          operations: [
            { kind: 'array:remove', chain: ['slots', slotName], index: idx },
          ],
        });
      }
      chronicle.update(
        {
          target: 'page',
          id: pageId,
          operations: [{ kind: 'delete', chain: ['widgets'] }],
        },
        { memorize: false },
      );
    },
  };
}
