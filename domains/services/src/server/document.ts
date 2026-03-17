import type { DocumentListItem, DocumentRecord } from '../models/document.js';

import { getDB } from './db.js';

export async function list(): Promise<DocumentListItem[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('documents', 'by-updatedAt');
  return all.reverse().map(({ id, title, desc, cover, updated_at }) => ({
    id,
    title,
    desc,
    cover,
    updated_at,
  }));
}

export async function get(id: string): Promise<DocumentRecord> {
  const db = await getDB();
  const record = await db.get('documents', id);
  if (!record) throw new Error(`Document ${id} not found`);
  return record;
}

export async function create(title: string): Promise<DocumentRecord> {
  const db = await getDB();
  const now = Date.now();
  const record: DocumentRecord = {
    id: crypto.randomUUID(),
    title,
    desc: '',
    cover: '',
    data: '',
    created_at: now,
    updated_at: now,
  };
  await db.put('documents', record);
  return record;
}

export async function update(
  id: string,
  data: Partial<Pick<DocumentRecord, 'title' | 'desc' | 'cover' | 'data'>>,
): Promise<void> {
  const db = await getDB();
  const record = await db.get('documents', id);
  if (!record) throw new Error(`Document ${id} not found`);
  Object.assign(record, data, { updated_at: Date.now() });
  await db.put('documents', record);
}

export async function remove(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}
