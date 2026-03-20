import type {
  EditorState,
  EditorStateSnapshot,
} from '@canvix-react/dock-editor';
import { useSyncExternalStore } from 'react';

export function useEditorState(editorState: EditorState): EditorStateSnapshot {
  return useSyncExternalStore(editorState.onChange, editorState.getSnapshot);
}
