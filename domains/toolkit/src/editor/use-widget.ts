import type { WidgetRuntime, WidgetRaw } from '@canvix-react/schema-widget';

import { useDocument } from '../context/document.js';
import { useWidget } from '../context/widget.js';

export function useWidgetToolkit() {
  const { chronicle, document } = useDocument();
  const { widgetId, pageId } = useWidget();

  return {
    getWidget(): Readonly<WidgetRuntime> {
      const page = document.pages.find(p => p.id === pageId);
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
      // 1. Add widget to page's widgets array
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'add', chain: ['widgets'], value: widget }],
      });
      // 2. Add widget id to slot array
      const wId = widget.id;
      if (wId) {
        const page = document.pages.find(p => p.id === pageId);
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
      // 1. Find index and remove widget id from slot array
      const page = document.pages.find(p => p.id === pageId);
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
      // 2. Remove widget from page's widgets array
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
