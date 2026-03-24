import { nanoid } from 'nanoid';

import type { PageRuntime, PageRaw } from './types.js';

export function pageDefaults(input?: PageRaw): PageRuntime {
  return {
    schema: input?.schema ?? '0.1.0',
    id: input?.id ?? nanoid(6),
    name: input?.name ?? '',
    layout: {
      size: input?.layout?.size ?? [600, undefined],
      direction: input?.layout?.direction ?? 'column',
      wrap: input?.layout?.wrap ?? 'nowrap',
      gap: input?.layout?.gap ?? 0,
      align: input?.layout?.align ?? 'stretch',
      justify: input?.layout?.justify ?? 'start',
      padding: input?.layout?.padding ?? [0, 0, 0, 0],
    },
    foreground: input?.foreground ?? '#2D2D2D',
    background: input?.background ?? '#080808',
    widgets: (input?.widgets as PageRuntime['widgets']) ?? [],
  };
}
