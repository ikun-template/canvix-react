import { nanoid } from 'nanoid';

import type { WidgetRuntime, WidgetRaw } from './types.js';

export function widgetDefaults<T = unknown>(
  input?: WidgetRaw<T>,
): WidgetRuntime<T> {
  return {
    schema: input?.schema ?? '0.1.0',
    id: input?.id ?? nanoid(6),
    type: input?.type ?? '',
    name: input?.name ?? '',
    mode: input?.mode ?? 'flow',
    position: {
      axis: input?.position?.axis ?? [0, 0],
    },
    layout: {
      size: input?.layout?.size ?? [300, 200],
      padding: input?.layout?.padding ?? [0, 0, 0, 0],
    },
    rotation: input?.rotation ?? 0,
    hide: input?.hide ?? false,
    opacity: input?.opacity ?? 1,
    custom_data: (input?.custom_data ?? {}) as T,
    slots: input?.slots as WidgetRuntime<T>['slots'],
  };
}
