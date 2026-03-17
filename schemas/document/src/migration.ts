import type { DocumentRuntime } from './types.js';

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations = new Map<string, MigrationFn>();

export function registerDocumentMigration(
  fromVersion: string,
  fn: MigrationFn,
): void {
  migrations.set(fromVersion, fn);
}

export function migrateDocument(
  data: Record<string, unknown>,
  fromVersion: string,
): DocumentRuntime {
  let current = { ...data };
  let version = fromVersion;

  while (migrations.has(version)) {
    const fn = migrations.get(version)!;
    current = fn(current);
    version = current['schema'] as string;
  }

  return current as unknown as DocumentRuntime;
}
