import type { PluginDefinition } from '@canvix-react/dock-editor';

import { Canvas } from './canvas.js';

export const canvasPlugin: PluginDefinition = {
  name: 'layout-canvas',
  slot: 'canvas',
  component: Canvas,
  setup() {
    return {};
  },
};
