import type { WidgetRuntime } from '@canvix-react/schema-widget';

import { useDocument } from '../context/document.js';
import { useWidget } from '../context/widget.js';

export function useWidgetToolkit() {
  const { document } = useDocument();
  const { widgetId, pageId } = useWidget();

  return {
    getWidget(): Readonly<WidgetRuntime> {
      const page = document.pages.find(p => p.id === pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      const widget = page.widgets.find(w => w.id === widgetId);
      if (!widget) throw new Error(`Widget not found: ${widgetId}`);
      return widget;
    },
  };
}
