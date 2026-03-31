/*
 * Description: Widget registry — re-exports shared types and provides registry factory.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export type {
  WidgetMeta,
  WidgetPluginDefinition,
  WidgetRegistry,
  WidgetRenderMap,
  WidgetRenderProps,
  WidgetSlot,
  SlotAcceptContext,
} from '@canvix-react/shared-types';

export { createWidgetRegistry } from './registry.js';
export { checkSlotAccept } from './check-slot-accept.js';
