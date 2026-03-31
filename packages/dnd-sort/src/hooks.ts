/*
 * Description: React hooks for sort drag — useSortDrag and useSortContainer.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSortEngine } from './sort-engine.js';
import type {
  SortContainerOptions,
  SortDragOptions,
  SortSession,
} from './types.js';

// ── useSortDrag ─────────────────────────────────────────────────────────────

/**
 * Attach to a draggable child element. Returns `dragProps` to spread onto the element.
 *
 * The `options` can be a static object or a function that returns options lazily
 * (evaluated on pointerdown, useful when index changes between renders).
 */
export function useSortDrag<T>(
  options: SortDragOptions<T> | (() => SortDragOptions<T>),
  childIndex: number,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const indexRef = useRef(childIndex);
  indexRef.current = childIndex;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const opts =
      typeof optionsRef.current === 'function'
        ? optionsRef.current()
        : optionsRef.current;

    getSortEngine().startDrag(e.nativeEvent, indexRef.current, opts);
  }, []);

  return { dragProps: { onPointerDown } };
}

// ── useSortContainer ────────────────────────────────────────────────────────

export interface UseSortContainerReturn {
  /** Attach to the container element. */
  containerRef: (el: HTMLElement | null) => void;
  /** Current drop index (insert-before position), null when idle. */
  dropIndex: number | null;
  /** Whether a drag is active. */
  isDragging: boolean;
}

/**
 * Register a container element as the sort drop zone.
 * Provides reactive `dropIndex` and `isDragging` state.
 */
export function useSortContainer<T>(
  options: SortContainerOptions<T>,
): UseSortContainerReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const elRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<{
    dropIndex: number | null;
    isDragging: boolean;
  }>({ dropIndex: null, isDragging: false });

  // Subscribe to session changes
  useEffect(() => {
    const engine = getSortEngine();
    return engine.onSessionChange(() => {
      const session = engine.getSession();
      setState(
        session?.active
          ? { dropIndex: session.dropIndex, isDragging: true }
          : { dropIndex: null, isDragging: false },
      );
    });
  }, []);

  // Container ref callback
  const containerRef = useCallback((el: HTMLElement | null) => {
    // Cleanup previous registration
    cleanupRef.current?.();
    cleanupRef.current = null;
    elRef.current = null;

    if (el) {
      elRef.current = el;
      cleanupRef.current = getSortEngine().registerContainer(el, {
        onSort: result => optionsRef.current.onSort(result as never),
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { containerRef, ...state };
}

// ── useSortMonitor ──────────────────────────────────────────────────────────

/**
 * Observe the global sort-drag session. Useful for rendering indicators
 * outside the container (e.g. overlay, cursor changes).
 */
export function useSortMonitor(): SortSession | null {
  const [session, setSession] = useState<SortSession | null>(null);

  useEffect(() => {
    const engine = getSortEngine();
    return engine.onSessionChange(() => {
      setSession(engine.getSession());
    });
  }, []);

  return session;
}
