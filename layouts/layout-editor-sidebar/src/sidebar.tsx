import type { PluginContext } from '@canvix-react/dock-editor';
import { useChronicleData } from '@canvix-react/toolkit';
import { useSyncExternalStore } from 'react';

interface SidebarProps {
  ctx: PluginContext;
}

export function Sidebar({ ctx }: SidebarProps) {
  const snapshot = useSyncExternalStore(
    cb => ctx.editorState.onChange(cb),
    () => ctx.editorState.getSnapshot(),
  );

  const doc = useChronicleData(ctx.chronicle);
  const pages = doc.pages;

  return (
    <div style={{ padding: 12 }}>
      <h4 style={{ marginBottom: 8 }}>Pages</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pages.map(page => (
          <li
            key={page.id}
            onClick={() => ctx.editorState.setActivePage(page.id)}
            style={{
              padding: '6px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              background:
                snapshot.activePageId === page.id ? '#e8f0fe' : 'transparent',
              fontWeight: snapshot.activePageId === page.id ? 600 : 400,
              marginBottom: 2,
            }}
          >
            {page.name || page.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
