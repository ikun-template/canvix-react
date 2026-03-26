import type { LayoutPluginDefinition } from '@canvix-react/editor-types';

import { Inspector } from './inspector.js';

export const inspectorPlugin: LayoutPluginDefinition = {
  name: 'layout-inspector',
  slot: 'inspector',
  component: Inspector,
};
