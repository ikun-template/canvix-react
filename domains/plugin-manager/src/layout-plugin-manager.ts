/*
 * Description: Layout plugin manager — stores LayoutPluginDefinition entries (no lifecycle).
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { LayoutPluginDefinition } from '@canvix-react/editor-types';

export class LayoutPluginManager {
  private plugins: LayoutPluginDefinition[] = [];

  register(definition: LayoutPluginDefinition): void {
    this.plugins.push(definition);
  }

  registerAll(definitions: LayoutPluginDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  getAll(): LayoutPluginDefinition[] {
    return this.plugins;
  }

  get(name: string): LayoutPluginDefinition | undefined {
    return this.plugins.find(p => p.name === name);
  }
}
