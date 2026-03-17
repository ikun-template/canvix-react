import type {
  PluginDefinition,
  PluginContext,
} from '@canvix-react/dock-editor';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { Canvas } from './canvas.js';

export const canvasPlugin: PluginDefinition = {
  name: 'layout-canvas',
  setup(ctx: PluginContext) {
    let root: ReturnType<typeof createRoot> | null = null;

    return {
      mount() {
        const el = ctx.getSlotElement('canvas');
        if (!el) return;
        root = createRoot(el);
        root.render(createElement(Canvas, { ctx }));
      },
      unmount() {
        root?.unmount();
        root = null;
      },
    };
  },
};
