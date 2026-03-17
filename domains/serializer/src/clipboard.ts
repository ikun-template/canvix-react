import type { PageRuntime } from '@canvix-react/schema-page';
import type { WidgetRuntime } from '@canvix-react/schema-widget';
import { nanoid } from 'nanoid';

export type ClipboardData =
  | { type: 'copy-page'; pages: PageRuntime[] }
  | { type: 'copy-widget'; widgets: WidgetRuntime[] };

export async function copyToClipboard(data: ClipboardData): Promise<void> {
  const json = JSON.stringify(data);
  await navigator.clipboard.writeText(json);
}

export async function readFromClipboard(): Promise<ClipboardData | null> {
  const text = await navigator.clipboard.readText();
  try {
    const parsed = JSON.parse(text) as ClipboardData;
    if (parsed.type === 'copy-page' || parsed.type === 'copy-widget') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function reassignIds(data: ClipboardData): ClipboardData {
  const idMap = new Map<string, string>();

  function newId(oldId: string): string {
    let mapped = idMap.get(oldId);
    if (!mapped) {
      mapped = nanoid(6);
      idMap.set(oldId, mapped);
    }
    return mapped;
  }

  function remapWidget(w: WidgetRuntime): WidgetRuntime {
    const newWidget = { ...w, id: newId(w.id) };
    if (newWidget.slots) {
      const newSlots: Record<string, string[]> = {};
      for (const [key, ids] of Object.entries(newWidget.slots)) {
        newSlots[key] = ids.map(id => newId(id));
      }
      newWidget.slots = newSlots;
    }
    return newWidget;
  }

  if (data.type === 'copy-widget') {
    return {
      type: 'copy-widget',
      widgets: data.widgets.map(remapWidget),
    };
  }

  return {
    type: 'copy-page',
    pages: data.pages.map(page => ({
      ...page,
      id: newId(page.id),
      widgets: page.widgets.map(remapWidget),
    })),
  };
}
