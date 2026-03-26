import type { WidgetPluginDefinition } from '@canvix-react/editor-types';
import { Type } from '@canvix-react/icon';
import { createBasePropertyGroup } from '@canvix-react/inspector-controls';

import { TextEditor } from './editor.js';
import type { TextData } from './types.js';
import { TextViewer } from './viewer.js';

export type { TextData } from './types.js';

export const textDefinition: WidgetPluginDefinition<TextData> = {
  type: 'text',
  meta: {
    name: 'widgets.text',
    category: 'basic',
    icon: Type,
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
    render: () => [
      createBasePropertyGroup(),
      {
        title: '文本属性',
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
            span: 2,
          },
          {
            chain: ['custom_data', 'color'],
            renderer: 'color',
            label: '颜色',
            span: 2,
          },
          {
            chain: ['custom_data', 'align'],
            renderer: 'select',
            label: '对齐',
            span: 2,
            options: { items: ['left', 'center', 'right'] },
          },
        ],
      },
    ],
  },
};
