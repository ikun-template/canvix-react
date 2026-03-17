import { isClient } from './env.js';
import { getDB } from './server/db.js';

export async function initServices(): Promise<void> {
  if (isClient()) {
    return;
  }
  await getDB();
}
