/*
 * Description: dock-viewer public API.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export { ViewerRuntime, type ViewerRuntimeOptions } from './runtime/index.js';
export {
  TokenResolver,
  type ResolveContext,
  type TokenHandler,
} from './runtime/token-resolver.js';
export type { ViewerPluginContext } from './runtime/types.js';

// Re-export shared types for viewer consumers
export type {
  LayoutPluginDefinition,
  WidgetPluginDefinition,
  WidgetRegistry,
} from '@canvix-react/shared-types';
