import type { PluginContext } from '@canvix-react/dock-editor';
import { PropertyRenderer } from '@canvix-react/inspector-controls';
import { useDocumentRef, useWidgetLive } from '@canvix-react/toolkit-shared';
import { useCallback, useMemo } from 'react';

interface InspectorWidgetContentProps {
  ctx: PluginContext;
  widgetId: string;
  pageId: string;
}

export function InspectorWidgetContent({
  ctx,
  widgetId,
  pageId,
}: InspectorWidgetContentProps) {
  // version 变更驱动重渲染，确保 render() 拿到最新实例数据
  const { version } = useWidgetLive();

  const { getDocument } = useDocumentRef();
  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  if (!page) return null;

  const widget = page.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  const definition = ctx.registry.get(widget.type);

  const updateField = useCallback(
    (chain: (string | number)[], value: unknown) => {
      ctx.update({
        target: 'widget',
        pageId,
        id: widgetId,
        operations: [{ kind: 'update', chain, value }],
      });
    },
    [ctx, pageId, widgetId],
  );

  // version 作为依赖，widget 属性变更时重新计算 groups
  const groups = useMemo(
    () => definition?.inspector?.render(widget) ?? [],
    [definition, widget, version],
  );

  return (
    <div className="p-3">
      <h4 className="mb-2 text-sm font-medium">{widget.name || widget.type}</h4>
      {groups.length > 0 && (
        <PropertyRenderer
          groups={groups}
          widgetData={widget as unknown as Record<string, unknown>}
          updateField={updateField}
        />
      )}
    </div>
  );
}
