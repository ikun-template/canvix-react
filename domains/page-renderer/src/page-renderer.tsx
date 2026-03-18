import type { PageRuntime } from '@canvix-react/schema-page';
import {
  DocumentRefProvider,
  PageProvider,
  WidgetProvider,
  type DocumentRefContextValue,
} from '@canvix-react/toolkit-shared';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { useMemo } from 'react';

import {
  RendererCtx,
  WidgetCtx,
  type SubscribeWidgetUpdates,
} from './context.js';
import { WidgetShell } from './widget-shell.js';

interface PageRendererProps {
  page: PageRuntime;
  document: DocumentRefContextValue;
  registry: WidgetRegistry;
  mode: 'editor' | 'viewer';
  subscribeWidgetUpdates?: SubscribeWidgetUpdates;
}

export function PageRenderer({
  page,
  document: docCtxValue,
  registry,
  mode,
  subscribeWidgetUpdates,
}: PageRendererProps) {
  const pageCtxValue = useMemo(
    () => ({
      pageId: page.id,
      name: page.name,
      layout: page.layout,
      background: page.background,
      widgetIds: page.widgets.map(w => w.id),
      version: 0,
    }),
    [page],
  );

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
    <DocumentRefProvider value={docCtxValue}>
      <PageProvider value={pageCtxValue}>
        <RendererCtx.Provider
          value={{ registry, page, mode, subscribeWidgetUpdates }}
        >
          {rootWidgetIds.map(id => (
            <WidgetProvider
              key={id}
              value={{
                widgetId: id,
                pageId: page.id,
                parentId: null,
                slotName: null,
                version: 0,
              }}
            >
              <WidgetCtx.Provider value={{ widgetId: id }}>
                <WidgetShell />
              </WidgetCtx.Provider>
            </WidgetProvider>
          ))}
        </RendererCtx.Provider>
      </PageProvider>
    </DocumentRefProvider>
  );
}
