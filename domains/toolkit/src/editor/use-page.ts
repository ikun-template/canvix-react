import type { PageRuntime } from '@canvix-react/schema-page';
import type { WidgetRaw } from '@canvix-react/schema-widget';

import { useDocument } from '../context/document.js';
import { usePage } from '../context/page.js';

export function usePageToolkit() {
  const { chronicle, document } = useDocument();
  const { pageId } = usePage();

  return {
    getPage(): Readonly<PageRuntime> {
      const page = document.pages.find(p => p.id === pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      return page;
    },

    update(data: { chain: (string | number)[]; value: unknown }[]) {
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: data.map(d => ({
          kind: 'update' as const,
          chain: d.chain,
          value: d.value,
        })),
      });
    },

    addWidget(widget: WidgetRaw) {
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'add', chain: ['widgets'], value: widget }],
      });
    },

    deleteWidget(_widgetId: string) {
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'delete', chain: ['widgets'] }],
      });
    },

    moveWidget(widgetId: string, to: number) {
      const page = document.pages.find(p => p.id === pageId);
      if (!page) return;
      const from = page.widgets.findIndex(w => w.id === widgetId);
      if (from < 0) return;
      chronicle.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'move', chain: ['widgets'], from, to }],
      });
    },
  };
}
