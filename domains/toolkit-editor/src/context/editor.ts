import type { Chronicle } from '@canvix-react/chronicle';
import { createContext, useContext } from 'react';

export interface EditorContextValue {
  chronicle: Chronicle;
}

export const EditorContext = createContext<EditorContextValue | null>(null);
EditorContext.displayName = 'EditorContext';

export const EditorProvider = EditorContext.Provider;

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}
