import type { DeepPartial } from '@canvix-react/types';

export type LayoutMode = 'absolute' | 'flow';

export interface WidgetRuntime<T = unknown> {
  schema: string;
  id: string;
  type: string;
  name: string;
  mode: LayoutMode;
  position: { axis: [number, number] };
  layout: { size: [number, number] };
  rotation: number;
  hide: boolean;
  opacity: number;
  custom_data: T;
  slots?: Record<string, string[]>;
}

export type WidgetRaw<T = unknown> = DeepPartial<WidgetRuntime<T>>;
