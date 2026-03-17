import { documentService } from '@canvix-react/services';

export interface PersistenceAdapter {
  save(id: string, data: string): Promise<void>;
  load(id: string): Promise<string>;
}

export const servicesAdapter: PersistenceAdapter = {
  async save(id, data) {
    await documentService.update(id, { data });
  },
  async load(id) {
    const record = await documentService.get(id);
    return record.data;
  },
};
