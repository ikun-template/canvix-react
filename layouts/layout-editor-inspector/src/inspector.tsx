import type { PluginContext } from '@canvix-react/dock-editor';
import { useEditorLive, useI18n } from '@canvix-react/toolkit-editor';
import { InspectorColorPickerProvider } from '@canvix-react/ui-inspector';

import { InspectorPage } from './inspector-page.js';
import { InspectorWidget } from './inspector-widget.js';

interface InspectorProps {
  ctx: PluginContext;
}

export function Inspector({ ctx }: InspectorProps) {
  const { selectedWidgetIds: selected, activePageId: pageId } = useEditorLive();

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

  const { t } = useI18n();

  if (selected.length > 1) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 text-sm">
        <span className="text-2xl">⬡</span>
        <span>
          {t('inspector.multi-selection', { count: selected.length })}
        </span>
      </div>
    );
  }

  return <InspectorWidget ctx={ctx} widgetId={selected[0]} pageId={pageId} />;
}
