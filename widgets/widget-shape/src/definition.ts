import type { WidgetDefinition } from '@canvix-react/widget-registry';

import { ShapeEditor } from './editor.js';
import type { ShapeData } from './types.js';
import { ShapeViewer } from './viewer.js';

export type { ShapeData } from './types.js';

export const shapeDefinition: WidgetDefinition<ShapeData> = {
  type: 'shape',
  meta: {
    name: 'widgets.shape',
    category: 'basic',
    icon: 'square',
  },
  defaultCustomData: {
    shape: 'rect',
    fill: '#e0e0e0',
    stroke: '',
    strokeWidth: 1,
    borderRadius: 0,
  },
  defaultSchema: {
    layout: { size: [150, 150] },
  },
  render: {
    editor: ShapeEditor,
    viewer: ShapeViewer,
  },
};
