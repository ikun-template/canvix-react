import type { WidgetDefinition } from './types.js';

export interface WidgetRegistry {
  register(definition: WidgetDefinition): void;
  registerAll(definitions: WidgetDefinition[]): void;
  get(type: string): WidgetDefinition | undefined;
  getAll(): WidgetDefinition[];
  getByCategory(category: string): WidgetDefinition[];
  has(type: string): boolean;
}

export function createWidgetRegistry(): WidgetRegistry {
  const map = new Map<string, WidgetDefinition>();

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
