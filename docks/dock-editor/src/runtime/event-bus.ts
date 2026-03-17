export interface EventMap {
  [key: string]: unknown;
}

type Listener<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<K extends string>(event: K, listener: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener);
    return () => {
      set!.delete(listener as Listener);
    };
  }

  emit<K extends string>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) fn(data);
  }

  off(event: string): void {
    this.listeners.delete(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}
