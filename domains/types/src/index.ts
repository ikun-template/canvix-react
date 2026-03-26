/*
 * Description: Centralized editor type definitions.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

// Plugin interfaces
export type {
  LayoutPluginDefinition,
  ServicePluginDefinition,
  ServicePluginContext,
  ServicePluginInstance,
  DraftSession,
  HookSystem,
  EventBus,
  EventMap,
  ShortcutBinding,
  ShortcutRegistry,
} from './plugin.js';

// Widget types
export type {
  WidgetPluginDefinition,
  WidgetMeta,
  WidgetRenderMap,
  WidgetRenderProps,
  WidgetInspectorConfig,
  InspectorGroup,
  InspectorField,
  WidgetSlot,
  Chain,
  UpdateField,
  WidgetRegistry,
} from './widget.js';

// Editor state
export type {
  EditorToolType,
  EditorStateSnapshot,
  EditorStore,
} from './editor-state.js';

// Config
export type { EditorConfig } from './config.js';
