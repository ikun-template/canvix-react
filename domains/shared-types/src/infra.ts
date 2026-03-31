/*
 * Description: Shared infrastructure interfaces — HookSystem, EventBus.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

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
