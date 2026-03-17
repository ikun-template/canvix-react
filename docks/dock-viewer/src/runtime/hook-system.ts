type SyncHandler<T = unknown> = (data: T) => void;
type WaterfallHandler<T = unknown> = (data: T) => T | void;

interface HookEntry {
  type: 'sync' | 'waterfall';
  handlers: Array<SyncHandler | WaterfallHandler>;
}

export class HookSystem {
  private hooks = new Map<string, HookEntry>();

  register(name: string, type: 'sync' | 'waterfall' = 'sync'): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, { type, handlers: [] });
    }
  }

  on<T = unknown>(
    name: string,
    handler: SyncHandler<T> | WaterfallHandler<T>,
  ): () => void {
    let entry = this.hooks.get(name);
    if (!entry) {
      entry = { type: 'sync', handlers: [] };
      this.hooks.set(name, entry);
    }
    entry.handlers.push(handler as SyncHandler);
    return () => {
      const idx = entry!.handlers.indexOf(handler as SyncHandler);
      if (idx >= 0) entry!.handlers.splice(idx, 1);
    };
  }

  call<T>(name: string, data: T): T {
    const entry = this.hooks.get(name);
    if (!entry) return data;

    if (entry.type === 'waterfall') {
      let current = data;
      for (const handler of entry.handlers) {
        const result = (handler as WaterfallHandler<T>)(current);
        if (result !== undefined) current = result;
      }
      return current;
    }

    for (const handler of entry.handlers) {
      (handler as SyncHandler<T>)(data);
    }
    return data;
  }

  clear(): void {
    this.hooks.clear();
  }
}
