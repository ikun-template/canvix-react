// Editor ref context (includes config, state operations, useI18n, useTheme)
export {
  EditorRefContext,
  EditorRefProvider,
  useEditorRef,
  useI18n,
  useTheme,
  type EditorRefContextValue,
  type EditorConfig,
  type PluginMeta,
} from './context/editor-ref.js';

// Editor live context
export {
  useEditorLive,
  type EditorLiveContextValue,
} from './context/editor-live.js';

// Editor state store types
export type {
  EditorStateSnapshot,
  ToolType,
} from './store/editor-state-store.js';

// Editor state store class (for App-level creation)
export { EditorStateStore } from './store/editor-state-store.js';

// Editor hooks
export { useDocumentEditor } from './hooks/use-document-editor.js';
export { usePageEditor } from './hooks/use-page-editor.js';
export { useWidgetEditor } from './hooks/use-widget-editor.js';

// Chronicle hooks
export { useChronicleData } from './hooks/use-chronicle-data.js';
export { useChronicleSelective } from './hooks/use-chronicle-selective.js';

// Re-export chronicle types needed by consumers
export type { OperationModel } from '@canvix-react/chronicle';
