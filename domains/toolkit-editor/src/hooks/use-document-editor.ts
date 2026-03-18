import type { DocumentRuntime } from '@canvix-react/schema-document';
import type { PageRaw } from '@canvix-react/schema-page';
import { useDocumentRef } from '@canvix-react/toolkit-shared';

import { useEditor } from '../context/editor.js';

export function useDocumentEditor() {
  const { chronicle } = useEditor();
  const { getDocument } = useDocumentRef();

  return {
    getDocument(): Readonly<DocumentRuntime> {
      return getDocument();
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
      const doc = getDocument();
      const from = doc.pages.findIndex(p => p.id === pageId);
      if (from < 0) return;
      chronicle.update({
        target: 'document',
        operations: [{ kind: 'move', chain: ['pages'], from, to }],
      });
    },
  };
}
