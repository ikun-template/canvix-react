/*
 * Description: Viewer runtime types.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { Chronicle } from '@canvix-react/chronicle';
import type {
  EventBus,
  HookSystem,
  LayoutPluginDefinition,
  WidgetRegistry,
} from '@canvix-react/shared-types';

import type { ResolveContext, TokenResolver } from './token-resolver.js';

export type { LayoutPluginDefinition };

export interface ViewerPluginContext {
  hooks: HookSystem;
  events: EventBus;
  chronicle: Chronicle;
  registry: WidgetRegistry;
  tokenResolver: TokenResolver;
  getSlotElement(name: string): HTMLElement | null;
  resolveToken(value: string, context: ResolveContext): string;
}
