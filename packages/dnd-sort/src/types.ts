/*
 * Description: Sort drag types — options, results, and internal session state.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

export interface SortDragOptions<T = unknown> {
  /** Arbitrary data attached to the drag item. */
  item: T;
  /** Create a ghost element to follow the cursor during drag. */
  renderGhost?: (item: T, sourceEl: HTMLElement) => HTMLElement;
  /** Movement threshold in px before drag activates (default: 4). */
  threshold?: number;
  /** Sort direction (default: 'vertical'). */
  direction?: 'vertical' | 'horizontal';
}

export interface SortDropResult<T = unknown> {
  /** Index of the dragged item before the drag. */
  fromIndex: number;
  /** Raw insert-before index (not adjusted for removal — consumer handles adjustment). */
  toIndex: number;
  /** The data attached to the drag item. */
  item: T;
}

export interface SortContainerOptions<T = unknown> {
  /** Called when a drag completes with a valid reorder. */
  onSort: (result: SortDropResult<T>) => void;
}

/** Internal drag session state managed by the sort engine. */
export interface SortSession<T = unknown> {
  /** Index of the dragged child within the container. */
  fromIndex: number;
  /** Current computed drop index. */
  dropIndex: number;
  /** The drag item data. */
  item: T;
  /** Whether the drag has passed the threshold. */
  active: boolean;
  /** Starting pointer position (clientX or clientY depending on direction). */
  startPos: number;
  /** The ghost element, if created. */
  ghost: HTMLElement | null;
  /** Sort direction. */
  direction: 'vertical' | 'horizontal';
}
