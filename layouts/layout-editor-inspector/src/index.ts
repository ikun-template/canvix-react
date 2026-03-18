import type { PluginDefinition } from '@canvix-react/dock-editor';

import { Inspector } from './inspector.js';

export const inspectorPlugin: PluginDefinition = {
  name: 'layout-inspector',
  slot: 'inspector',
  component: Inspector,
  setup() {
    return {};
  },
};
