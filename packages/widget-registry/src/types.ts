import type { WidgetRaw } from '@canvix-react/schema-widget';
import type { ComponentType } from 'react';

export type Chain = (string | number)[];

export interface WidgetMeta {
  name: string;
  category: string;
  icon: string;
  description?: string;
}

export interface WidgetRenderProps<T = unknown> {
  data: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WidgetRenderMap {
  editor: ComponentType<WidgetRenderProps<any>>;
  viewer: ComponentType<WidgetRenderProps<any>>;
}

export interface PropertyItem {
  chain: Chain;
  renderer: string;
  label: string;
  options?: Record<string, unknown>;
}

export interface PropertyGroup {
  title: string;
  properties: PropertyItem[];
}

export interface InspectorProps {
  widgetId: string;
}

export interface WidgetInspector {
  render: ComponentType<InspectorProps> | PropertyGroup[];
}

export interface SlotDeclaration {
  name: string;
  label: string;
  accept?: string[];
  maxCount?: number;
}

export interface WidgetDefinition<T = unknown> {
  type: string;
  meta: WidgetMeta;
  defaultCustomData: T;
  defaultSchema?: WidgetRaw<T>;
  render: WidgetRenderMap;
  inspector?: WidgetInspector;
  slots?: SlotDeclaration[];
}
