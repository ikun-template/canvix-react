import type { DocumentRuntime } from '@canvix-react/schema-document';

import { deserialize, serialize } from './serialize.js';

export function encode(document: DocumentRuntime): string {
  const json = serialize(document);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decode(base64: string): DocumentRuntime {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return deserialize(json);
}
