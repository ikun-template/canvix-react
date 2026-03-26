/*
 * Description: Internal runtime types for dock-editor (not exported publicly).
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type {
  DraftSession,
  EventBus,
  HookSystem,
  WidgetRegistry,
} from '@canvix-react/editor-types';

import type { ResolveContext, TokenResolver } from './token-resolver.js';

/**
 * Internal runtime context — superset of ServicePluginContext.
 * Contains Runtime-private capabilities (resolveToken).
 * Not exported to consumers.
 */
export interface RuntimeContext {
  hooks: HookSystem;
  events: EventBus;
  chronicle: Chronicle;
  registry: WidgetRegistry;
  tokenResolver: TokenResolver;

  /** Hook-integrated update: fires operation:before / operation:after hooks. */
  update(model: OperationModel, options?: UpdateOptions): void;
  /** Create a draft session for preview changes (drag, live edit). */
  beginDraft(): DraftSession;
  /** Resolve token strings like `{theme.primary}` with context. */
  resolveToken(value: string, context: ResolveContext): string;
}
