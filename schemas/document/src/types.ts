import type { PageRuntime } from '@canvix-react/schema-page';
import type { DeepPartial } from '@canvix-react/types';

export interface DocumentRuntime {
  schema: string;
  title: string;
  desc: string;
  cover: string;
  pages: PageRuntime[];
}

export type DocumentRaw = DeepPartial<DocumentRuntime>;
