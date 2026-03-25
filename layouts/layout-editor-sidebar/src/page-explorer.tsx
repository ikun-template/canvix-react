import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useEditorRef,
} from '@canvix-react/toolkit-editor';

interface PageExplorerProps {
  ctx: LayoutPluginContext;
}

const shouldUpdate = (model: OperationModel) => {
  if (model.target === 'document') return true;
  if (model.target === 'page') {
    return model.operations.some(op => op.chain[0] === 'name');
  }
  return false;
};

export function PageExplorer({ ctx }: PageExplorerProps) {
  const ref = useEditorRef();
  const activePageId = useEditorLive('activePageId');

  const doc = useChronicleSelective(shouldUpdate);

  return (
    <ul className="list-none p-0">
      {doc.pages.map(page => {
        const isActive = activePageId === page.id;
        return (
          <li
            key={page.id}
            onClick={() => ref.setActivePage(page.id)}
            className={`cursor-pointer rounded px-2 py-1 text-sm ${
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'hover:bg-accent/50'
            }`}
          >
            {page.name || page.id}
          </li>
        );
      })}
    </ul>
  );
}
