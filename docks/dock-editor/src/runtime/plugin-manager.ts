import type {
  LayoutPluginContext,
  LayoutPluginDefinition,
  LayoutPluginInstance,
} from './types.js';

interface ManagedPlugin {
  definition: LayoutPluginDefinition;
  instance?: LayoutPluginInstance;
}

export class PluginManager {
  private plugins: ManagedPlugin[] = [];

  register(definition: LayoutPluginDefinition): void {
    this.plugins.push({ definition });
  }

  registerAll(definitions: LayoutPluginDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  async setupAll(ctx: LayoutPluginContext): Promise<void> {
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
