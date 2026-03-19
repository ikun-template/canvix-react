import type { PluginContext } from '@canvix-react/dock-editor';
import { widgetDefaults } from '@canvix-react/schema-widget';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from '@canvix-react/ui';
import type { WidgetDefinition } from '@canvix-react/widget-registry';
import {
  Hand,
  MousePointer2,
  PenTool,
  Plus,
  icons,
  type LucideIcon,
} from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

interface ToolboxProps {
  ctx: PluginContext;
}

function getWidgetIcon(name: string): LucideIcon | undefined {
  const pascal = name.charAt(0).toUpperCase() + name.slice(1);
  return icons[pascal as keyof typeof icons];
}

// TODO: 工具切换逻辑待实现，当前仅做 UI 占位
const TOOLBAR_TOOLS = [
  { id: 'select', label: '选择', Icon: MousePointer2 },
  { id: 'hand', label: '抓手', Icon: Hand },
  { id: 'pen', label: '钢笔', Icon: PenTool },
] as const;

export function Toolbox({ ctx }: ToolboxProps) {
  const definitions = ctx.registry.getAll();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string>('select');

  const snapshot = useSyncExternalStore(
    ctx.editorState.onChange,
    ctx.editorState.getSnapshot,
  );

  function addWidget(def: WidgetDefinition) {
    const pageId = snapshot.activePageId;
    if (!pageId) return;

    const page = ctx.chronicle.getDocument().pages.find(p => p.id === pageId);
    if (!page) return;

    const widget = widgetDefaults({
      type: def.type,
      name: def.meta.name,
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

    setPopoverOpen(false);
  }

  return (
    <div className="bg-background/80 pointer-events-auto flex items-center gap-0.5 rounded-xl border px-1 py-1 shadow-md backdrop-blur">
      {TOOLBAR_TOOLS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${activeTool === id ? 'bg-accent text-accent-foreground' : ''}`}
          title={label}
          onClick={() => setActiveTool(id)}
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
            title="添加组件"
          >
            <Plus size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-auto p-2" sideOffset={8}>
          <div className="grid grid-cols-3 gap-1">
            {definitions.map(def => {
              const Icon = getWidgetIcon(def.meta.icon);
              return (
                <button
                  key={def.type}
                  onClick={() => addWidget(def)}
                  className="hover:bg-accent flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors"
                >
                  {Icon ? (
                    <Icon size={20} />
                  ) : (
                    <span className="text-base">?</span>
                  )}
                  <span>{def.meta.name}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
