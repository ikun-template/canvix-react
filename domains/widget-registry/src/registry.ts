/*
 * Description: Widget registry implementation.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type {
  WidgetPluginDefinition,
  WidgetRegistry,
} from '@canvix-react/editor-types';

export function createWidgetRegistry(): WidgetRegistry {
  const map = new Map<string, WidgetPluginDefinition>();

  return {
    register(definition) {
      map.set(definition.type, definition);
    },

    registerAll(definitions) {
      for (const def of definitions) {
        map.set(def.type, def);
      }
    },

    get(type) {
      return map.get(type);
    },

    getAll() {
      return Array.from(map.values());
    },

    getByCategory(category) {
      return Array.from(map.values()).filter(d => d.meta.category === category);
    },

    has(type) {
      return map.has(type);
    },
  };
}
