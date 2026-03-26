/*
 * Description: Service plugin manager — full lifecycle management for ServicePlugins.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type {
  ServicePluginContext,
  ServicePluginDefinition,
  ServicePluginInstance,
} from '@canvix-react/editor-types';

interface ManagedServicePlugin {
  definition: ServicePluginDefinition;
  instance?: ServicePluginInstance;
}

export class ServicePluginManager {
  private plugins: ManagedServicePlugin[] = [];

  register(definition: ServicePluginDefinition): void {
    this.plugins.push({ definition });
  }

  registerAll(definitions: ServicePluginDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  async setupAll(ctx: ServicePluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      plugin.instance = await plugin.definition.setup(ctx);
    }
  }

  async mountAll(): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.instance?.mount?.();
    }
  }

  async activateAll(): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.instance?.activate?.();
    }
  }

  async deactivateAll(): Promise<void> {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      await this.plugins[i].instance?.deactivate?.();
    }
  }

  async unmountAll(): Promise<void> {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      await this.plugins[i].instance?.unmount?.();
    }
  }

  async destroyAll(): Promise<void> {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      await this.plugins[i].instance?.destroy?.();
    }
    this.plugins = [];
  }
}
