import { useEffect, useReducer, type ReactNode } from 'react';

import {
  DocumentLiveContext,
  type DocumentLiveContextValue,
} from '../context/document-live.js';
import { useDocumentRef } from '../context/document-ref.js';

interface DocumentLiveProviderProps {
  children: ReactNode;
  subscribe?: (listener: () => void) => () => void;
}

export function DocumentLiveProvider({
  children,
  subscribe,
}: DocumentLiveProviderProps) {
  const { getDocument } = useDocumentRef();
  const [version, bump] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!subscribe) return;
    return subscribe(bump);
  }, [subscribe]);

  const doc = getDocument();

  const value: DocumentLiveContextValue = {
    title: doc.title,
    desc: doc.desc,
    cover: doc.cover,
    pageIds: doc.pages.map(p => p.id),
    version,
  };

  return (
    <DocumentLiveContext.Provider value={value}>
      {children}
    </DocumentLiveContext.Provider>
  );
}
