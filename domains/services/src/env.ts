export type Runtime = 'client' | 'server';

export function getRuntime(): Runtime {
  return 'server';
}

export function isClient(): boolean {
  return getRuntime() === 'client';
}
