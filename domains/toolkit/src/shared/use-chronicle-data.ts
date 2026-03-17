import type { Chronicle } from '@canvix-react/chronicle';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import { useCallback, useRef } from 'react';
import { useSyncExternalStore } from 'react';

/**
 * Reactive hook that triggers re-render whenever chronicle data changes.
 * Returns the latest DocumentRuntime (mutated in place by chronicle).
 */
export function useChronicleData(
  chronicle: Chronicle,
): Readonly<DocumentRuntime> {
  const versionRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return chronicle.onUpdate(() => {
        versionRef.current++;
        onStoreChange();
      });
    },
    [chronicle],
  );

  useSyncExternalStore(subscribe, () => versionRef.current);
  return chronicle.getDocument();
}
