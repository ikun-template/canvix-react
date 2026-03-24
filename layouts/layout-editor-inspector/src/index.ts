import type { LayoutPluginDefinition } from '@canvix-react/dock-editor';

import { Inspector } from './inspector.js';

export const inspectorPlugin: LayoutPluginDefinition = {
  name: 'layout-inspector',
  slot: 'inspector',
  component: Inspector,
  setup() {
    return {};
  },
};
