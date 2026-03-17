import type { PageRuntime } from './types.js';

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations = new Map<string, MigrationFn>();

export function registerPageMigration(
  fromVersion: string,
  fn: MigrationFn,
): void {
  migrations.set(fromVersion, fn);
}

export function migratePage(
  data: Record<string, unknown>,
  fromVersion: string,
): PageRuntime {
  let current = { ...data };
  let version = fromVersion;

  while (migrations.has(version)) {
    const fn = migrations.get(version)!;
    current = fn(current);
    version = current['schema'] as string;
  }

  return current as unknown as PageRuntime;
}
