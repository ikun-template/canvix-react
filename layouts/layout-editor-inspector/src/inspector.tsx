/*
 * Description: Inspector panel — shows page or widget properties based on selection.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { useEditorLive, useI18n } from '@canvix-react/toolkit-editor';
import { InspectorColorPickerProvider } from '@canvix-react/ui-inspector';

import { InspectorPage } from './inspector-page.js';
import { InspectorWidget } from './inspector-widget.js';

export function Inspector() {
  const { t } = useI18n();
  const { selectedWidgetIds: selected, activePageId: pageId } = useEditorLive(
    'selectedWidgetIds',
    'activePageId',
  );

  let content: React.ReactNode;

  if (selected.length === 0) {
    content = <InspectorPage pageId={pageId} />;
  } else if (selected.length > 1) {
    content = (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 text-sm">
        <span className="text-2xl">⬡</span>
        <span>
          {t('inspector.multi-selection', { count: selected.length })}
        </span>
      </div>
    );
  } else {
    content = <InspectorWidget widgetId={selected[0]} pageId={pageId} />;
  }

  return <InspectorColorPickerProvider>{content}</InspectorColorPickerProvider>;
}
