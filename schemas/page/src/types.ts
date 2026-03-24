import type { WidgetRuntime } from '@canvix-react/schema-widget';
import type { DeepPartial } from '@canvix-react/types';

export interface PageRuntime {
  schema: string;
  id: string;
  name: string;
  layout: {
    size?: [number | undefined, number | undefined];
    direction: 'row' | 'column';
    wrap: 'nowrap' | 'wrap';
    gap: number;
    align: 'start' | 'center' | 'end' | 'stretch';
    justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    padding: [number, number, number, number];
  };
  foreground: string;
  background: string;
  widgets: WidgetRuntime[];
}

export type PageRaw = DeepPartial<PageRuntime>;
