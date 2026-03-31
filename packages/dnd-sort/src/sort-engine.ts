/*
 * Description: Sort drag engine — pointer management, ghost rendering, spatial hit test.
 *              Pure DOM, no framework dependency.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type {
  SortContainerOptions,
  SortDragOptions,
  SortSession,
} from './types.js';

const DEFAULT_THRESHOLD = 4;

type SessionListener = () => void;

/**
 * Manages a single drag-sort session across one container.
 *
 * Lifecycle:
 *   1. Consumer calls `startDrag()` from a pointerdown on a child element.
 *   2. Engine listens for pointermove/up on document.
 *   3. After threshold crossing, ghost is created and dropIndex is updated.
 *   4. On pointerup, `onSort` fires if the item moved.
 *   5. ESC cancels the drag.
 */
export class SortEngine {
  private session: SortSession | null = null;
  private containerEl: HTMLElement | null = null;
  private containerOptions: SortContainerOptions | null = null;
  private listeners = new Set<SessionListener>();

  // Bound handlers for add/remove
  private handleMove = this.onPointerMove.bind(this);
  private handleUp = this.onPointerUp.bind(this);
  private handleKeyDown = this.onKeyDown.bind(this);

  // ── Container registration ────────────────────────────────────────────

  registerContainer(
    el: HTMLElement,
    options: SortContainerOptions,
  ): () => void {
    this.containerEl = el;
    this.containerOptions = options;
    return () => {
      if (this.containerEl === el) {
        this.containerEl = null;
        this.containerOptions = null;
      }
    };
  }

  // ── Session access ────────────────────────────────────────────────────

  getSession(): SortSession | null {
    return this.session;
  }

  onSessionChange(cb: SessionListener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // ── Start drag ────────────────────────────────────────────────────────

  startDrag<T>(
    e: PointerEvent,
    childIndex: number,
    options: SortDragOptions<T>,
  ): void {
    if (this.session) return;

    const direction = options.direction ?? 'vertical';
    const startPos = direction === 'vertical' ? e.clientY : e.clientX;

    this.session = {
      fromIndex: childIndex,
      dropIndex: childIndex,
      item: options.item,
      active: false,
      startPos,
      ghost: null,
      direction,
    };

    // Store options on the session for use in handlers
    (this.session as SortSessionInternal<T>)._options = options;

    document.addEventListener('pointermove', this.handleMove);
    document.addEventListener('pointerup', this.handleUp);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  // ── Pointer handlers ──────────────────────────────────────────────────

  private onPointerMove(e: PointerEvent): void {
    const s = this.session;
    if (!s) return;

    const pos = s.direction === 'vertical' ? e.clientY : e.clientX;
    const threshold =
      (s as SortSessionInternal)._options?.threshold ?? DEFAULT_THRESHOLD;

    if (!s.active) {
      if (Math.abs(pos - s.startPos) < threshold) return;
      s.active = true;
      this.createGhost(e);
    }

    // Move ghost
    if (s.ghost) {
      if (s.direction === 'vertical') {
        s.ghost.style.top = `${e.clientY - s.ghost.offsetHeight / 2}px`;
      } else {
        s.ghost.style.left = `${e.clientX - s.ghost.offsetWidth / 2}px`;
      }
    }

    // Compute drop index
    const dropIndex = this.computeDropIndex(e);
    if (dropIndex !== s.dropIndex) {
      s.dropIndex = dropIndex;
      this.notify();
    }
  }

  private onPointerUp(): void {
    const s = this.session;
    if (!s) {
      this.cleanup();
      return;
    }

    if (s.active && this.containerOptions) {
      this.containerOptions.onSort({
        fromIndex: s.fromIndex,
        toIndex: s.dropIndex,
        item: s.item,
      });
    }

    this.cleanup();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cleanup();
    }
  }

  // ── Ghost ─────────────────────────────────────────────────────────────

  private createGhost(e: PointerEvent): void {
    const s = this.session as SortSessionInternal | null;
    if (!s || !this.containerEl) return;

    const opts = s._options;
    const children = Array.from(this.containerEl.children) as HTMLElement[];
    const sourceEl = children[s.fromIndex];
    if (!sourceEl) return;

    if (opts?.renderGhost) {
      s.ghost = opts.renderGhost(s.item, sourceEl);
    } else {
      s.ghost = this.defaultGhost(sourceEl, e);
    }

    if (s.ghost) {
      document.body.appendChild(s.ghost);
    }

    this.notify();
  }

  private defaultGhost(sourceEl: HTMLElement, e: PointerEvent): HTMLElement {
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true) as HTMLElement;

    ghost.style.position = 'fixed';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${e.clientY - rect.height / 2}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.85';
    ghost.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    ghost.style.borderRadius = '4px';
    ghost.style.transition = 'none';

    return ghost;
  }

  // ── Hit test ──────────────────────────────────────────────────────────

  private computeDropIndex(e: PointerEvent): number {
    if (!this.containerEl) return this.session?.fromIndex ?? 0;

    const children = Array.from(this.containerEl.children) as HTMLElement[];
    const isVertical = this.session?.direction === 'vertical';
    const pos = isVertical ? e.clientY : e.clientX;

    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = isVertical
        ? rect.top + rect.height / 2
        : rect.left + rect.width / 2;
      if (pos < mid) return i;
    }

    return children.length;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  private cleanup(): void {
    if (this.session?.ghost) {
      this.session.ghost.remove();
    }

    this.session = null;

    document.removeEventListener('pointermove', this.handleMove);
    document.removeEventListener('pointerup', this.handleUp);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.notify();
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }
}

/** Internal extension to attach options to the session. */
interface SortSessionInternal<T = unknown> extends SortSession<T> {
  _options?: SortDragOptions<T>;
}

/** Module-level singleton. */
let instance: SortEngine | null = null;

export function getSortEngine(): SortEngine {
  if (!instance) instance = new SortEngine();
  return instance;
}
