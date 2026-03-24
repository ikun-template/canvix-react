import type { PluginContext } from '@canvix-react/dock-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useI18n,
} from '@canvix-react/toolkit-editor';

interface WidgetExplorerProps {
  ctx: PluginContext;
}

const shouldUpdate = (model: OperationModel) => {
  if (model.target === 'document') return true;
  if (model.target === 'page') return true;
  if (model.target === 'widget') {
    return model.operations.some(
      op => op.chain[0] === 'name' || op.chain[0] === 'type',
    );
  }
  return false;
};

export function WidgetExplorer({ ctx }: WidgetExplorerProps) {
  const { t } = useI18n();
  const snapshot = useEditorLive();

  const doc = useChronicleSelective(shouldUpdate);
  const page = doc.pages.find(p => p.id === snapshot.activePageId);
  const widgets = page?.widgets ?? [];

  if (widgets.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-4 text-center text-xs">
        {t('sidebar.widgets.empty')}
      </div>
    );
  }

  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      {widgets.map(widget => {
        const def = ctx.registry.get(widget.type);
        const Icon = def?.meta.icon;
        const isSelected = snapshot.selectedWidgetIds.includes(widget.id);
        const isHovered = !isSelected && snapshot.hoveredWidgetId === widget.id;

        return (
          <li
            key={widget.id}
            onClick={() => ctx.editorState.setSelection([widget.id])}
            onPointerEnter={() => ctx.editorState.setHoveredWidget(widget.id)}
            onPointerLeave={() => ctx.editorState.setHoveredWidget(null)}
            className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm ${
              isSelected
                ? 'bg-accent text-accent-foreground font-medium'
                : isHovered
                  ? 'bg-accent/60'
                  : ''
            }`}
          >
            {Icon && (
              <Icon size={14} className="text-muted-foreground shrink-0" />
            )}
            <span className="truncate">{widget.name || widget.type}</span>
          </li>
        );
      })}
    </ul>
  );
}
