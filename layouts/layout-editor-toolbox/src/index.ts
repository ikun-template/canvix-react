import type {
  PluginDefinition,
  PluginContext,
} from '@canvix-react/dock-editor';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Toolbox } from './toolbox.js';

export const toolboxPlugin: PluginDefinition = {
  name: 'layout-toolbox',
  setup(ctx: PluginContext) {
    let root: ReturnType<typeof createRoot> | null = null;

    return {
      mount() {
        const el = ctx.getSlotElement('toolbox');
        if (!el) return;
        root = createRoot(el);
        root.render(createElement(Toolbox, { ctx }));
      },
      unmount() {
        root?.unmount();
        root = null;
      },
    };
  },
};
