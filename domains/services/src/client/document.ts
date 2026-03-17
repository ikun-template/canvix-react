import type { DocumentListItem, DocumentRecord } from '../models/document.js';

export async function list(): Promise<DocumentListItem[]> {
  throw new Error('client.document.list not implemented');
}

export async function get(_id: string): Promise<DocumentRecord> {
  throw new Error('client.document.get not implemented');
}

export async function create(_title: string): Promise<DocumentRecord> {
  throw new Error('client.document.create not implemented');
}

export async function update(
  _id: string,
  _data: Partial<Pick<DocumentRecord, 'title' | 'desc' | 'cover' | 'data'>>,
): Promise<void> {
  throw new Error('client.document.update not implemented');
}

export async function remove(_id: string): Promise<void> {
  throw new Error('client.document.remove not implemented');
}
