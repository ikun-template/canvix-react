import { useCallback, useRef, useSyncExternalStore } from 'react';

import { shallowEqual } from './shallow-equal.js';

export function useSelectiveStore<Snapshot, Result>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => Snapshot,
  selector: (s: Snapshot) => Result,
): Result {
  const prevRef = useRef<Result | undefined>(undefined);

  const getSelected = useCallback(() => {
    const next = selector(getSnapshot());
    if (prevRef.current !== undefined && shallowEqual(prevRef.current, next)) {
      return prevRef.current;
    }
    prevRef.current = next;
    return next;
  }, [getSnapshot, selector]);

  return useSyncExternalStore(subscribe, getSelected);
}
