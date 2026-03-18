import type { DocumentRuntime } from '@canvix-react/schema-document';
import { createContext, useContext } from 'react';

export interface DocumentRefContextValue {
  document: Readonly<DocumentRuntime>;
  getDocument: () => Readonly<DocumentRuntime>;
}

export const DocumentRefContext = createContext<DocumentRefContextValue | null>(
  null,
);
DocumentRefContext.displayName = 'DocumentRefContext';

export const DocumentRefProvider = DocumentRefContext.Provider;

export function useDocumentRef(): DocumentRefContextValue {
  const ctx = useContext(DocumentRefContext);
  if (!ctx)
    throw new Error('useDocumentRef must be used within a DocumentRefProvider');
  return ctx;
}
