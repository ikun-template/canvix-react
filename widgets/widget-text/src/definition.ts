import type { WidgetDefinition } from '@canvix-react/widget-registry';

import { TextEditor } from './editor.js';
import type { TextData } from './types.js';
import { TextViewer } from './viewer.js';

export type { TextData } from './types.js';

export const textDefinition: WidgetDefinition<TextData> = {
  type: 'text',
  meta: {
    name: 'widgets.text',
    category: 'basic',
    icon: 'type',
  },
  defaultCustomData: {
    content: '文本内容',
    fontSize: 16,
    color: '#333333',
    align: 'left',
  },
  defaultSchema: {
    layout: { size: [200, 100] },
  },
  render: {
    editor: TextEditor,
    viewer: TextViewer,
  },
  inspector: {
    render: [
      {
        title: 'inspector.title',
        properties: [
          {
            chain: ['custom_data', 'content'],
            renderer: 'text',
            label: '内容',
          },
          {
            chain: ['custom_data', 'fontSize'],
            renderer: 'number',
            label: '字号',
          },
          { chain: ['custom_data', 'color'], renderer: 'color', label: '颜色' },
          {
            chain: ['custom_data', 'align'],
            renderer: 'select',
            label: '对齐',
            options: { items: ['left', 'center', 'right'] },
          },
        ],
      },
    ],
  },
};
