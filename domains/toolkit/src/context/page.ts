import { createContext, useContext } from 'react';

export interface PageContextValue {
  pageId: string;
}

export const PageContext = createContext<PageContextValue | null>(null);

export const PageProvider = PageContext.Provider;

export function usePage(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('usePage must be used within a PageProvider');
  return ctx;
}
