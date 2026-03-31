/*
 * Description: Container widget definition — declares header, content, footer slots.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type { EditorWidgetPluginDefinition } from '@canvix-react/editor-types';
import { LayoutGrid } from '@canvix-react/icon';
import { createBasePropertyGroup } from '@canvix-react/inspector-controls';

import { ContainerEditor } from './editor.js';
import type { ContainerData } from './types.js';
import { ContainerViewer } from './viewer.js';

export type { ContainerData } from './types.js';

export const containerDefinition: EditorWidgetPluginDefinition<ContainerData> =
  {
    type: 'container',
    meta: {
      name: 'widgets.container',
      category: 'layout',
      icon: LayoutGrid,
    },
    defaultCustomData: {
      direction: 'column',
      gap: 8,
    },
    defaultSchema: {
      layout: { size: [400, 300] },
      slots: { header: [], content: [], footer: [] },
    },
    render: {
      editor: ContainerEditor,
      viewer: ContainerViewer,
    },
    inspector: {
      properties: () => [
        createBasePropertyGroup(),
        {
          title: '容器属性',
          properties: [
            {
              chain: ['custom_data', 'direction'],
              renderer: 'select',
              label: '方向',
              span: 2,
              options: { items: ['row', 'column'] },
            },
            {
              chain: ['custom_data', 'gap'],
              renderer: 'number',
              label: '间距',
              span: 2,
              options: { min: 0 },
            },
          ],
        },
      ],
    },
    slots: [
      { name: 'header', label: '头部' },
      { name: 'content', label: '内容' },
      { name: 'footer', label: '底部' },
    ],
  };
