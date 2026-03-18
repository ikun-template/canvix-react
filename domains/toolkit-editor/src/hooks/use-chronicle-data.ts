import type { DocumentRuntime } from '@canvix-react/schema-document';
import { useEffect, useReducer } from 'react';

import { useEditor } from '../context/editor.js';

export function useChronicleData(): Readonly<DocumentRuntime> {
  const { chronicle } = useEditor();
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    return chronicle.onUpdate(() => forceUpdate());
  }, [chronicle]);

  return chronicle.getDocument();
}
