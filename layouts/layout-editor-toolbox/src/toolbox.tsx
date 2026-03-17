import type { PluginContext } from '@canvix-react/dock-editor';
import { widgetDefaults } from '@canvix-react/schema-widget';
import type { WidgetDefinition } from '@canvix-react/widget-registry';
import { useSyncExternalStore } from 'react';

interface ToolboxProps {
  ctx: PluginContext;
}

export function Toolbox({ ctx }: ToolboxProps) {
  const definitions = ctx.registry.getAll();

  const snapshot = useSyncExternalStore(
    cb => ctx.editorState.onChange(cb),
    () => ctx.editorState.getSnapshot(),
  );

  function addWidget(def: WidgetDefinition) {
    const pageId = snapshot.activePageId;
    if (!pageId) return;

    const widget = widgetDefaults({
      type: def.type,
      name: def.meta.name,
      mode: 'absolute',
      position: { axis: [100, 100] },
      custom_data: def.defaultCustomData,
      ...def.defaultSchema,
    });

    ctx.update({
      target: 'page',
      id: pageId,
      operations: [{ kind: 'add', chain: ['widgets'], value: widget }],
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        height: '100%',
      }}
    >
      {definitions.map(def => (
        <button
          key={def.type}
          onClick={() => addWidget(def)}
          style={{
            padding: '4px 12px',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            background: '#fafafa',
            whiteSpace: 'nowrap',
          }}
        >
          + {def.meta.name}
        </button>
      ))}
    </div>
  );
}
