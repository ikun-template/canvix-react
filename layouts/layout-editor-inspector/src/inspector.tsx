import type { PluginContext } from '@canvix-react/dock-editor';
import { InspectorColorPickerProvider } from '@canvix-react/ui-inspector';
import { useSyncExternalStore } from 'react';

import { InspectorPage } from './inspector-page.js';
import { InspectorWidget } from './inspector-widget.js';

interface InspectorProps {
  ctx: PluginContext;
}

export function Inspector({ ctx }: InspectorProps) {
  const snapshot = useSyncExternalStore(
    ctx.editorState.onChange,
    ctx.editorState.getSnapshot,
  );

  const selected = snapshot.selectedWidgetIds;
  const pageId = snapshot.activePageId;

  return (
    <InspectorColorPickerProvider>
      <InspectorContent ctx={ctx} selected={selected} pageId={pageId} />
    </InspectorColorPickerProvider>
  );
}

function InspectorContent({
  ctx,
  selected,
  pageId,
}: {
  ctx: PluginContext;
  selected: string[];
  pageId: string;
}) {
  if (selected.length === 0) {
    return <InspectorPage ctx={ctx} pageId={pageId} />;
  }

  if (selected.length > 1) {
    return (
      <div className="text-muted-foreground p-3 text-sm">
        已选中 {selected.length} 个组件
      </div>
    );
  }

  return <InspectorWidget ctx={ctx} widgetId={selected[0]} pageId={pageId} />;
}
