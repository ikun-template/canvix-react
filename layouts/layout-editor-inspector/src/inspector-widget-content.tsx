import { PropertyRenderer } from '@canvix-react/inspector-controls';
import { useEditorRef } from '@canvix-react/toolkit-editor';
import { useDocumentRef, useWidgetLive } from '@canvix-react/toolkit-shared';
import { useCallback, useMemo } from 'react';

interface InspectorWidgetContentProps {
  widgetId: string;
  pageId: string;
}

export function InspectorWidgetContent({
  widgetId,
  pageId,
}: InspectorWidgetContentProps) {
  const ref = useEditorRef();

  // version 变更驱动重渲染，确保 render() 拿到最新实例数据
  const { version } = useWidgetLive();

  const { getDocument } = useDocumentRef();
  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);
  if (!page) return null;

  const widget = page.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  const definition = ref.registry.get(widget.type);

  const updateField = useCallback(
    (chain: (string | number)[], value: unknown) => {
      ref.update({
        target: 'widget',
        pageId,
        id: widgetId,
        operations: [{ kind: 'update', chain, value }],
      });
    },
    [ref, pageId, widgetId],
  );

  // version 作为依赖，widget 属性变更时重新计算 groups
  const groups = useMemo(
    () => definition?.inspector?.properties?.(widget) ?? [],
    [definition, widget, version],
  );

  const Icon = definition?.meta.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex h-9 shrink-0 items-center gap-2 border-b px-3">
        {Icon && <Icon size={14} className="text-muted-foreground" />}
        <span className="text-sm font-medium">
          {widget.name || widget.type}
        </span>
        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
          {widget.type}
        </span>
      </div>
      <div className="overflow-y-auto px-3 py-2">
        {groups.length > 0 && (
          <PropertyRenderer
            groups={groups}
            widgetData={widget as unknown as Record<string, unknown>}
            updateField={updateField}
          />
        )}
      </div>
    </div>
  );
}
