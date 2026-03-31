/*
 * Description: Keyboard shortcut registration and dispatch system.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { ShortcutBinding } from '@canvix-react/editor-types';

export type { ShortcutBinding };

interface NormalizedCombo {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Manages keyboard shortcut registration and dispatching.
 *
 * Combo format examples: `mod+s`, `mod+z`, `mod+shift+z`, `delete`, `mod+a`
 * - `mod` maps to Cmd (macOS) / Ctrl (others)
 * - Keys are case-insensitive
 */
export class ShortcutManager {
  private bindings = new Map<string, ShortcutBinding>();
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  /** Register a keyboard shortcut. Returns an unsubscribe function. */
  register(combo: string, binding: ShortcutBinding): () => void {
    const key = normalizeComboString(combo);
    this.bindings.set(key, binding);
    return () => {
      if (this.bindings.get(key) === binding) {
        this.bindings.delete(key);
      }
    };
  }

  /** Attach the global keydown listener. */
  attach(): void {
    if (this.keydownHandler) return;

    this.keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (SKIP_TAGS.has(tag)) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      const combo = eventToCombo(e);
      const binding = this.bindings.get(combo);
      if (!binding) return;
      if (binding.when && !binding.when()) return;

      e.preventDefault();
      binding.handler();
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  /** Detach listener and clear all bindings. */
  destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.bindings.clear();
  }
}

function normalizeComboString(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map(p => p.trim());
  const mod = parts.includes('mod');
  const shift = parts.includes('shift');
  const alt = parts.includes('alt');
  const key =
    parts.find(p => p !== 'mod' && p !== 'shift' && p !== 'alt') ?? '';
  return buildKey({ mod, shift, alt, key });
}

function eventToCombo(e: KeyboardEvent): string {
  const combo: NormalizedCombo = {
    mod: e.metaKey || e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    key: e.key.toLowerCase(),
  };
  return buildKey(combo);
}

function buildKey(c: NormalizedCombo): string {
  let k = '';
  if (c.mod) k += 'mod+';
  if (c.shift) k += 'shift+';
  if (c.alt) k += 'alt+';
  k += c.key;
  return k;
}
