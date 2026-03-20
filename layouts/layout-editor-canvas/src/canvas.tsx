import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorState,
} from '@canvix-react/toolkit-editor';
import { PageLiveProvider } from '@canvix-react/toolkit-shared';
import { useCallback } from 'react';

import { PageEditor } from './page-editor.js';

interface CanvasProps {
  ctx: PluginContext;
}

export function Canvas({ ctx }: CanvasProps) {
  const snapshot = useEditorState(ctx.editorState);

  const activePageId = snapshot.activePageId;

  const shouldUpdate = useCallback(
    (model: OperationModel) => {
      if (model.target === 'document') return true;
      if (model.target === 'page' && model.id === activePageId) return true;
      return false;
    },
    [activePageId],
  );

  const doc = useChronicleSelective(shouldUpdate);
  const page = doc.pages.find(p => p.id === activePageId);

  if (!page) return <div style={{ padding: 16, color: '#999' }}>No pages</div>;

  const subscribePage = useCallback(
    (cb: () => void) =>
      ctx.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'page' && model.id === page.id) {
          cb();
          return;
        }
        if (model.target === 'document') {
          const touchesPages = model.operations.some(
            op => op.chain[0] === 'pages',
          );
          if (touchesPages) cb();
        }
      }),
    [ctx.chronicle, page.id],
  );

  function handleClick(e: React.MouseEvent) {
    const widgetEl = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-widget-id]',
    );
    if (widgetEl) {
      ctx.editorState.setSelection([widgetEl.dataset.widgetId!]);
    } else {
      ctx.editorState.setSelection([]);
    }
  }

  console.debug('[mine] canvas render effect');

  return (
    <div
      data-canvas
      style={{
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        position: 'relative',
        background: page.background,
      }}
      onClick={handleClick}
    >
      <div
        style={{
          width: page.layout.size?.[0],
          height: page.layout.size?.[1],
          background: page.foreground || '#fff',
          position: 'relative',
          margin: '0 auto',
        }}
      >
        <PageLiveProvider
          key={page.id}
          pageId={page.id}
          subscribe={subscribePage}
        >
          <PageEditor ctx={ctx} registry={ctx.registry} />
        </PageLiveProvider>
      </div>
    </div>
  );
}
