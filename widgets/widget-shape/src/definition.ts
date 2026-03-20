import { Square } from '@canvix-react/icon';
import { createBasePropertyGroup } from '@canvix-react/inspector-controls';
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
    icon: Square,
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
  inspector: {
    render: () => [
      createBasePropertyGroup(),
      {
        title: '形状属性',
        properties: [
          {
            chain: ['custom_data', 'shape'],
            renderer: 'select',
            label: '形状',
            span: 2,
            options: { items: ['rect', 'circle'] },
          },
          {
            chain: ['custom_data', 'fill'],
            renderer: 'color',
            label: '填充',
            span: 2,
          },
          {
            chain: ['custom_data', 'stroke'],
            renderer: 'color',
            label: '描边',
            span: 2,
          },
          {
            chain: ['custom_data', 'strokeWidth'],
            renderer: 'number',
            label: '线宽',
            span: 2,
            options: { min: 0 },
          },
          {
            chain: ['custom_data', 'borderRadius'],
            renderer: 'number',
            label: '圆角',
            span: 2,
            options: { min: 0 },
          },
        ],
      },
    ],
  },
};
