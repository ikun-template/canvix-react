/*
 * Description: Built-in shortcuts ServicePlugin — registers core editor keyboard shortcuts.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { ServicePluginDefinition } from '@canvix-react/editor-types';

export const builtinShortcuts: ServicePluginDefinition = {
  name: 'builtin:shortcuts',
  setup(ctx) {
    let unsubs: (() => void)[] = [];

    return {
      activate() {
        unsubs = [
          ctx.shortcuts.register('mod+z', {
            handler: () => ctx.chronicle.undo(),
          }),
          ctx.shortcuts.register('mod+shift+z', {
            handler: () => ctx.chronicle.redo(),
          }),
          ctx.shortcuts.register('delete', {
            handler: () => ctx.events.emit('editor:delete-selected', undefined),
          }),
          ctx.shortcuts.register('backspace', {
            handler: () => ctx.events.emit('editor:delete-selected', undefined),
          }),
          ctx.shortcuts.register('mod+a', {
            handler: () => ctx.events.emit('editor:select-all', undefined),
          }),
          ctx.shortcuts.register('mod+s', {
            handler: () => ctx.events.emit('editor:save', undefined),
          }),
        ];
      },

      deactivate() {
        for (const unsub of unsubs) unsub();
        unsubs = [];
      },
    };
  },
};
