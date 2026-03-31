/*
 * Description: Shared plugin interfaces — used by both editor and viewer.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { ComponentType } from 'react';

export interface LayoutPluginDefinition {
  /** Unique identifier. */
  name: string;
  /** Slot name this plugin renders into (e.g. 'canvas', 'sidebar'). */
  slot: string;
  /** React component rendered via portal into the slot (no props). */
  component: ComponentType;
}
