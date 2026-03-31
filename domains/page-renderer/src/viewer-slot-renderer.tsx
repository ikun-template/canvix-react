/*
 * Description: Viewer-side slot renderer — renders children only, no drop zone.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import { WidgetProvider } from '@canvix-react/toolkit-shared';

import { useRenderer, useWidgetContext, WidgetCtx } from './context.js';
import { WidgetShell } from './widget-shell.js';

interface ViewerSlotRendererProps {
  slotName: string;
}

export function ViewerSlotRenderer({ slotName }: ViewerSlotRendererProps) {
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
            version: 0,
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
