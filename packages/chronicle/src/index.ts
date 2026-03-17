import type { DocumentRuntime } from '@canvix-react/schema-document';

import { History } from './history.js';
import { applyOps } from './operation.js';
import type { OperationModel, UpdateOptions } from './types.js';

export type {
  OperationModel,
  DocumentOperation,
  PageOperation,
  WidgetOperation,
} from './types.js';
export type {
  Op,
  OpUpdate,
  OpArrayInsert,
  OpArrayRemove,
  OpAdd,
  OpDelete,
  OpMove,
} from './types.js';
export type { Chain, UpdateOptions } from './types.js';
export { applyOp, applyOps } from './operation.js';
export { History } from './history.js';
export { hasFieldChanged } from './utils.js';

type UpdateListener = (model: OperationModel) => void;

export class Chronicle {
  private doc: DocumentRuntime;
  private history: History;
  private listeners: Set<UpdateListener> = new Set();

  constructor(doc: DocumentRuntime, historyCapacity?: number) {
    this.doc = doc;
    this.history = new History(historyCapacity);
  }

  getDocument(): DocumentRuntime {
    return this.doc;
  }

  getHistory(): History {
    return this.history;
  }

  update(model: OperationModel, options?: UpdateOptions): OperationModel {
    const memorize = options?.memorize ?? true;
    const merge = options?.merge ?? false;

    const target = this.resolveTarget(model);
    const inverseOps = applyOps(target, model.operations);

    const backward = { ...model, operations: inverseOps } as OperationModel;

    if (memorize) {
      const entry = { forward: model, backward };
      if (merge) {
        this.history.merge(entry);
      } else {
        this.history.push(entry);
      }
    }

    this.notify(model);
    return backward;
  }

  undo(): boolean {
    const entry = this.history.undo();
    if (!entry) return false;

    const target = this.resolveTarget(entry.backward);
    applyOps(target, entry.backward.operations);
    this.notify(entry.backward);
    return true;
  }

  redo(): boolean {
    const entry = this.history.redo();
    if (!entry) return false;

    const target = this.resolveTarget(entry.forward);
    applyOps(target, entry.forward.operations);
    this.notify(entry.forward);
    return true;
  }

  onUpdate(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(model: OperationModel): void {
    for (const listener of this.listeners) {
      listener(model);
    }
  }

  private resolveTarget(model: OperationModel): Record<string, unknown> {
    switch (model.target) {
      case 'document':
        return this.doc as unknown as Record<string, unknown>;

      case 'page': {
        const page = this.doc.pages.find(p => p.id === model.id);
        if (!page) throw new Error(`Page not found: ${model.id}`);
        return page as unknown as Record<string, unknown>;
      }

      case 'widget': {
        const page = this.doc.pages.find(p => p.id === model.pageId);
        if (!page) throw new Error(`Page not found: ${model.pageId}`);
        const widget = page.widgets.find(w => w.id === model.id);
        if (!widget) throw new Error(`Widget not found: ${model.id}`);
        return widget as unknown as Record<string, unknown>;
      }
    }
  }
}
