import { createContext, useContext } from 'react';

export interface DocumentLiveContextValue {
  title: string;
  desc: string;
  cover: string;
  pageIds: string[];
  version: number;
}

export const DocumentLiveContext =
  createContext<DocumentLiveContextValue | null>(null);
DocumentLiveContext.displayName = 'DocumentLiveContext';

export const DocumentLiveProvider = DocumentLiveContext.Provider;

export function useDocumentLive(): DocumentLiveContextValue {
  const ctx = useContext(DocumentLiveContext);
  if (!ctx)
    throw new Error(
      'useDocumentLive must be used within a DocumentLiveProvider',
    );
  return ctx;
}

export const useDocument = useDocumentLive;
