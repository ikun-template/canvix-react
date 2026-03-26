/*
 * Description: Widget registry — re-exports types and provides registry factory.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

// Re-export types from editor-types for backward compatibility
export type {
  Chain,
  InspectorField,
  InspectorGroup,
  UpdateField,
  WidgetInspectorConfig,
  WidgetMeta,
  WidgetPluginDefinition,
  WidgetRegistry,
  WidgetRenderMap,
  WidgetRenderProps,
  WidgetSlot,
} from '@canvix-react/editor-types';

export { createWidgetRegistry } from './registry.js';
