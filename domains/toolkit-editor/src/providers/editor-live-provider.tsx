import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

import {
  EditorLiveContext,
  type EditorLiveContextValue,
} from '../context/editor-live.js';
import { useEditorRef } from '../context/editor-ref.js';

interface EditorLiveProviderProps {
  children: ReactNode;
}

export function EditorLiveProvider({ children }: EditorLiveProviderProps) {
  const { editorState } = useEditorRef();

  const snapshot = useSyncExternalStore(
    editorState.onChange,
    editorState.getSnapshot,
  );

  const value: EditorLiveContextValue = snapshot;

  return (
    <EditorLiveContext.Provider value={value}>
      {children}
    </EditorLiveContext.Provider>
  );
}
