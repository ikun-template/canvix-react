/*
 * Description: Wraps a single widget in WidgetLiveProvider with chronicle subscription.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { OperationModel } from '@canvix-react/toolkit-editor';
import { WidgetLiveProvider } from '@canvix-react/toolkit-shared';
import { memo, useCallback } from 'react';

import { WidgetEditor } from './widget-editor.js';

export const WidgetEditorWrapper = memo(function WidgetEditorWrapper({
  widgetId,
  pageId,
  chronicle,
}: {
  widgetId: string;
  pageId: string;
  chronicle: { onUpdate: (cb: (model: OperationModel) => void) => () => void };
}) {
  const subscribeWidget = useCallback(
    (cb: () => void) =>
      chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'widget' && model.id === widgetId) cb();
      }),
    [chronicle, widgetId],
  );

  return (
    <WidgetLiveProvider
      widgetId={widgetId}
      pageId={pageId}
      parentId={null}
      slotName={null}
      subscribe={subscribeWidget}
    >
      <WidgetEditor widgetId={widgetId} />
    </WidgetLiveProvider>
  );
});
