import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import { useChronicleSelective } from '@canvix-react/toolkit-editor';
import { useSyncExternalStore } from 'react';

interface SidebarProps {
  ctx: PluginContext;
}

const shouldUpdate = (model: OperationModel) => {
  if (model.target === 'document') return true;
  if (model.target === 'page') {
    return model.operations.some(op => op.chain[0] === 'name');
  }
  return false;
};

export function Sidebar({ ctx }: SidebarProps) {
  const snapshot = useSyncExternalStore(
    ctx.editorState.onChange,
    ctx.editorState.getSnapshot,
  );

  const doc = useChronicleSelective(shouldUpdate);
  const pages = doc.pages;

  console.debug('[mine] sidebar render effect');

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
