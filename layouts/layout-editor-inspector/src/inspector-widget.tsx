import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import { WidgetLiveProvider } from '@canvix-react/toolkit-shared';
import { useCallback } from 'react';

import { InspectorWidgetContent } from './inspector-widget-content.js';

interface InspectorWidgetProps {
  ctx: PluginContext;
  widgetId: string;
  pageId: string;
}

export function InspectorWidget({
  ctx,
  widgetId,
  pageId,
}: InspectorWidgetProps) {
  const subscribeWidget = useCallback(
    (cb: () => void) =>
      ctx.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'widget' && model.id === widgetId) cb();
      }),
    [ctx.chronicle, widgetId],
  );

  return (
    <WidgetLiveProvider
      widgetId={widgetId}
      pageId={pageId}
      parentId={null}
      slotName={null}
      subscribe={subscribeWidget}
    >
      <InspectorWidgetContent ctx={ctx} widgetId={widgetId} pageId={pageId} />
    </WidgetLiveProvider>
  );
}
