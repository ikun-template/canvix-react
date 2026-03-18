import { useEffect, useMemo, useReducer, type ReactNode } from 'react';

import {
  WidgetLiveContext,
  type WidgetLiveContextValue,
} from '../context/widget-live.js';

interface WidgetLiveProviderProps {
  widgetId: string;
  pageId: string;
  parentId: string | null;
  slotName: string | null;
  children: ReactNode;
  subscribe?: (listener: () => void) => () => void;
}

export function WidgetLiveProvider({
  widgetId,
  pageId,
  parentId,
  slotName,
  children,
  subscribe,
}: WidgetLiveProviderProps) {
  const [version, bump] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!subscribe) return;
    return subscribe(bump);
  }, [subscribe]);

  const value = useMemo<WidgetLiveContextValue>(
    () => ({ widgetId, pageId, parentId, slotName, version }),
    [widgetId, pageId, parentId, slotName, version],
  );

  return (
    <WidgetLiveContext.Provider value={value}>
      {children}
    </WidgetLiveContext.Provider>
  );
}
