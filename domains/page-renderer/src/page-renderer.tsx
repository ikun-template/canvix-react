import type { Chronicle } from '@canvix-react/chronicle';
import type { PageRuntime } from '@canvix-react/schema-page';
import {
  DocumentProvider,
  PageProvider,
  WidgetProvider,
} from '@canvix-react/toolkit';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { useMemo } from 'react';

import { RendererCtx, WidgetCtx } from './context.js';
import { WidgetShell } from './widget-shell.js';

interface PageRendererProps {
  page: PageRuntime;
  chronicle: Chronicle;
  registry: WidgetRegistry;
  mode: 'editor' | 'viewer';
}

export function PageRenderer({
  page,
  chronicle,
  registry,
  mode,
}: PageRendererProps) {
  const docCtxValue = useMemo(
    () => ({ chronicle, document: chronicle.getDocument() }),
    [chronicle],
  );
  const pageCtxValue = useMemo(() => ({ pageId: page.id }), [page.id]);

  // 根级 widget：没有被任何 slot 引用的 widget
  const slotChildIds = new Set<string>();
  for (const w of page.widgets) {
    if (w.slots) {
      for (const ids of Object.values(w.slots)) {
        for (const id of ids) slotChildIds.add(id);
      }
    }
  }

  const rootWidgetIds = page.widgets
    .filter(w => !slotChildIds.has(w.id))
    .map(w => w.id);

  return (
    <DocumentProvider value={docCtxValue}>
      <PageProvider value={pageCtxValue}>
        <RendererCtx.Provider value={{ chronicle, registry, page, mode }}>
          {rootWidgetIds.map(id => (
            <WidgetProvider
              key={id}
              value={{
                widgetId: id,
                pageId: page.id,
                parentId: null,
                slotName: null,
              }}
            >
              <WidgetCtx.Provider value={{ widgetId: id }}>
                <WidgetShell />
              </WidgetCtx.Provider>
            </WidgetProvider>
          ))}
        </RendererCtx.Provider>
      </PageProvider>
    </DocumentProvider>
  );
}
