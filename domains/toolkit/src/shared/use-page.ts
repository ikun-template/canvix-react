import type { PageRuntime } from '@canvix-react/schema-page';

import { useDocument } from '../context/document.js';
import { usePage } from '../context/page.js';

export function usePageToolkit() {
  const { document } = useDocument();
  const { pageId } = usePage();

  return {
    getPage(): Readonly<PageRuntime> {
      const page = document.pages.find(p => p.id === pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      return page;
    },
  };
}
