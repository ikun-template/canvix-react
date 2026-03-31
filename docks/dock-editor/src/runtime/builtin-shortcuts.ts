/*
 * Description: Built-in editor keyboard shortcuts — registered directly by Runtime.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { Chronicle } from '@canvix-react/chronicle';
import type { EventBus } from '@canvix-react/infra';

import type { ShortcutManager } from './shortcut-manager.js';

/**
 * Registers core editor shortcuts. Returns cleanup functions.
 */
export function registerBuiltinShortcuts(
  shortcuts: ShortcutManager,
  chronicle: Chronicle,
  events: EventBus,
): (() => void)[] {
  return [
    shortcuts.register('mod+z', { handler: () => chronicle.undo() }),
    shortcuts.register('mod+shift+z', { handler: () => chronicle.redo() }),
    shortcuts.register('delete', {
      handler: () => events.emit('editor:delete-selected', undefined),
    }),
    shortcuts.register('backspace', {
      handler: () => events.emit('editor:delete-selected', undefined),
    }),
    shortcuts.register('mod+a', {
      handler: () => events.emit('editor:select-all', undefined),
    }),
    shortcuts.register('mod+s', {
      handler: () => events.emit('editor:save', undefined),
    }),
  ];
}
