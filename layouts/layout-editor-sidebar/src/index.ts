import type {
  PluginDefinition,
  PluginContext,
} from '@canvix-react/dock-editor';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Sidebar } from './sidebar.js';

export const sidebarPlugin: PluginDefinition = {
  name: 'layout-sidebar',
  setup(ctx: PluginContext) {
    let root: ReturnType<typeof createRoot> | null = null;

    return {
      mount() {
        const el = ctx.getSlotElement('sidebar');
        if (!el) return;
        root = createRoot(el);
        root.render(createElement(Sidebar, { ctx }));
      },
      unmount() {
        root?.unmount();
        root = null;
      },
    };
  },
};
