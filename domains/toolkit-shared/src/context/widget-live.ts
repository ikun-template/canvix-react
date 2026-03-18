import { createContext, useContext } from 'react';

export interface WidgetLiveContextValue {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
  version: number;
}

export const WidgetLiveContext = createContext<WidgetLiveContextValue | null>(
  null,
);
WidgetLiveContext.displayName = 'WidgetLiveContext';

export const WidgetProvider = WidgetLiveContext.Provider;

export function useWidgetLive(): WidgetLiveContextValue {
  const ctx = useContext(WidgetLiveContext);
  if (!ctx)
    throw new Error('useWidgetLive must be used within a WidgetLiveProvider');
  return ctx;
}

export const useWidget = useWidgetLive;
