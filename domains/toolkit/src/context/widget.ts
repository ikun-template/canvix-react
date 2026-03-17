import { createContext, useContext } from 'react';

export interface WidgetContextValue {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
}

export const WidgetContext = createContext<WidgetContextValue | null>(null);

export const WidgetProvider = WidgetContext.Provider;

export function useWidget(): WidgetContextValue {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error('useWidget must be used within a WidgetProvider');
  return ctx;
}
