/*
 * Description: Widget explorer — tree view with cross-slot drag support.
 *
 * Author: qinzhenya
 * Created: 2026-03-31
 */

import {
  useSortContainer,
  useSortDrag,
  useSortMonitor,
} from '@canvix-react/dnd-sort';
import type { WidgetRuntime } from '@canvix-react/schema-widget';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useEditorRef,
  useI18n,
} from '@canvix-react/toolkit-editor';
import { cn } from '@canvix-react/ui';
import { checkSlotAccept } from '@canvix-react/widget-registry';
import type { WidgetPluginDefinition } from '@canvix-react/widget-registry';
import { useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type TreeDropTarget =
  | { kind: 'root'; index: number }
  | { kind: 'slot'; ownerId: string; slotName: string; index: number };

interface FlatTreeNode {
  key: string;
  nodeType: 'widget' | 'slot-label';
  widgetId?: string;
  location?: TreeDropTarget;
  ownerId?: string;
  slotName?: string;
  slotLabel?: string;
  depth: number;
}

// ── Subscription filter ─────────────────────────────────────────────────────

const shouldUpdate = (model: OperationModel) => {
  if (model.target === 'document') return true;
  if (model.target === 'page') return true;
  if (model.target === 'widget') {
    return model.operations.some(
      op =>
        op.chain[0] === 'name' ||
        op.chain[0] === 'type' ||
        op.chain[0] === 'slots',
    );
  }
  return false;
};

// ── Main component ──────────────────────────────────────────────────────────

export function WidgetExplorer() {
  const { t } = useI18n();
  const ref = useEditorRef();
  const snapshot = useEditorLive(
    'activePageId',
    'selectedWidgetIds',
    'hoveredWidgetId',
  );

  const doc = useChronicleSelective(shouldUpdate);
  const page = doc.pages.find(p => p.id === snapshot.activePageId);
  const widgets = page?.widgets ?? [];
  const pageId = snapshot.activePageId;

  const flatNodes = buildFlatTree(widgets, ref.registry);
  const flatNodesRef = useRef(flatNodes);
  flatNodesRef.current = flatNodes;

  const session = useSortMonitor();
  const dragFlatIndex = session?.active ? session.fromIndex : null;

  const onSort = useCallback(
    (result: { fromIndex: number; toIndex: number }) => {
      if (!pageId) return;

      const nodes = flatNodesRef.current;
      const sourceNode = nodes[result.fromIndex];
      if (!sourceNode?.widgetId || !sourceNode.location) return;

      const dropTarget = resolveDropTarget(nodes, result.toIndex);
      if (!dropTarget) return;

      // Validate cross-slot accept
      if (dropTarget.kind === 'slot') {
        const currentDoc = ref.chronicle.getDocument();
        const currentPage = currentDoc.pages.find(
          (p: { id: string }) => p.id === pageId,
        );
        const owner = currentPage?.widgets.find(
          (w: { id: string }) => w.id === dropTarget.ownerId,
        );
        const widget = currentPage?.widgets.find(
          (w: { id: string }) => w.id === sourceNode.widgetId,
        );

        if (!owner || !widget) return;

        const sameSlot =
          sourceNode.location.kind === 'slot' &&
          sourceNode.location.ownerId === dropTarget.ownerId &&
          sourceNode.location.slotName === dropTarget.slotName;

        if (
          !sameSlot &&
          !checkSlotAccept(ref.registry, owner, dropTarget.slotName, [widget])
        ) {
          return;
        }
      }

      executeMove(
        ref,
        pageId,
        sourceNode.widgetId,
        sourceNode.location,
        dropTarget,
      );
    },
    [ref, pageId],
  );

  const { containerRef, dropIndex, isDragging } = useSortContainer({ onSort });

  // Resolve current drop target for visual validation
  let dropValid = false;
  if (isDragging && dropIndex !== null && dragFlatIndex !== null && pageId) {
    const dropTarget = resolveDropTarget(flatNodes, dropIndex);
    if (dropTarget) {
      if (dropTarget.kind === 'root') {
        dropValid = true;
      } else {
        const sourceNode = flatNodes[dragFlatIndex];
        const currentDoc = ref.chronicle.getDocument();
        const currentPage = currentDoc.pages.find(
          (p: { id: string }) => p.id === pageId,
        );
        const owner = currentPage?.widgets.find(
          (w: { id: string }) => w.id === dropTarget.ownerId,
        );
        const widget = currentPage?.widgets.find(
          (w: { id: string }) => w.id === sourceNode?.widgetId,
        );

        if (owner && widget) {
          const sameSlot =
            sourceNode?.location?.kind === 'slot' &&
            sourceNode.location.ownerId === dropTarget.ownerId &&
            sourceNode.location.slotName === dropTarget.slotName;
          dropValid =
            sameSlot ||
            checkSlotAccept(ref.registry, owner, dropTarget.slotName, [widget]);
        }
      }
    }
  }

  if (widgets.length === 0) {
    return (
      <div className="text-muted-foreground px-2 py-4 text-center text-xs">
        {t('sidebar.widgets.empty')}
      </div>
    );
  }

  return (
    <div
      ref={containerRef as (el: HTMLDivElement | null) => void}
      className="flex flex-col gap-0.5 py-1"
    >
      {flatNodes.map((node, flatIndex) => {
        if (node.nodeType === 'slot-label') {
          return (
            <SlotLabelRow
              key={node.key}
              label={node.slotLabel!}
              depth={node.depth}
              showDropBefore={dropValid && dropIndex === flatIndex}
            />
          );
        }

        const widget = widgets.find(w => w.id === node.widgetId);
        if (!widget) return null;

        const def = ref.registry.get(widget.type);
        const isSelected = snapshot.selectedWidgetIds.includes(widget.id);
        const isHovered = !isSelected && snapshot.hoveredWidgetId === widget.id;
        const isBeingDragged = dragFlatIndex === flatIndex;

        const showDropBefore =
          dragFlatIndex != null &&
          dropValid &&
          dropIndex === flatIndex &&
          dropIndex !== dragFlatIndex;

        const showDropAfter =
          dragFlatIndex != null &&
          dropValid &&
          dropIndex === flatIndex + 1 &&
          dropIndex !== dragFlatIndex;

        return (
          <WidgetRow
            key={node.key}
            widget={widget}
            definition={def}
            depth={node.depth}
            flatIndex={flatIndex}
            isSelected={isSelected}
            isHovered={isHovered}
            isDragging={isBeingDragged}
            showDropBefore={showDropBefore}
            showDropAfter={showDropAfter}
            onSelect={() => ref.setSelection([widget.id])}
            onHoverEnter={() => {
              if (dragFlatIndex == null) ref.setHoveredWidget(widget.id);
            }}
            onHoverLeave={() => {
              if (dragFlatIndex == null) ref.setHoveredWidget(null);
            }}
          />
        );
      })}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SlotLabelRow({
  label,
  depth,
  showDropBefore,
}: {
  label: string;
  depth: number;
  showDropBefore: boolean;
}) {
  return (
    <div
      data-tree-node="slot-label"
      className={cn(
        'relative',
        'text-muted-foreground px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase',
        'select-none',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      {showDropBefore && (
        <div className="bg-primary absolute -top-px right-1 left-1 h-0.5 rounded-full" />
      )}
      {label}
    </div>
  );
}

function WidgetRow({
  widget,
  definition,
  depth,
  flatIndex,
  isSelected,
  isHovered,
  isDragging,
  showDropBefore,
  showDropAfter,
  onSelect,
  onHoverEnter,
  onHoverLeave,
}: {
  widget: WidgetRuntime;
  definition: WidgetPluginDefinition | undefined;
  depth: number;
  flatIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  showDropBefore: boolean;
  showDropAfter: boolean;
  onSelect: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}) {
  const { dragProps } = useSortDrag({ item: widget.id }, flatIndex);
  const Icon = definition?.meta.icon;

  return (
    <div
      data-tree-node="widget"
      onClick={onSelect}
      onPointerEnter={onHoverEnter}
      onPointerLeave={onHoverLeave}
      {...dragProps}
      className={cn(
        'relative',
        'flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm',
        'select-none',
        isSelected
          ? 'bg-accent text-accent-foreground font-medium'
          : isHovered
            ? 'bg-accent/60'
            : '',
        isDragging && 'opacity-40',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      {showDropBefore && (
        <div className="bg-primary absolute -top-px right-1 left-1 h-0.5 rounded-full" />
      )}
      {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
      <span className="truncate">{widget.name || widget.type}</span>
      {showDropAfter && (
        <div className="bg-primary absolute right-1 -bottom-px left-1 h-0.5 rounded-full" />
      )}
    </div>
  );
}

// ── Tree building ────────────────────────────────────────────────────────────

interface RegistryLike {
  get(type: string): WidgetPluginDefinition | undefined;
}

function buildFlatTree(
  widgets: WidgetRuntime[],
  registry: RegistryLike,
): FlatTreeNode[] {
  const slotChildIds = new Set<string>();
  for (const w of widgets) {
    if (w.slots) {
      for (const ids of Object.values(w.slots)) {
        for (const id of ids) slotChildIds.add(id);
      }
    }
  }

  const rootWidgets = widgets.filter(w => !slotChildIds.has(w.id));
  const widgetMap = new Map(widgets.map(w => [w.id, w]));

  const nodes: FlatTreeNode[] = [];

  function visitWidget(
    widgetId: string,
    location: TreeDropTarget,
    depth: number,
  ) {
    const widget = widgetMap.get(widgetId);
    if (!widget) return;

    nodes.push({
      key: `widget-${widgetId}`,
      nodeType: 'widget',
      widgetId,
      location,
      depth,
    });

    const definition = registry.get(widget.type);
    if (!definition?.slots) return;

    for (const slotDef of definition.slots) {
      const childIds = widget.slots?.[slotDef.name] ?? [];

      nodes.push({
        key: `slot-${widgetId}-${slotDef.name}`,
        nodeType: 'slot-label',
        ownerId: widgetId,
        slotName: slotDef.name,
        slotLabel: slotDef.label,
        depth: depth + 1,
      });

      for (let i = 0; i < childIds.length; i++) {
        visitWidget(
          childIds[i],
          { kind: 'slot', ownerId: widgetId, slotName: slotDef.name, index: i },
          depth + 2,
        );
      }
    }
  }

  for (let i = 0; i < rootWidgets.length; i++) {
    visitWidget(rootWidgets[i].id, { kind: 'root', index: i }, 0);
  }

  return nodes;
}

// ── Drop target resolution ──────────────────────────────────────────────────

function resolveDropTarget(
  flatNodes: FlatTreeNode[],
  dropFlatIndex: number,
): TreeDropTarget | null {
  // After all nodes → insert at end of root
  if (dropFlatIndex >= flatNodes.length) {
    let rootCount = 0;
    for (const node of flatNodes) {
      if (node.nodeType === 'widget' && node.location?.kind === 'root') {
        rootCount++;
      }
    }
    return { kind: 'root', index: rootCount };
  }

  const node = flatNodes[dropFlatIndex];
  if (!node) return null;

  // Inserting before a slot label → insert into that slot at index 0
  if (node.nodeType === 'slot-label') {
    return {
      kind: 'slot',
      ownerId: node.ownerId!,
      slotName: node.slotName!,
      index: 0,
    };
  }

  // Widget node — insert at the same location as this widget
  const loc = node.location!;
  if (loc.kind === 'root') {
    return { kind: 'root', index: loc.index };
  }

  return {
    kind: 'slot',
    ownerId: loc.ownerId,
    slotName: loc.slotName,
    index: loc.index,
  };
}

// ── Move execution ──────────────────────────────────────────────────────────

function executeMove(
  ref: {
    chronicle: { getDocument(): any };
    registry: RegistryLike;
    update: (...args: any[]) => void;
  },
  pageId: string,
  widgetId: string,
  source: TreeDropTarget,
  target: TreeDropTarget,
) {
  if (isSameLocation(source, target)) return;

  // Same container: root → root
  if (source.kind === 'root' && target.kind === 'root') {
    const doc = ref.chronicle.getDocument();
    const page = doc.pages.find((p: { id: string }) => p.id === pageId);
    if (!page) return;

    const fullFrom = rootIndexToFull(page.widgets, widgetId);
    const fullTo = rootIndexToFullInsert(page.widgets, target.index, widgetId);
    if (fullFrom === -1 || fullFrom === fullTo) return;

    ref.update({
      target: 'page',
      id: pageId,
      operations: [
        { kind: 'move', chain: ['widgets'], from: fullFrom, to: fullTo },
      ],
    });
    return;
  }

  // Same container: same slot
  if (
    source.kind === 'slot' &&
    target.kind === 'slot' &&
    source.ownerId === target.ownerId &&
    source.slotName === target.slotName
  ) {
    let to = target.index;
    if (to > source.index) to--;
    if (source.index === to) return;
    ref.update({
      target: 'widget',
      pageId,
      id: source.ownerId,
      operations: [
        {
          kind: 'move',
          chain: ['slots', source.slotName],
          from: source.index,
          to,
        },
      ],
    });
    return;
  }

  // Cross-container: remove from source, insert into target
  if (source.kind === 'slot') {
    ref.update({
      target: 'widget',
      pageId,
      id: source.ownerId,
      operations: [
        {
          kind: 'array:remove',
          chain: ['slots', source.slotName],
          index: source.index,
        },
      ],
    });
  }

  if (target.kind === 'slot') {
    const doc = ref.chronicle.getDocument();
    const page = doc.pages.find((p: { id: string }) => p.id === pageId);
    const targetOwner = page?.widgets.find(
      (w: { id: string }) => w.id === target.ownerId,
    );
    const ensureOps: {
      kind: 'update';
      chain: (string | number)[];
      value: unknown;
    }[] = [];
    if (!targetOwner?.slots) {
      ensureOps.push({ kind: 'update', chain: ['slots'], value: {} });
    }
    if (!targetOwner?.slots?.[target.slotName]) {
      ensureOps.push({
        kind: 'update',
        chain: ['slots', target.slotName],
        value: [],
      });
    }
    if (ensureOps.length > 0) {
      ref.update(
        { target: 'widget', pageId, id: target.ownerId, operations: ensureOps },
        { memorize: false },
      );
    }

    ref.update(
      {
        target: 'widget',
        pageId,
        id: target.ownerId,
        operations: [
          {
            kind: 'array:insert',
            chain: ['slots', target.slotName],
            index: target.index,
            value: widgetId,
          },
        ],
      },
      { memorize: false },
    );
  }
}

function isSameLocation(a: TreeDropTarget, b: TreeDropTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'root' && b.kind === 'root') return a.index === b.index;
  if (a.kind === 'slot' && b.kind === 'slot') {
    return (
      a.ownerId === b.ownerId &&
      a.slotName === b.slotName &&
      a.index === b.index
    );
  }
  return false;
}

function rootIndexToFull(widgets: { id: string }[], widgetId: string): number {
  return widgets.findIndex(w => w.id === widgetId);
}

function rootIndexToFullInsert(
  widgets: { id: string; slots?: Record<string, string[]> }[],
  rootIndex: number,
  dragWidgetId: string,
): number {
  const slotChildIds = new Set<string>();
  for (const w of widgets) {
    if (w.slots) {
      for (const ids of Object.values(w.slots)) {
        for (const id of ids) slotChildIds.add(id);
      }
    }
  }

  let rootCount = 0;
  for (let i = 0; i < widgets.length; i++) {
    if (slotChildIds.has(widgets[i].id)) continue;
    if (widgets[i].id === dragWidgetId) continue;
    if (rootCount === rootIndex) return i;
    rootCount++;
  }
  return widgets.length;
}
