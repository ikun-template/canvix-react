import type { OperationModel } from '@canvix-react/toolkit-editor';
import { useEditorRef } from '@canvix-react/toolkit-editor';
import { WidgetLiveProvider } from '@canvix-react/toolkit-shared';
import { useCallback } from 'react';

import { InspectorWidgetContent } from './inspector-widget-content.js';

interface InspectorWidgetProps {
  widgetId: string;
  pageId: string;
}

export function InspectorWidget({ widgetId, pageId }: InspectorWidgetProps) {
  const ref = useEditorRef();

  const subscribeWidget = useCallback(
    (cb: () => void) =>
      ref.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'widget' && model.id === widgetId) cb();
      }),
    [ref.chronicle, widgetId],
  );

  return (
    <WidgetLiveProvider
      widgetId={widgetId}
      pageId={pageId}
      parentId={null}
      slotName={null}
      subscribe={subscribeWidget}
    >
      <InspectorWidgetContent widgetId={widgetId} pageId={pageId} />
    </WidgetLiveProvider>
  );
}
