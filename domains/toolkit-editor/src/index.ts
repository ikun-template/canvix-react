// Editor config context
export {
  EditorConfigContext,
  EditorConfigProvider,
  useI18n,
  useTheme,
  type EditorConfigContextValue,
} from './context/editor-config.js';

// Editor ref context
export {
  EditorRefContext,
  EditorRefProvider,
  useEditorRef,
  type EditorRefContextValue,
  type PluginMeta,
} from './context/editor-ref.js';

// Editor live context
export {
  EditorLiveContext,
  useEditorLive,
  type EditorLiveContextValue,
} from './context/editor-live.js';

// Editor dispatch context
export {
  EditorDispatchContext,
  useEditorDispatch,
  type EditorDispatch,
} from './context/editor-dispatch.js';

// Editor state store types
export type {
  EditorStateSnapshot,
  ToolType,
} from './store/editor-state-store.js';

// Editor providers
export { EditorLiveProvider } from './providers/editor-live-provider.js';

// Editor hooks
export { useDocumentEditor } from './hooks/use-document-editor.js';
export { usePageEditor } from './hooks/use-page-editor.js';
export { useWidgetEditor } from './hooks/use-widget-editor.js';

// Chronicle hooks
export { useChronicleData } from './hooks/use-chronicle-data.js';
export { useChronicleSelective } from './hooks/use-chronicle-selective.js';

// Re-export chronicle types needed by consumers
export type { OperationModel } from '@canvix-react/chronicle';
