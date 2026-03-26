import type { LayoutPluginDefinition } from '@canvix-react/editor-types';

import { Toolbox } from './toolbox.js';

export const toolboxPlugin: LayoutPluginDefinition = {
  name: 'layout-toolbox',
  slot: 'toolbox',
  component: Toolbox,
};
