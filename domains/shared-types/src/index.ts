/*
 * Description: Shared type definitions — editor/viewer common types.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export type { LayoutPluginDefinition } from './plugin.js';

export type {
  WidgetPluginDefinition,
  WidgetMeta,
  WidgetRenderMap,
  WidgetRenderProps,
  WidgetSlot,
  SlotAcceptContext,
  WidgetRegistry,
} from './widget.js';

export type { HookSystem, EventBus, EventMap } from './infra.js';
