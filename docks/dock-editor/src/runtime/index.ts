/*
 * Description: Editor runtime — initializes Chronicle, HookSystem, EventBus, Store
 *              and manages plugins, dirty tracking, save, and built-in event handlers.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { OperationModel, UpdateOptions } from '@canvix-react/chronicle';
import { Chronicle } from '@canvix-react/chronicle';
import type {
  DraftSession,
  EditorConfig,
  EditorWidgetPluginDefinition,
  LayoutPluginDefinition,
  ServicePluginContext,
  ServicePluginDefinition,
  WidgetRegistry,
} from '@canvix-react/editor-types';
import { EventBus, HookSystem } from '@canvix-react/infra';
import {
  LayoutPluginManager,
  ServicePluginManager,
} from '@canvix-react/plugin-manager';
import type { DocumentRuntime } from '@canvix-react/schema-document';
import { EditorStateStore } from '@canvix-react/toolkit-editor';
import { createWidgetRegistry } from '@canvix-react/widget-registry';

import { registerBuiltinShortcuts } from './builtin-shortcuts.js';
import { createDraftSession } from './draft-session.js';
import { ShortcutManager } from './shortcut-manager.js';
import { TokenResolver } from './token-resolver.js';

export interface SaveAdapter {
  serialize(document: DocumentRuntime): string;
  persist(documentId: string, data: string): Promise<void>;
}

export interface RuntimeOptions {
  document: DocumentRuntime;
  widgets: EditorWidgetPluginDefinition[];
  config: EditorConfig;
  plugins: LayoutPluginDefinition[];
  servicePlugins?: ServicePluginDefinition[];
  documentId?: string;
  saveAdapter?: SaveAdapter;
}

export class Runtime {
  readonly chronicle: Chronicle;
  readonly hooks: HookSystem;
  readonly events: EventBus;
  readonly registry: WidgetRegistry;
  readonly store: EditorStateStore;
  readonly tokenResolver: TokenResolver;
  readonly shortcuts: ShortcutManager;
  readonly layoutPlugins: LayoutPluginManager;

  private readonly _options: RuntimeOptions;
  private readonly servicePlugins: ServicePluginManager;
  private _cleanups: (() => void)[] = [];

  constructor(options: RuntimeOptions) {
    this._options = options;
    this.chronicle = new Chronicle(options.document);
    this.hooks = new HookSystem();
    this.events = new EventBus();
    this.registry = createWidgetRegistry();
    this.registry.registerAll(options.widgets);
    this.store = new EditorStateStore({
      initialPageId: options.document.pages[0]?.id,
    });
    this.tokenResolver = new TokenResolver();
    this.shortcuts = new ShortcutManager();
    this.layoutPlugins = new LayoutPluginManager();
    this.servicePlugins = new ServicePluginManager();

    this.layoutPlugins.registerAll(options.plugins);
    if (options.servicePlugins) {
      this.servicePlugins.registerAll(options.servicePlugins);
    }

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
  }

  async start(): Promise<void> {
    // Dirty tracking: mark document dirty on any chronicle change
    this._cleanups.push(
      this.chronicle.onUpdate(() => {
        this.store.setDirty(true);
      }),
    );

    // Built-in event handlers
    this._cleanups.push(
      this.events.on('editor:delete-selected', () => {
        const { selectedWidgetIds, activePageId } = this.store.getSnapshot();
        if (selectedWidgetIds.length === 0) return;
        const doc = this.chronicle.getDocument();
        const page = doc.pages.find(p => p.id === activePageId);
        if (!page) return;
        const indices = selectedWidgetIds
          .map(id => page.widgets.findIndex(w => w.id === id))
          .filter(i => i >= 0)
          .sort((a, b) => b - a);
        if (indices.length === 0) return;
        this.update({
          target: 'page',
          id: activePageId,
          operations: indices.map(index => ({
            kind: 'array:remove' as const,
            chain: ['widgets'],
            index,
          })),
        });
        this.store.setSelection([]);
      }),
      this.events.on('editor:select-all', () => {
        const { activePageId } = this.store.getSnapshot();
        const doc = this.chronicle.getDocument();
        const page = doc.pages.find(p => p.id === activePageId);
        if (!page) return;
        this.store.setSelection(page.widgets.map(w => w.id));
      }),
      this.events.on('editor:save', () => {
        this.save();
      }),
    );

    // Built-in shortcuts (not a ServicePlugin — these are core editor capabilities)
    this._cleanups.push(
      ...registerBuiltinShortcuts(this.shortcuts, this.chronicle, this.events),
    );

    // ServicePlugin lifecycle: setup → mount → activate
    const ctx: ServicePluginContext = {
      hooks: this.hooks,
      events: this.events,
      chronicle: this.chronicle,
      registry: this.registry,
      shortcuts: this.shortcuts,
      store: this.store,
      update: this.update,
      beginDraft: this.beginDraft,
    };
    await this.servicePlugins.setupAll(ctx);
    await this.servicePlugins.mountAll();
    await this.servicePlugins.activateAll();

    // Attach shortcut listener after all plugins have registered their bindings
    this.shortcuts.attach();

    this.hooks.call('app:ready', undefined);
  }

  async destroy(): Promise<void> {
    this.hooks.call('app:beforeDestroy', undefined);

    // ServicePlugin teardown (reverse order): deactivate → unmount → destroy
    await this.servicePlugins.deactivateAll();
    await this.servicePlugins.unmountAll();
    await this.servicePlugins.destroyAll();

    // Cleanup subscriptions
    for (const fn of this._cleanups) fn();
    this._cleanups = [];

    this.shortcuts.destroy();
    this.hooks.clear();
    this.events.clear();
  }

  /** Hook-integrated update: fires operation:before / operation:after hooks. */
  update = (model: OperationModel, options?: UpdateOptions): void => {
    const finalModel = this.hooks.call<OperationModel>(
      'operation:before',
      model,
    );
    this.chronicle.update(finalModel, options);
    this.hooks.call('operation:after', finalModel);
  };

  /** Create a draft session for preview changes (drag, live edit). */
  beginDraft = (): DraftSession => {
    return createDraftSession(this.chronicle);
  };

  /** Save document via adapter: beforeSave hook → serialize → persist → saved hook. */
  async save(): Promise<void> {
    const { saveAdapter, documentId } = this._options;
    if (!saveAdapter || !documentId) return;

    const doc = this.chronicle.getDocument();
    const processed = this.hooks.call('document:beforeSave', { document: doc });
    const data = saveAdapter.serialize(processed.document ?? doc);
    await saveAdapter.persist(documentId, data);
    this.hooks.call('document:saved', undefined);
    this.store.setDirty(false);
  }

  /**
   * Returns all data needed by EditorShell to construct React contexts.
   * No React types — pure data + methods.
   */
  getEditorContext() {
    return {
      config: this._options.config,
      chronicle: this.chronicle,
      registry: this.registry,
      plugins: this._options.plugins.map(p => ({ name: p.name, slot: p.slot })),
      store: this.store,
      update: this.update,
      beginDraft: this.beginDraft,
      save: () => this.save(),
      getDocument: () => this.chronicle.getDocument(),
      subscribeDocument: (cb: () => void) =>
        this.chronicle.onUpdate(model => {
          if (model.target === 'document') cb();
        }),
    };
  }
}
