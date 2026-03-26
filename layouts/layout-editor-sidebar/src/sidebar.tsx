import { Plus } from '@canvix-react/icon';
import { pageDefaults } from '@canvix-react/schema-page';
import { useEditorRef, useI18n } from '@canvix-react/toolkit-editor';
import { useCallback, useRef } from 'react';

import { PageExplorer } from './page-explorer.js';
import { SaveButton } from './save-button.js';
import { SettingsButton } from './settings-button.js';
import { useResizeHandle } from './use-resize-handle.js';
import { WidgetExplorer } from './widget-explorer.js';

export function Sidebar() {
  const { t } = useI18n();
  const ref = useEditorRef();
  const containerRef = useRef<HTMLDivElement>(null);
  const { topHeight, handleProps } = useResizeHandle({ containerRef });

  const addPage = useCallback(() => {
    const doc = ref.chronicle.getDocument();
    const page = pageDefaults({ name: `Page ${doc.pages.length + 1}` });
    ref.update({
      target: 'document',
      operations: [
        {
          kind: 'array:insert',
          chain: ['pages'],
          index: doc.pages.length,
          value: page,
        },
      ],
    });
    ref.setActivePage(page.id);
  }, [ref]);

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-hidden">
      {/* Page explorer */}
      <div className="flex shrink-0 flex-col" style={{ height: topHeight }}>
        <div className="flex h-9 shrink-0 items-center justify-between px-3">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t('sidebar.pages.title')}
          </h4>
          <button
            onClick={addPage}
            className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
            title={t('sidebar.pages.add')}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <PageExplorer />
        </div>
      </div>

      {/* Resize handle */}
      <div {...handleProps} />

      {/* Widget explorer */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center px-3">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t('sidebar.widgets.title')}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <WidgetExplorer />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
        <SaveButton />
        <SettingsButton />
      </div>
    </div>
  );
}
