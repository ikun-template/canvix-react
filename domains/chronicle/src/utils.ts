import type { Chain, OperationModel } from './types.js';

export function hasFieldChanged(model: OperationModel, prefix: Chain): boolean {
  for (const op of model.operations) {
    const chain = op.chain;
    const len = Math.min(prefix.length, chain.length);
    let match = true;
    for (let i = 0; i < len; i++) {
      if (prefix[i] !== chain[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
