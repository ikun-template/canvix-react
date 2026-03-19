import { useEffect, useReducer, type ReactNode } from 'react';

import { useDocumentRef } from '../context/document-ref.js';
import {
  PageLiveContext,
  type PageLiveContextValue,
} from '../context/page-live.js';

interface PageLiveProviderProps {
  pageId: string;
  children: ReactNode;
  subscribe?: (listener: () => void) => () => void;
}

export function PageLiveProvider({
  pageId,
  children,
  subscribe,
}: PageLiveProviderProps) {
  const { getDocument } = useDocumentRef();
  const [version, bump] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!subscribe) return;
    return subscribe(bump);
  }, [subscribe]);

  const doc = getDocument();
  const page = doc.pages.find(p => p.id === pageId);

  const value: PageLiveContextValue | null = page
    ? {
        pageId: page.id,
        name: page.name,
        layout: page.layout,
        foreground: page.foreground,
        background: page.background,
        widgetIds: page.widgets.map(w => w.id),
        version,
      }
    : null;

  if (!value) return null;

  return (
    <PageLiveContext.Provider value={value}>
      {children}
    </PageLiveContext.Provider>
  );
}
