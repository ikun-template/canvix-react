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
    icon: 'image',
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
};
