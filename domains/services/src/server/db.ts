import type { DBSchema } from 'idb';
import { openDB } from 'idb';

import type { DocumentRecord } from '../models/document.js';

export interface EditorDBSchema extends DBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: {
      'by-updatedAt': number;
    };
  };
}

const DB_NAME = 'canvix-editor';
const DB_VERSION = 1;

export function getDB() {
  return openDB<EditorDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('documents', { keyPath: 'id' });
      store.createIndex('by-updatedAt', 'updated_at');
    },
  });
}
