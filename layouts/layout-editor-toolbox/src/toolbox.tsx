import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import { Hand, MousePointer2, Plus } from '@canvix-react/icon';
import { widgetDefaults } from '@canvix-react/schema-widget';
import {
  useEditorDispatch,
  useEditorLive,
  useI18n,
  type ToolType,
} from '@canvix-react/toolkit-editor';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from '@canvix-react/ui';
import type { WidgetDefinition } from '@canvix-react/widget-registry';
import { useState } from 'react';

interface ToolboxProps {
  ctx: LayoutPluginContext;
}

const TOOLBAR_TOOLS = [
  {
    id: 'select' as ToolType,
    labelKey: 'toolbox.tool.select',
    Icon: MousePointer2,
  },
  { id: 'hand' as ToolType, labelKey: 'toolbox.tool.hand', Icon: Hand },
] as const;

export function Toolbox({ ctx }: ToolboxProps) {
  const { t } = useI18n();
  const dispatch = useEditorDispatch();
  const definitions = ctx.registry.getAll();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const snapshot = useEditorLive();
  const activeTool = snapshot.activeTool;

  function addWidget(def: WidgetDefinition) {
    const pageId = snapshot.activePageId;
    if (!pageId) return;

    const page = ctx.chronicle.getDocument().pages.find(p => p.id === pageId);
    if (!page) return;

    const widget = widgetDefaults({
      type: def.type,
      name: t(def.meta.name),
      position: { axis: [100, 100] },
      custom_data: def.defaultCustomData,
      ...def.defaultSchema,
    });

    ctx.update({
      target: 'page',
      id: pageId,
      operations: [
        {
          kind: 'array:insert',
          chain: ['widgets'],
          index: page.widgets.length,
          value: widget,
        },
      ],
    });
  }

  return (
    <div className="bg-background/80 border-border pointer-events-auto flex items-center gap-0.5 rounded-xl border px-1 py-1 shadow-md backdrop-blur">
      {TOOLBAR_TOOLS.map(({ id, labelKey, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${activeTool === id ? 'bg-accent text-accent-foreground' : ''}`}
          title={t(labelKey)}
          onClick={() => dispatch.setActiveTool(id)}
        >
          <Icon size={16} />
        </Button>
      ))}

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={t('toolbox.add')}
          >
            <Plus size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-auto p-2" sideOffset={8}>
          <div className="grid grid-cols-3 gap-1">
            {definitions.map(def => {
              const Icon = def.meta.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => addWidget(def)}
                  className="hover:bg-accent flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors"
                >
                  <Icon size={20} />
                  <span>{t(def.meta.name)}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
