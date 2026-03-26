/*
 * Description: Plugin system interfaces — LayoutPlugin, ServicePlugin, HookSystem, EventBus.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type {
  Chronicle,
  OperationModel,
  UpdateOptions,
} from '@canvix-react/chronicle';
import type { ComponentType } from 'react';

import type { EditorStore } from './editor-state.js';
import type { WidgetRegistry } from './widget.js';

// ── Layout Plugin ──────────────────────────────────────────────────────────

export interface LayoutPluginDefinition {
  /** Unique identifier. */
  name: string;
  /** Slot name this plugin renders into (e.g. 'canvas', 'sidebar'). */
  slot: string;
  /** React component rendered via portal into the slot (no props). */
  component: ComponentType;
}

// ── Service Plugin ─────────────────────────────────────────────────────────

export interface ServicePluginDefinition {
  /** Unique identifier. */
  name: string;
  /** Initialization entry, returns lifecycle instance. */
  setup(
    ctx: ServicePluginContext,
  ): ServicePluginInstance | Promise<ServicePluginInstance>;
}

export interface ServicePluginContext {
  /** Runtime hook system. */
  hooks: HookSystem;
  /** Inter-plugin event bus. */
  events: EventBus;
  /** Document data engine. */
  chronicle: Chronicle;
  /** Widget component registry. */
  registry: WidgetRegistry;
  /** Keyboard shortcut manager. */
  shortcuts: ShortcutRegistry;
  /** Editor UI state store. */
  store: EditorStore;
  /** Hook-integrated update: fires operation:before / operation:after hooks. */
  update(model: OperationModel, options?: UpdateOptions): void;
  /** Create a draft session for preview changes (drag, live edit). */
  beginDraft(): DraftSession;
}

export interface ServicePluginInstance {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  unmount?(): void | Promise<void>;
  destroy?(): void | Promise<void>;
}

// ── Draft Session ──────────────────────────────────────────────────────────

export interface DraftSession {
  /** Apply a temporary change (not pushed to history). */
  update(model: OperationModel): void;
  /** Commit all temp changes as a single history entry. */
  commit(): void;
  /** Rollback all temp changes, restoring original state. */
  rollback(): void;
}

// ── Hook System ────────────────────────────────────────────────────────────

export interface HookSystem {
  register(name: string, type?: 'sync' | 'waterfall'): void;
  on<T = unknown>(
    name: string,
    handler: ((data: T) => void) | ((data: T) => T | void),
  ): () => void;
  call<T>(name: string, data: T): T;
  clear(): void;
}

// ── Shortcut Registry ─────────────────────────────────────────────────────

export interface ShortcutBinding {
  /** Handler function invoked when the shortcut fires. */
  handler: () => void;
  /** Optional guard — shortcut only fires when this returns true. */
  when?: () => boolean;
}

export interface ShortcutRegistry {
  /**
   * Register a keyboard shortcut. Returns an unsubscribe function.
   * Combo format: `mod+s`, `mod+z`, `mod+shift+z`, `delete`, `mod+a`
   * - `mod` maps to Cmd (macOS) / Ctrl (others)
   */
  register(combo: string, binding: ShortcutBinding): () => void;
}

// ── Event Bus ──────────────────────────────────────────────────────────────

export interface EventMap {
  [key: string]: unknown;
}

export interface EventBus {
  on<K extends string>(
    event: K,
    listener: (data: EventMap[K]) => void,
  ): () => void;
  emit<K extends string>(event: K, data: EventMap[K]): void;
  off(event: string): void;
  clear(): void;
}
