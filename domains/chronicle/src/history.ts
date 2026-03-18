import type { OperationModel } from './types.js';

export interface HistoryEntry {
  forward: OperationModel;
  backward: OperationModel;
}

export class History {
  private stack: HistoryEntry[] = [];
  private cursor = -1;
  private _capacity: number;

  constructor(capacity = 100) {
    this._capacity = capacity;
  }

  get capacity(): number {
    return this._capacity;
  }

  get canUndo(): boolean {
    return this.cursor >= 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.stack.length - 1;
  }

  get length(): number {
    return this.stack.length;
  }

  push(entry: HistoryEntry): void {
    this.stack.splice(this.cursor + 1);
    this.stack.push(entry);

    if (this.stack.length > this._capacity) {
      this.stack.shift();
    } else {
      this.cursor++;
    }
  }

  merge(entry: HistoryEntry): void {
    if (this.cursor < 0) {
      this.push(entry);
      return;
    }

    const current = this.stack[this.cursor];
    current.forward = {
      ...current.forward,
      operations: [...current.forward.operations, ...entry.forward.operations],
    } as OperationModel;
    current.backward = {
      ...current.backward,
      operations: [
        ...entry.backward.operations,
        ...current.backward.operations,
      ],
    } as OperationModel;
  }

  undo(): HistoryEntry | undefined {
    if (!this.canUndo) return undefined;
    return this.stack[this.cursor--];
  }

  redo(): HistoryEntry | undefined {
    if (!this.canRedo) return undefined;
    return this.stack[++this.cursor];
  }

  clear(): void {
    this.stack.length = 0;
    this.cursor = -1;
  }
}
