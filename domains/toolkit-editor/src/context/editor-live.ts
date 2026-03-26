import type { EditorStateSnapshot } from '@canvix-react/editor-types';
import { useSelectiveStore } from '@canvix-react/toolkit-shared';
import { useCallback, useMemo } from 'react';

import { useEditorRef } from './editor-ref.js';

export type EditorLiveContextValue = EditorStateSnapshot;

const selectAll = (s: EditorLiveContextValue) => s;

/** Full snapshot — re-renders on every field change */
export function useEditorLive(): EditorLiveContextValue;

/** Single key — returns that field's value directly */
export function useEditorLive<K extends keyof EditorLiveContextValue>(
  key: K,
): EditorLiveContextValue[K];

/** Multiple keys — returns Pick object (shallow-equal stabilised) */
export function useEditorLive<K extends keyof EditorLiveContextValue>(
  ...keys: K[]
): Pick<EditorLiveContextValue, K>;

/** Selector function — arbitrary derived value (shallow-equal stabilised) */
export function useEditorLive<R>(selector: (s: EditorLiveContextValue) => R): R;

export function useEditorLive(...args: unknown[]): unknown {
  const first = args[0];

  if (args.length === 0) return useEditorLiveAll();
  if (typeof first === 'function')
    return useEditorLiveSelector(
      first as (s: EditorLiveContextValue) => unknown,
    );
  if (args.length === 1)
    return useEditorLiveKey(first as keyof EditorLiveContextValue);
  return useEditorLiveKeys(args as (keyof EditorLiveContextValue)[]);
}

// --- internal hooks (each has a linear hook call path) ---

function useEditorLiveAll() {
  const { onChange, getSnapshot } = useEditorRef();
  return useSelectiveStore(onChange, getSnapshot, selectAll);
}

function useEditorLiveSelector<R>(selector: (s: EditorLiveContextValue) => R) {
  const { onChange, getSnapshot } = useEditorRef();
  return useSelectiveStore(onChange, getSnapshot, selector);
}

function useEditorLiveKey<K extends keyof EditorLiveContextValue>(key: K) {
  const { onChange, getSnapshot } = useEditorRef();
  const selector = useCallback((s: EditorLiveContextValue) => s[key], [key]);
  return useSelectiveStore(onChange, getSnapshot, selector);
}

function useEditorLiveKeys<K extends keyof EditorLiveContextValue>(keys: K[]) {
  const { onChange, getSnapshot } = useEditorRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKeys = useMemo(() => keys, [keys.join(',')]);
  const selector = useCallback(
    (s: EditorLiveContextValue) => {
      const result: Record<string, unknown> = {};
      for (const k of stableKeys) result[k] = s[k];
      return result as Pick<EditorLiveContextValue, K>;
    },
    [stableKeys],
  );
  return useSelectiveStore(onChange, getSnapshot, selector);
}
