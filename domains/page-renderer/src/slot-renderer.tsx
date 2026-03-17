import { WidgetProvider } from '@canvix-react/toolkit';

import { useRenderer, useWidgetContext, WidgetCtx } from './context.js';
import { WidgetShell } from './widget-shell.js';

interface SlotRendererProps {
  slotName: string;
}

export function SlotRenderer({ slotName }: SlotRendererProps) {
  const { page } = useRenderer();
  const { widgetId: parentId } = useWidgetContext();

  const parentWidget = page.widgets.find(w => w.id === parentId);
  if (!parentWidget) return null;

  const childIds = parentWidget.slots?.[slotName];
  if (!childIds || childIds.length === 0) return null;

  return (
    <>
      {childIds.map(childId => (
        <WidgetProvider
          key={childId}
          value={{
            widgetId: childId,
            pageId: page.id,
            parentId,
            slotName,
          }}
        >
          <WidgetCtx.Provider value={{ widgetId: childId, parentId, slotName }}>
            <WidgetShell />
          </WidgetCtx.Provider>
        </WidgetProvider>
      ))}
    </>
  );
}
