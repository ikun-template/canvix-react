import type { Chronicle } from '@canvix-react/chronicle';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import { createContext, useContext } from 'react';

export interface DocumentContextValue {
  chronicle: Chronicle;
  document: Readonly<DocumentRuntime>;
}

export const DocumentContext = createContext<DocumentContextValue | null>(null);

export const DocumentProvider = DocumentContext.Provider;

export function useDocument(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx)
    throw new Error('useDocument must be used within a DocumentProvider');
  return ctx;
}
