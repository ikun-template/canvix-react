/*
 * Description: Editor type definitions — re-exports shared-types + editor-only types.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

// Re-export all shared types (editor side single entry point)
export * from '@canvix-react/shared-types';

// Editor-only plugin interfaces
export type {
  ServicePluginDefinition,
  ServicePluginContext,
  ServicePluginInstance,
  DraftSession,
  ShortcutBinding,
  ShortcutRegistry,
} from './plugin.js';

// Editor-only widget types (inspector)
export type {
  EditorWidgetPluginDefinition,
  WidgetInspectorConfig,
  InspectorGroup,
  InspectorField,
  InspectorFieldRenderProps,
  InspectorFieldInterceptor,
  Chain,
  UpdateField,
} from './widget.js';

// Editor state
export type {
  EditorToolType,
  EditorStateSnapshot,
  EditorStore,
} from './editor-state.js';

// Config
export type { EditorConfig } from './config.js';
