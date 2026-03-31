/*
 * Description: Page explorer with drag-to-reorder support.
 *
 * Author: qinzhenya
 * Created: 2026-03-31
 */

import {
  useSortContainer,
  useSortDrag,
  useSortMonitor,
} from '@canvix-react/dnd-sort';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import {
  useChronicleSelective,
  useEditorLive,
  useEditorRef,
} from '@canvix-react/toolkit-editor';
import { cn } from '@canvix-react/ui';
import { useCallback } from 'react';

const shouldUpdate = (model: OperationModel) => {
  if (model.target === 'document') return true;
  if (model.target === 'page') {
    return model.operations.some(op => op.chain[0] === 'name');
  }
  return false;
};

export function PageExplorer() {
  const ref = useEditorRef();
  const activePageId = useEditorLive('activePageId');
  const doc = useChronicleSelective(shouldUpdate);
  const session = useSortMonitor();

  const onSort = useCallback(
    (result: { fromIndex: number; toIndex: number }) => {
      const from = result.fromIndex;
      let to = result.toIndex;
      if (to > from) to--;
      if (from === to) return;

      ref.update({
        target: 'document',
        operations: [{ kind: 'move', chain: ['pages'], from, to }],
      });
    },
    [ref],
  );

  const { containerRef, dropIndex, isDragging } = useSortContainer({ onSort });

  const dragFromIndex = session?.active ? session.fromIndex : null;

  return (
    <ul
      ref={containerRef as (el: HTMLUListElement | null) => void}
      className="list-none p-0"
    >
      {doc.pages.map((page, index) => {
        const isActive = activePageId === page.id;
        const isBeingDragged = dragFromIndex === index;

        const showDropBefore =
          isDragging &&
          dropIndex === index &&
          dropIndex !== dragFromIndex &&
          dropIndex !== (dragFromIndex ?? -1) + 1;

        const showDropAfter =
          isDragging &&
          dropIndex === index + 1 &&
          dropIndex !== dragFromIndex &&
          dropIndex !== (dragFromIndex ?? -1) + 1;

        const showDropEnd =
          index === doc.pages.length - 1 &&
          isDragging &&
          dropIndex === doc.pages.length &&
          dropIndex !== dragFromIndex &&
          dropIndex !== (dragFromIndex ?? -1) + 1;

        return (
          <PageItem
            key={page.id}
            pageName={page.name || page.id}
            index={index}
            isActive={isActive}
            isBeingDragged={isBeingDragged}
            showDropBefore={showDropBefore}
            showDropAfter={showDropAfter || showDropEnd}
            onSelect={() => ref.setActivePage(page.id)}
          />
        );
      })}
    </ul>
  );
}

// ── Page item ───────────────────────────────────────────────────────────────

interface PageItemProps {
  pageName: string;
  index: number;
  isActive: boolean;
  isBeingDragged: boolean;
  showDropBefore: boolean;
  showDropAfter: boolean;
  onSelect: () => void;
}

function PageItem({
  pageName,
  index,
  isActive,
  isBeingDragged,
  showDropBefore,
  showDropAfter,
  onSelect,
}: PageItemProps) {
  const { dragProps } = useSortDrag({ item: index }, index);

  return (
    <li
      onClick={onSelect}
      {...dragProps}
      className={cn(
        'relative',
        'cursor-pointer rounded px-2 py-1 text-sm',
        'select-none',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'hover:bg-accent/50',
        isBeingDragged && 'opacity-40',
      )}
    >
      {showDropBefore && (
        <div className="bg-primary absolute -top-px right-1 left-1 h-0.5 rounded-full" />
      )}
      {pageName}
      {showDropAfter && (
        <div className="bg-primary absolute right-1 -bottom-px left-1 h-0.5 rounded-full" />
      )}
    </li>
  );
}
