import { nanoid } from 'nanoid';

import type { PageRuntime, PageRaw } from './types.js';

export function pageDefaults(input?: PageRaw): PageRuntime {
  return {
    schema: input?.schema ?? '0.1.0',
    id: input?.id ?? nanoid(6),
    name: input?.name ?? '',
    layout: {
      size: input?.layout?.size ?? [600, undefined],
    },
    foreground: input?.foreground ?? '#ffffff',
    background: input?.background ?? '#efefef',
    widgets: (input?.widgets as PageRuntime['widgets']) ?? [],
  };
}
