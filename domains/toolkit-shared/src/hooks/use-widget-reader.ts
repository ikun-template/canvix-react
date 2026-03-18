import type { WidgetRuntime } from '@canvix-react/schema-widget';

import { useDocumentRef } from '../context/document-ref.js';
import { useWidget } from '../context/widget-live.js';

export function useWidgetReader() {
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
  };
}
