import type { WidgetRuntime } from '@canvix-react/schema-widget';
import type { DeepPartial } from '@canvix-react/types';

export interface PageRuntime {
  schema: string;
  id: string;
  name: string;
  layout: { size?: [number | undefined, number | undefined] };
  foreground: string;
  background: string;
  widgets: WidgetRuntime[];
}

export type PageRaw = DeepPartial<PageRuntime>;
