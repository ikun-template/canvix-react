/*
 * Description: Editor toolkit — contexts, hooks, and state management for editor mode.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

// Editor ref context (includes config, state operations, useI18n, useTheme)
export {
  EditorRefContext,
  EditorRefProvider,
  useEditorRef,
  useI18n,
  useTheme,
  type EditorRefContextValue,
} from './context/editor-ref.js';

// Editor live context
export {
  useEditorLive,
  type EditorLiveContextValue,
} from './context/editor-live.js';

// Editor state store class (for App-level creation)
export { EditorStateStore } from './store/editor-state-store.js';

// Editor hooks
export { useDocumentEditor } from './hooks/use-document-editor.js';
export { usePageEditor } from './hooks/use-page-editor.js';
export { useWidgetEditor } from './hooks/use-widget-editor.js';

// Chronicle hooks
export { useChronicleData } from './hooks/use-chronicle-data.js';
export { useChronicleSelective } from './hooks/use-chronicle-selective.js';

// Re-export types from editor-types for convenience
export type {
  DraftSession,
  EditorConfig,
  EditorStateSnapshot,
  EditorToolType,
  LayoutPluginDefinition,
} from '@canvix-react/editor-types';

// Re-export chronicle types needed by consumers
export type { OperationModel } from '@canvix-react/chronicle';
