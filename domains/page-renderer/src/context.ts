import type { PageRuntime } from '@canvix-react/schema-page';
import type { WidgetRegistry } from '@canvix-react/widget-registry';
import { createContext, useContext } from 'react';

export type WidgetUpdateListener = (widgetId: string) => void;
export type SubscribeWidgetUpdates = (
  listener: WidgetUpdateListener,
) => () => void;

export interface RendererContext {
  registry: WidgetRegistry;
  page: PageRuntime;
  mode: 'editor' | 'viewer';
  subscribeWidgetUpdates?: SubscribeWidgetUpdates;
}

export const RendererCtx = createContext<RendererContext | null>(null);

export function useRenderer(): RendererContext {
  const ctx = useContext(RendererCtx);
  if (!ctx) throw new Error('useRenderer must be used within PageRenderer');
  return ctx;
}

export interface WidgetContext {
  widgetId: string;
  parentId?: string;
  slotName?: string;
}

export const WidgetCtx = createContext<WidgetContext | null>(null);

export function useWidgetContext(): WidgetContext {
  const ctx = useContext(WidgetCtx);
  if (!ctx)
    throw new Error('useWidgetContext must be used within WidgetProvider');
  return ctx;
}
