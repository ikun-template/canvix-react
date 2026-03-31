/*
 * Description: Viewer runtime — minimal runtime for read-only document rendering.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { Chronicle } from '@canvix-react/chronicle';
import { EventBus, HookSystem } from '@canvix-react/infra';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import type {
  LayoutPluginDefinition,
  WidgetRegistry,
} from '@canvix-react/shared-types';

import { TokenResolver } from './token-resolver.js';
import type { ViewerPluginContext } from './types.js';

export interface ViewerRuntimeOptions {
  document: DocumentRuntime;
  registry: WidgetRegistry;
  plugins: LayoutPluginDefinition[];
  container: HTMLElement;
}

export class ViewerRuntime {
  readonly chronicle: Chronicle;
  readonly hooks: HookSystem;
  readonly events: EventBus;
  readonly registry: WidgetRegistry;
  readonly tokenResolver: TokenResolver;

  private plugins: LayoutPluginDefinition[];
  private container: HTMLElement;

  constructor(options: ViewerRuntimeOptions) {
    this.chronicle = new Chronicle(options.document);
    this.hooks = new HookSystem();
    this.events = new EventBus();
    this.registry = options.registry;
    this.tokenResolver = new TokenResolver();
    this.plugins = options.plugins;
    this.container = options.container;

    this.hooks.register('app:ready', 'sync');
    this.hooks.register('app:beforeDestroy', 'sync');
  }

  getPlugins(): LayoutPluginDefinition[] {
    return this.plugins;
  }

  createPluginContext(): ViewerPluginContext {
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

  async start(): Promise<void> {
    this.hooks.call('app:ready', undefined);
  }

  async destroy(): Promise<void> {
    this.hooks.call('app:beforeDestroy', undefined);
    this.hooks.clear();
    this.events.clear();
  }
}
