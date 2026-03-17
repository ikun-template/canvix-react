import type {
  PluginContext,
  PluginDefinition,
  PluginInstance,
} from './types.js';

interface ManagedPlugin {
  definition: PluginDefinition;
  instance?: PluginInstance;
}

export class PluginManager {
  private plugins: ManagedPlugin[] = [];

  register(definition: PluginDefinition): void {
    this.plugins.push({ definition });
  }

  registerAll(definitions: PluginDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  async setupAll(ctx: PluginContext): Promise<void> {
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
