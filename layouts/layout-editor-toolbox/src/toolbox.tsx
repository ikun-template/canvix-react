import type { EditorToolType } from '@canvix-react/editor-types';
import { Focus, Hand, MousePointer2, Plus } from '@canvix-react/icon';
import {
  useEditorLive,
  useEditorRef,
  useI18n,
} from '@canvix-react/toolkit-editor';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from '@canvix-react/ui';
import { useState } from 'react';

import { useToolboxDrag } from './use-toolbox-drag.js';
import { ZoomInput } from './zoom-input.js';

const TOOLBAR_TOOLS = [
  {
    id: 'select' as EditorToolType,
    labelKey: 'toolbox.tool.select',
    Icon: MousePointer2,
  },
  { id: 'hand' as EditorToolType, labelKey: 'toolbox.tool.hand', Icon: Hand },
] as const;

export function Toolbox() {
  const { t } = useI18n();
  const ref = useEditorRef();
  const definitions = ref.registry.getAll();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { startDrag } = useToolboxDrag(ref, t, () => setPopoverOpen(false));

  const { activeTool, activePageId } = useEditorLive(
    'activeTool',
    'activePageId',
  );

  return (
    <div className="bg-background/80 border-border pointer-events-auto flex items-center gap-0.5 rounded-xl border px-1 py-1 shadow-md backdrop-blur">
      {TOOLBAR_TOOLS.map(({ id, labelKey, Icon }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${activeTool === id ? 'bg-accent text-accent-foreground' : ''}`}
          title={t(labelKey)}
          onClick={() => ref.setActiveTool(id)}
        >
          <Icon size={16} />
        </Button>
      ))}

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <ZoomInput />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={t('toolbox.resetViewport')}
        onClick={() => {
          const canvas = document.querySelector<HTMLElement>('[data-canvas]');
          if (!canvas || !activePageId) return;

          const page = ref.chronicle
            .getDocument()
            .pages.find(p => p.id === activePageId);
          if (!page) return;

          const vw = canvas.clientWidth;
          const vh = canvas.clientHeight;
          const pageW = page.layout.size?.[0] ?? 0;
          const pageH = page.layout.size?.[1] ?? 0;

          ref.batch(() => {
            ref.setZoom(1);
            ref.setCamera(pageW / 2 - vw / 2, pageH / 2 - vh / 2);
          });
        }}
      >
        <Focus size={16} />
      </Button>

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
                  onPointerDown={e => startDrag(def, e)}
                  className="hover:bg-accent flex cursor-grab flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors"
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
