import type { LayoutPluginDefinition } from '@canvix-react/editor-types';

import { Canvas } from './canvas.js';

export const canvasPlugin: LayoutPluginDefinition = {
  name: 'layout-canvas',
  slot: 'canvas',
  component: Canvas,
};
