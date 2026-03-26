import type { Chronicle, OperationModel } from '@canvix-react/chronicle';
import type { DraftSession } from '@canvix-react/editor-types';

interface DraftEntry {
  forward: OperationModel;
  backward: OperationModel;
}

export function createDraftSession(chronicle: Chronicle): DraftSession {
  const entries: DraftEntry[] = [];
  let sealed = false;

  return {
    update(model: OperationModel) {
      if (sealed) throw new Error('DraftSession already sealed');
      const backward = chronicle.update(model, { memorize: false });
      entries.push({ forward: model, backward });
    },

    commit() {
      if (sealed) throw new Error('DraftSession already sealed');
      sealed = true;
      if (entries.length === 0) return;

      // Merge all forward ops into a single history entry
      const first = entries[0];
      const forwardOps = entries.flatMap(e => e.forward.operations);
      const backwardOps = entries.reduceRight<typeof forwardOps>(
        (acc, e) => acc.concat(e.backward.operations),
        [],
      );

      const forward = {
        ...first.forward,
        operations: forwardOps,
      } as OperationModel;
      const backward = {
        ...first.backward,
        operations: backwardOps,
      } as OperationModel;

      chronicle.getHistory().push({ forward, backward });
    },

    rollback() {
      if (sealed) throw new Error('DraftSession already sealed');
      sealed = true;
      // Undo in reverse order
      for (let i = entries.length - 1; i >= 0; i--) {
        chronicle.update(entries[i].backward, { memorize: false });
      }
    },
  };
}
