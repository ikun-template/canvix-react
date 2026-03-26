/*
 * Description: dock-editor public API.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export {
  Runtime as DockEditor,
  type RuntimeOptions as DockEditorOptions,
  type SaveAdapter,
} from './runtime/index.js';

export {
  EditorStateStore,
  type EditorStateStoreOptions,
} from './runtime/editor-state-store.js';

// Re-export public types from @canvix-react/editor-types
export type {
  DraftSession,
  LayoutPluginDefinition,
  ServicePluginContext,
  ServicePluginDefinition,
  ServicePluginInstance,
  ShortcutBinding,
  ShortcutRegistry,
} from '@canvix-react/editor-types';
