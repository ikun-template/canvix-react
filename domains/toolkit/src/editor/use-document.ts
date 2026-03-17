import type { DocumentRuntime } from '@canvix-react/schema-document';
import type { PageRaw } from '@canvix-react/schema-page';

import { useDocument } from '../context/document.js';

export function useDocumentToolkit() {
  const { chronicle, document } = useDocument();

  return {
    getDocument(): Readonly<DocumentRuntime> {
      return document;
    },

    update(data: { chain: (string | number)[]; value: unknown }[]) {
      chronicle.update({
        target: 'document',
        operations: [
          { kind: 'update', chain: data[0].chain, value: data[0].value },
        ],
      });
    },

    addPage(page: PageRaw) {
      chronicle.update({
        target: 'document',
        operations: [{ kind: 'add', chain: ['pages'], value: page }],
      });
    },

    deletePage(_pageId: string) {
      chronicle.update({
        target: 'document',
        operations: [{ kind: 'delete', chain: ['pages'] }],
      });
    },

    movePage(pageId: string, to: number) {
      const from = document.pages.findIndex(p => p.id === pageId);
      if (from < 0) return;
      chronicle.update({
        target: 'document',
        operations: [{ kind: 'move', chain: ['pages'], from, to }],
      });
    },
  };
}
