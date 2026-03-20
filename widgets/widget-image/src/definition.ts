import { ImageIcon } from '@canvix-react/icon';
import { createBasePropertyGroup } from '@canvix-react/inspector-controls';
import type { WidgetDefinition } from '@canvix-react/widget-registry';

import { ImageEditor } from './editor.js';
import type { ImageData } from './types.js';
import { ImageViewer } from './viewer.js';

export type { ImageData } from './types.js';

export const imageDefinition: WidgetDefinition<ImageData> = {
  type: 'image',
  meta: {
    name: 'widgets.image',
    category: 'basic',
    icon: ImageIcon,
  },
  defaultCustomData: {
    src: '',
    alt: '',
    fit: 'cover',
  },
  defaultSchema: {
    layout: { size: [300, 200] },
  },
  render: {
    editor: ImageEditor,
    viewer: ImageViewer,
  },
  inspector: {
    render: () => [
      createBasePropertyGroup(),
      {
        title: '图片属性',
        properties: [
          { chain: ['custom_data', 'src'], renderer: 'text', label: '地址' },
          {
            chain: ['custom_data', 'alt'],
            renderer: 'text',
            label: '替代文本',
            span: 2,
          },
          {
            chain: ['custom_data', 'fit'],
            renderer: 'select',
            label: '填充',
            span: 2,
            options: { items: ['cover', 'contain', 'fill'] },
          },
        ],
      },
    ],
  },
};
