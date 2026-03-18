import type { DocumentRuntime } from '@canvix-react/schema-document';

import { useDocumentRef } from '../context/document-ref.js';

export function useDocumentReader() {
  const { getDocument } = useDocumentRef();

  return {
    getDocument(): Readonly<DocumentRuntime> {
      return getDocument();
    },
  };
}
