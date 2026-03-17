import type { DocumentRuntime, DocumentRaw } from './types.js';

export function documentDefaults(input?: DocumentRaw): DocumentRuntime {
  return {
    schema: input?.schema ?? '0.1.0',
    title: input?.title ?? '',
    desc: input?.desc ?? '',
    cover: input?.cover ?? '',
    pages: (input?.pages as DocumentRuntime['pages']) ?? [],
  };
}
