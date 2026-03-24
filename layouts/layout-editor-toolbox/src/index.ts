import type { LayoutPluginDefinition } from '@canvix-react/dock-editor';

import { Toolbox } from './toolbox.js';

export const toolboxPlugin: LayoutPluginDefinition = {
  name: 'layout-toolbox',
  slot: 'toolbox',
  component: Toolbox,
  setup() {
    return {};
  },
};
