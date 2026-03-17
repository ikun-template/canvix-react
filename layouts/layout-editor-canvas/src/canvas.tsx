import type { PluginContext } from '@canvix-react/dock-editor';
import { PageRenderer } from '@canvix-react/page-renderer';
import { useChronicleData } from '@canvix-react/toolkit';
import { useSyncExternalStore } from 'react';

interface CanvasProps {
  ctx: PluginContext;
}

export function Canvas({ ctx }: CanvasProps) {
  const snapshot = useSyncExternalStore(
    cb => ctx.editorState.onChange(cb),
    () => ctx.editorState.getSnapshot(),
  );

  const doc = useChronicleData(ctx.chronicle);
  const page = doc.pages.find(p => p.id === snapshot.activePageId);

  if (!page) return <div style={{ padding: 16, color: '#999' }}>No pages</div>;

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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          width: page.layout.size[0],
          height: page.layout.size[1],
          background: page.background || '#fff',
          position: 'relative',
          margin: '0 auto',
        }}
      >
        <PageRenderer
          page={page}
          chronicle={ctx.chronicle}
          registry={ctx.registry}
          mode="editor"
        />
      </div>
    </div>
  );
}
