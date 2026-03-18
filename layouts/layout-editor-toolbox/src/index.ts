import type { PluginDefinition } from '@canvix-react/dock-editor';

import { Toolbox } from './toolbox.js';

export const toolboxPlugin: PluginDefinition = {
  name: 'layout-toolbox',
  slot: 'toolbox',
  component: Toolbox,
  setup() {
    return {};
  },
};
