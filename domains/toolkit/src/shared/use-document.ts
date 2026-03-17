import type { DocumentRuntime } from '@canvix-react/schema-document';

import { useDocument } from '../context/document.js';

export function useDocumentToolkit() {
  const { document } = useDocument();

  return {
    getDocument(): Readonly<DocumentRuntime> {
      return document;
    },
  };
}
