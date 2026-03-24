import type { OperationModel, UpdateOptions } from '@canvix-react/chronicle';
import { Chronicle } from '@canvix-react/chronicle';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import type { WidgetRegistry } from '@canvix-react/widget-registry';

import { EventBus } from './event-bus.js';
import { HookSystem } from './hook-system.js';
import { PluginManager } from './plugin-manager.js';
import { createTempSession } from './temp-session.js';
import { TokenResolver } from './token-resolver.js';
import type { LayoutPluginContext, LayoutPluginDefinition } from './types.js';

export interface RuntimeOptions {
  document: DocumentRuntime;
  registry: WidgetRegistry;
  plugins: LayoutPluginDefinition[];
  container: HTMLElement;
}

export class Runtime {
  readonly chronicle: Chronicle;
  readonly hooks: HookSystem;
  readonly events: EventBus;
  readonly registry: WidgetRegistry;
  readonly tokenResolver: TokenResolver;

  private pluginManager: PluginManager;
  private container: HTMLElement;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private _ctx: LayoutPluginContext | null = null;

  constructor(options: RuntimeOptions) {
    this.chronicle = new Chronicle(options.document);
    this.hooks = new HookSystem();
    this.events = new EventBus();
    this.registry = options.registry;
    this.tokenResolver = new TokenResolver();
    this.pluginManager = new PluginManager();
    this.container = options.container;

    // 注册内置钩子
    this.hooks.register('app:ready', 'sync');
    this.hooks.register('app:beforeDestroy', 'sync');
    this.hooks.register('document:loaded', 'sync');
    this.hooks.register('document:beforeSave', 'waterfall');
    this.hooks.register('document:saved', 'sync');
    this.hooks.register('operation:before', 'waterfall');
    this.hooks.register('operation:after', 'sync');
    this.hooks.register('page:beforeSwitch', 'waterfall');
    this.hooks.register('page:switched', 'sync');

    this.pluginManager.registerAll(options.plugins);
  }

  async start(): Promise<void> {
    // Undo / Redo keyboard shortcuts
    this.keydownHandler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      // Skip when user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      e.preventDefault();
      if (e.shiftKey) {
        this.chronicle.redo();
      } else {
        this.chronicle.undo();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    const ctx = this.getPluginContext();
    await this.pluginManager.setupAll(ctx);
    await this.pluginManager.mountAll();
    await this.pluginManager.activateAll();
    this.hooks.call('app:ready', undefined);
  }

  async destroy(): Promise<void> {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.hooks.call('app:beforeDestroy', undefined);
    await this.pluginManager.deactivateAll();
    await this.pluginManager.unmountAll();
    await this.pluginManager.destroyAll();
    this.hooks.clear();
    this.events.clear();
  }

  /** Returns the shared LayoutPluginContext (created once, cached). */
  getPluginContext(): LayoutPluginContext {
    if (!this._ctx) {
      this._ctx = this.createPluginContext();
    }
    return this._ctx;
  }

  private createPluginContext(): LayoutPluginContext {
    const { chronicle, hooks, tokenResolver } = this;

    return {
      hooks: this.hooks,
      events: this.events,
      chronicle: this.chronicle,
      registry: this.registry,
      tokenResolver,
      getSlotElement: (name: string) =>
        this.container.querySelector<HTMLElement>(`[data-slot="${name}"]`),

      update(model: OperationModel, options?: UpdateOptions) {
        // Fire before hook (waterfall — plugins can transform the operation)
        const finalModel = hooks.call<OperationModel>(
          'operation:before',
          model,
        );
        chronicle.update(finalModel, options);
        hooks.call('operation:after', finalModel);
      },

      beginTemp() {
        return createTempSession(chronicle);
      },

      resolveToken(value: string, context) {
        return tokenResolver.resolve(value, context);
      },
    };
  }
}
