import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type { WidgetRegistry } from '@canvix-react/widget-registry';

import type { EditorState } from './editor-state.js';
import type { EventBus } from './event-bus.js';
import type { HookSystem } from './hook-system.js';
import type { TempSession } from './temp-session.js';
import type { ResolveContext, TokenResolver } from './token-resolver.js';

export interface PluginContext {
  hooks: HookSystem;
  events: EventBus;
  chronicle: Chronicle;
  editorState: EditorState;
  registry: WidgetRegistry;
  tokenResolver: TokenResolver;
  getSlotElement(name: string): HTMLElement | null;

  /** Hook-integrated update: fires operation:before / operation:after hooks. */
  update(model: OperationModel, options?: UpdateOptions): void;
  /** Create a temp session for preview changes (drag, live edit). */
  beginTemp(): TempSession;
  /** Resolve token strings like `{theme.primary}` with context. */
  resolveToken(value: string, context: ResolveContext): string;
}

export interface PluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

export interface PluginDefinition {
  name: string;
  setup(ctx: PluginContext): PluginInstance | Promise<PluginInstance>;
}
