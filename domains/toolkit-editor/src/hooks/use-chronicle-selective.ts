import type { OperationModel } from '@canvix-react/chronicle';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import { useEffect, useReducer } from 'react';

import { useEditorRef } from '../context/editor-ref.js';

export function useChronicleSelective(
  shouldUpdate?: (model: OperationModel) => boolean,
): Readonly<DocumentRuntime> {
  const { chronicle } = useEditorRef();
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    return chronicle.onUpdate((model: OperationModel) => {
      if (!shouldUpdate || shouldUpdate(model)) {
        forceUpdate();
      }
    });
  }, [chronicle, shouldUpdate]);

  return chronicle.getDocument();
}
