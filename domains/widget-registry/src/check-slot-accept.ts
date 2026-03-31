/*
 * Description: Shared slot acceptance validation utility.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type { WidgetRuntime } from '@canvix-react/schema-widget';
import type { WidgetRegistry } from '@canvix-react/shared-types';

/**
 * Check whether `incoming` widgets are accepted by the given slot.
 *
 * - Slot not declared in the definition → rejected.
 * - No `accept` function on the slot → accepted (all allowed).
 * - Otherwise delegates to the `accept` function.
 */
export function checkSlotAccept(
  registry: WidgetRegistry,
  ownerWidget: WidgetRuntime,
  slotName: string,
  incoming: WidgetRuntime[],
): boolean {
  const definition = registry.get(ownerWidget.type);
  if (!definition?.slots) return false;

  const slotDef = definition.slots.find(s => s.name === slotName);
  if (!slotDef) return false;

  if (!slotDef.accept) return true;

  return slotDef.accept({ owner: ownerWidget, incoming });
}
