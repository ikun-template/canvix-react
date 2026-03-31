/*
 * Description: Drag hook for toolbox widget buttons — supports dropping into slot zones.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type { WidgetPluginDefinition } from '@canvix-react/editor-types';
import { widgetDefaults } from '@canvix-react/schema-widget';
import type { EditorRefContextValue } from '@canvix-react/toolkit-editor';
import { checkSlotAccept } from '@canvix-react/widget-registry';
import { useCallback, useRef } from 'react';

const DRAG_THRESHOLD = 4;
const SLOT_ZONE_HIGHLIGHT_ATTR = 'data-slot-highlight';

interface DragSession {
  def: WidgetPluginDefinition;
  widgetName: string;
  startX: number;
  startY: number;
  active: boolean;
  ghost: HTMLElement | null;
  highlightedZone: HTMLElement | null;
  accepted: boolean;
}

export function useToolboxDrag(
  ref: EditorRefContextValue,
  translateName: (key: string) => string,
  onClose?: () => void,
) {
  const sessionRef = useRef<DragSession | null>(null);

  const cleanup = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    if (session.ghost) session.ghost.remove();
    if (session.highlightedZone) {
      session.highlightedZone.removeAttribute(SLOT_ZONE_HIGHLIGHT_ATTR);
      session.highlightedZone.style.outline = '';
      session.highlightedZone.style.outlineOffset = '';
    }
    document.body.style.cursor = '';
    sessionRef.current = null;
  }, []);

  const startDrag = useCallback(
    (def: WidgetPluginDefinition, e: React.PointerEvent) => {
      e.preventDefault();

      sessionRef.current = {
        def,
        widgetName: translateName(def.meta.name),
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        ghost: null,
        highlightedZone: null,
        accepted: false,
      };

      const onPointerMove = (ev: PointerEvent) => {
        const session = sessionRef.current;
        if (!session) return;

        const dx = ev.clientX - session.startX;
        const dy = ev.clientY - session.startY;

        if (!session.active) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD)
            return;
          session.active = true;
          onClose?.();
          session.ghost = createGhost(session.def, session.widgetName);
        }

        // Move ghost
        if (session.ghost) {
          session.ghost.style.left = `${ev.clientX + 12}px`;
          session.ghost.style.top = `${ev.clientY + 12}px`;
        }

        // Hit test slot zones
        const target = document.elementFromPoint(ev.clientX, ev.clientY);
        const slotZone = target?.closest<HTMLElement>('[data-slot-zone]');

        // Clear previous highlight
        if (session.highlightedZone && session.highlightedZone !== slotZone) {
          session.highlightedZone.removeAttribute(SLOT_ZONE_HIGHLIGHT_ATTR);
          session.highlightedZone.style.outline = '';
          session.highlightedZone.style.outlineOffset = '';
        }

        if (slotZone) {
          const slotName = slotZone.dataset.slotName!;
          const ownerId = slotZone.dataset.ownerId!;

          // Validate acceptance
          const accepted = validateAccept(
            ref,
            ownerId,
            slotName,
            session.def,
            session.widgetName,
          );
          session.highlightedZone = slotZone;
          session.accepted = accepted;

          if (accepted) {
            slotZone.setAttribute(SLOT_ZONE_HIGHLIGHT_ATTR, 'true');
            slotZone.style.outline = '2px solid hsl(var(--primary))';
            slotZone.style.outlineOffset = '-2px';
            document.body.style.cursor = 'copy';
          } else {
            slotZone.setAttribute(SLOT_ZONE_HIGHLIGHT_ATTR, 'false');
            slotZone.style.outline = '2px dashed hsl(var(--destructive))';
            slotZone.style.outlineOffset = '-2px';
            document.body.style.cursor = 'not-allowed';
          }
        } else {
          session.highlightedZone = null;
          session.accepted = false;
          document.body.style.cursor = '';
        }
      };

      const onPointerUp = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);

        const session = sessionRef.current;
        if (!session) return;

        if (session.active) {
          if (session.highlightedZone && session.accepted) {
            // Drop into slot
            const slotName = session.highlightedZone.dataset.slotName!;
            const ownerId = session.highlightedZone.dataset.ownerId!;
            addWidgetToSlot(
              ref,
              ownerId,
              slotName,
              session.def,
              session.widgetName,
            );
          } else {
            // Drop on canvas or outside — add as root widget
            const canvas = document.querySelector<HTMLElement>('[data-canvas]');
            if (canvas) {
              const canvasRect = canvas.getBoundingClientRect();
              if (
                ev.clientX >= canvasRect.left &&
                ev.clientX <= canvasRect.right &&
                ev.clientY >= canvasRect.top &&
                ev.clientY <= canvasRect.bottom
              ) {
                addWidgetToRoot(ref, session.def, session.widgetName);
              }
            }
          }
        } else {
          // Click without drag → add as root widget
          addWidgetToRoot(ref, session.def, session.widgetName);
        }

        cleanup();
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    },
    [ref, translateName, onClose, cleanup],
  );

  return { startDrag };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createGhost(def: WidgetPluginDefinition, name: string): HTMLElement {
  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.zIndex = '9999';
  ghost.style.pointerEvents = 'none';
  ghost.style.padding = '6px 12px';
  ghost.style.borderRadius = '6px';
  ghost.style.fontSize = '12px';
  ghost.style.whiteSpace = 'nowrap';
  ghost.style.border = '1px solid hsl(var(--border))';
  ghost.style.background = 'hsl(var(--background))';
  ghost.style.color = 'hsl(var(--foreground))';
  ghost.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  ghost.textContent = name;
  document.body.appendChild(ghost);
  return ghost;
}

function validateAccept(
  ref: EditorRefContextValue,
  ownerId: string,
  slotName: string,
  def: WidgetPluginDefinition,
  widgetName: string,
): boolean {
  const pageId = ref.getSnapshot().activePageId;
  if (!pageId) return false;

  const doc = ref.chronicle.getDocument();
  const page = doc.pages.find((p: { id: string }) => p.id === pageId);
  const owner = page?.widgets.find((w: { id: string }) => w.id === ownerId);
  if (!owner) return false;

  const incoming = widgetDefaults({
    type: def.type,
    name: widgetName,
    custom_data: def.defaultCustomData,
    ...def.defaultSchema,
  });

  return checkSlotAccept(ref.registry, owner, slotName, [incoming]);
}

function addWidgetToSlot(
  ref: EditorRefContextValue,
  ownerId: string,
  slotName: string,
  def: WidgetPluginDefinition,
  widgetName: string,
) {
  const pageId = ref.getSnapshot().activePageId;
  if (!pageId) return;

  const doc = ref.chronicle.getDocument();
  const page = doc.pages.find((p: { id: string }) => p.id === pageId);
  if (!page) return;

  const owner = page.widgets.find((w: { id: string }) => w.id === ownerId);
  if (!owner) return;

  const widget = widgetDefaults({
    type: def.type,
    name: widgetName,
    position: { axis: [0, 0] },
    custom_data: def.defaultCustomData,
    ...def.defaultSchema,
  });

  // Add widget to page
  ref.update({
    target: 'page',
    id: pageId,
    operations: [
      {
        kind: 'array:insert',
        chain: ['widgets'],
        index: page.widgets.length,
        value: widget,
      },
    ],
  });

  // Ensure slots object and slot array exist before inserting
  const ensureOps: {
    kind: 'update';
    chain: (string | number)[];
    value: unknown;
  }[] = [];
  if (!owner.slots) {
    ensureOps.push({ kind: 'update', chain: ['slots'], value: {} });
  }
  if (!owner.slots?.[slotName]) {
    ensureOps.push({ kind: 'update', chain: ['slots', slotName], value: [] });
  }
  if (ensureOps.length > 0) {
    ref.update(
      { target: 'widget', pageId, id: ownerId, operations: ensureOps },
      { memorize: false },
    );
  }

  // Insert widget ID into owner's slot
  const slotArr = owner.slots?.[slotName];
  const idx = slotArr ? slotArr.length : 0;
  ref.update(
    {
      target: 'widget',
      pageId,
      id: ownerId,
      operations: [
        {
          kind: 'array:insert',
          chain: ['slots', slotName],
          index: idx,
          value: widget.id,
        },
      ],
    },
    { memorize: false },
  );
}

function addWidgetToRoot(
  ref: EditorRefContextValue,
  def: WidgetPluginDefinition,
  widgetName: string,
) {
  const pageId = ref.getSnapshot().activePageId;
  if (!pageId) return;

  const page = ref.chronicle
    .getDocument()
    .pages.find((p: { id: string }) => p.id === pageId);
  if (!page) return;

  const widget = widgetDefaults({
    type: def.type,
    name: widgetName,
    position: { axis: [100, 100] },
    custom_data: def.defaultCustomData,
    ...def.defaultSchema,
  });

  ref.update({
    target: 'page',
    id: pageId,
    operations: [
      {
        kind: 'array:insert',
        chain: ['widgets'],
        index: page.widgets.length,
        value: widget,
      },
    ],
  });
}
