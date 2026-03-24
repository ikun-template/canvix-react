import type { PageRuntime } from '@canvix-react/schema-page';
import { createContext, useContext } from 'react';

export interface PageLiveContextValue {
  pageId: string;
  name: string;
  layout: PageRuntime['layout'];
  foreground: string;
  background: string;
  widgetIds: string[];
  version: number;
}

export const PageLiveContext = createContext<PageLiveContextValue | null>(null);
PageLiveContext.displayName = 'PageLiveContext';

export const PageProvider = PageLiveContext.Provider;

export function usePageLive(): PageLiveContextValue {
  const ctx = useContext(PageLiveContext);
  if (!ctx)
    throw new Error('usePageLive must be used within a PageLiveProvider');
  return ctx;
}

export const usePage = usePageLive;
