import * as client from './client/document.js';
import { isClient } from './env.js';
import type { DocumentListItem, DocumentRecord } from './models/document.js';
import * as server from './server/document.js';

export const documentService = {
  list(): Promise<DocumentListItem[]> {
    return isClient() ? client.list() : server.list();
  },

  get(id: string): Promise<DocumentRecord> {
    return isClient() ? client.get(id) : server.get(id);
  },

  create(title: string): Promise<DocumentRecord> {
    return isClient() ? client.create(title) : server.create(title);
  },

  update(
    id: string,
    data: Partial<Pick<DocumentRecord, 'title' | 'desc' | 'cover' | 'data'>>,
  ): Promise<void> {
    return isClient() ? client.update(id, data) : server.update(id, data);
  },

  remove(id: string): Promise<void> {
    return isClient() ? client.remove(id) : server.remove(id);
  },
};
