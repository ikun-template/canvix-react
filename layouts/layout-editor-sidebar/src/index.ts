import type { PluginDefinition } from '@canvix-react/dock-editor';

import { Sidebar } from './sidebar.js';

export const sidebarPlugin: PluginDefinition = {
  name: 'layout-sidebar',
  slot: 'sidebar',
  component: Sidebar,
  setup() {
    return {};
  },
};
