import type { Op } from './types.js';

function resolve(
  obj: Record<string, unknown>,
  chain: (string | number)[],
): { parent: Record<string, unknown>; key: string | number } {
  let current: unknown = obj;
  for (let i = 0; i < chain.length - 1; i++) {
    current = (current as Record<string, unknown>)[chain[i] as string];
  }
  return {
    parent: current as Record<string, unknown>,
    key: chain[chain.length - 1],
  };
}

export function applyOp(target: Record<string, unknown>, op: Op): Op {
  switch (op.kind) {
    case 'update': {
      const { parent, key } = resolve(target, op.chain);
      const oldValue = parent[key as string];
      parent[key as string] = op.value;
      return { kind: 'update', chain: op.chain, value: oldValue };
    }

    case 'array:insert': {
      const { parent, key } = resolve(target, op.chain);
      const arr = parent[key as string] as unknown[];
      arr.splice(op.index, 0, op.value);
      return { kind: 'array:remove', chain: op.chain, index: op.index };
    }

    case 'array:remove': {
      const { parent, key } = resolve(target, op.chain);
      const arr = parent[key as string] as unknown[];
      const removed = arr.splice(op.index, 1)[0];
      return {
        kind: 'array:insert',
        chain: op.chain,
        index: op.index,
        value: removed,
      };
    }

    case 'add': {
      const { parent, key } = resolve(target, op.chain);
      parent[key as string] = op.value;
      return { kind: 'delete', chain: op.chain };
    }

    case 'delete': {
      const { parent, key } = resolve(target, op.chain);
      const oldValue = parent[key as string];
      delete parent[key as string];
      return { kind: 'add', chain: op.chain, value: oldValue };
    }

    case 'move': {
      const { parent, key } = resolve(target, op.chain);
      const arr = parent[key as string] as unknown[];
      const [item] = arr.splice(op.from, 1);
      arr.splice(op.to, 0, item);
      return { kind: 'move', chain: op.chain, from: op.to, to: op.from };
    }
  }
}

export function applyOps(target: Record<string, unknown>, ops: Op[]): Op[] {
  const inverses: Op[] = [];
  for (const op of ops) {
    inverses.push(applyOp(target, op));
  }
  return inverses.reverse();
}
