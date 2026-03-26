import type { LayoutPluginDefinition } from '@canvix-react/editor-types';

import { Sidebar } from './sidebar.js';

export const sidebarPlugin: LayoutPluginDefinition = {
  name: 'layout-sidebar',
  slot: 'sidebar',
  component: Sidebar,
};
