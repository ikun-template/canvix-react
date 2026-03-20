// Editor context
export {
  EditorContext,
  EditorProvider,
  useEditor,
  type EditorContextValue,
} from './context/editor.js';

// Editor hooks
export { useDocumentEditor } from './hooks/use-document-editor.js';
export { useEditorState } from './hooks/use-editor-state.js';
export { usePageEditor } from './hooks/use-page-editor.js';
export { useWidgetEditor } from './hooks/use-widget-editor.js';

// Chronicle hooks
export { useChronicleData } from './hooks/use-chronicle-data.js';
export { useChronicleSelective } from './hooks/use-chronicle-selective.js';

// Re-export chronicle types needed by consumers
export type { OperationModel } from '@canvix-react/chronicle';
