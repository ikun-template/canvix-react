import type { LayoutPluginDefinition } from '@canvix-react/dock-editor';

import { Canvas } from './canvas.js';

export const canvasPlugin: LayoutPluginDefinition = {
  name: 'layout-canvas',
  slot: 'canvas',
  component: Canvas,
  setup() {
    return {};
  },
};
