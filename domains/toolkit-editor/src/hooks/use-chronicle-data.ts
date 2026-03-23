import type { DocumentRuntime } from '@canvix-react/schema-document';
import { useEffect, useReducer } from 'react';

import { useEditorRef } from '../context/editor-ref.js';

export function useChronicleData(): Readonly<DocumentRuntime> {
  const { chronicle } = useEditorRef();
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    return chronicle.onUpdate(() => forceUpdate());
  }, [chronicle]);

  return chronicle.getDocument();
}
