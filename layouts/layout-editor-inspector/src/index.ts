import type {
  PluginDefinition,
  PluginContext,
} from '@canvix-react/dock-editor';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Inspector } from './inspector.js';

export const inspectorPlugin: PluginDefinition = {
  name: 'layout-inspector',
  setup(ctx: PluginContext) {
    let root: ReturnType<typeof createRoot> | null = null;

    return {
      mount() {
        const el = ctx.getSlotElement('inspector');
        if (!el) return;
        root = createRoot(el);
        root.render(createElement(Inspector, { ctx }));
      },
      unmount() {
        root?.unmount();
        root = null;
      },
    };
  },
};
