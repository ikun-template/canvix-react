import { Chronicle } from '@canvix-react/chronicle';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import type { WidgetRegistry } from '@canvix-react/widget-registry';

import { EventBus } from './event-bus.js';
import { HookSystem } from './hook-system.js';
import { PluginManager } from './plugin-manager.js';
import { TokenResolver } from './token-resolver.js';
import type { PluginContext, PluginDefinition } from './types.js';

export interface ViewerRuntimeOptions {
  document: DocumentRuntime;
  registry: WidgetRegistry;
  plugins: PluginDefinition[];
  container: HTMLElement;
}

export class ViewerRuntime {
  readonly chronicle: Chronicle;
  readonly hooks: HookSystem;
  readonly events: EventBus;
  readonly registry: WidgetRegistry;
  readonly tokenResolver: TokenResolver;

  private pluginManager: PluginManager;
  private container: HTMLElement;

  constructor(options: ViewerRuntimeOptions) {
    this.chronicle = new Chronicle(options.document);
    this.hooks = new HookSystem();
    this.events = new EventBus();
    this.registry = options.registry;
    this.tokenResolver = new TokenResolver();
    this.pluginManager = new PluginManager();
    this.container = options.container;

    this.hooks.register('app:ready', 'sync');
    this.hooks.register('app:beforeDestroy', 'sync');

    this.pluginManager.registerAll(options.plugins);
  }

  async start(): Promise<void> {
    const ctx = this.createPluginContext();
    await this.pluginManager.setupAll(ctx);
    await this.pluginManager.mountAll();
    await this.pluginManager.activateAll();
    this.hooks.call('app:ready', undefined);
  }

  async destroy(): Promise<void> {
    this.hooks.call('app:beforeDestroy', undefined);
    await this.pluginManager.deactivateAll();
    await this.pluginManager.unmountAll();
    await this.pluginManager.destroyAll();
    this.hooks.clear();
    this.events.clear();
  }

  private createPluginContext(): PluginContext {
    const { tokenResolver } = this;

    return {
      hooks: this.hooks,
      events: this.events,
      chronicle: this.chronicle,
      registry: this.registry,
      tokenResolver,
      getSlotElement: (name: string) =>
        this.container.querySelector<HTMLElement>(`[data-slot="${name}"]`),

      resolveToken(value: string, context) {
        return tokenResolver.resolve(value, context);
      },
    };
  }
}
