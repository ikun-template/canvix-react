import type { LayoutPluginDefinition } from '@canvix-react/dock-editor';

import { Sidebar } from './sidebar.js';

export const sidebarPlugin: LayoutPluginDefinition = {
  name: 'layout-sidebar',
  slot: 'sidebar',
  component: Sidebar,
  setup() {
    return {};
  },
};
