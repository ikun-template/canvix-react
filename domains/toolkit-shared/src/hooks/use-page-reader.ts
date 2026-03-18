import type { PageRuntime } from '@canvix-react/schema-page';

import { useDocumentRef } from '../context/document-ref.js';
import { usePage } from '../context/page-live.js';

export function usePageReader() {
  const { getDocument } = useDocumentRef();
  const { pageId } = usePage();

  return {
    getPage(): Readonly<PageRuntime> {
      const page = getDocument().pages.find(p => p.id === pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      return page;
    },
  };
}
