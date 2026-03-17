import type {
  DocumentRuntime,
  DocumentRaw,
} from '@canvix-react/schema-document';
import { documentDefaults } from '@canvix-react/schema-document';
import { pageDefaults } from '@canvix-react/schema-page';
import { widgetDefaults } from '@canvix-react/schema-widget';

export function serialize(document: DocumentRuntime): string {
  return JSON.stringify(document);
}

export function deserialize(json: string): DocumentRuntime {
  const raw: DocumentRaw = JSON.parse(json);
  return hydrate(raw);
}

function hydrate(raw: DocumentRaw): DocumentRuntime {
  const doc = documentDefaults(raw);
  doc.pages = (raw.pages ?? []).map(rawPage => {
    const page = pageDefaults(rawPage);
    page.widgets = (rawPage.widgets ?? []).map(rawWidget =>
      widgetDefaults(rawWidget),
    );
    return page;
  });
  return doc;
}
