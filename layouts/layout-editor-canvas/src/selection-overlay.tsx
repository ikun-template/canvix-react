import { useEditorLive } from '@canvix-react/toolkit-editor';
import { useEffect, useState } from 'react';

import {
  HANDLE_CURSORS,
  HANDLE_DIRECTIONS,
  HANDLE_SIZE,
  type HandleDirection,
} from './interactions/types.js';

interface SelectionOverlayProps {
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface WidgetBounds {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function SelectionOverlay({ pageContainerRef }: SelectionOverlayProps) {
  const { selectedWidgetIds, hoveredWidgetId, interacting, flowDragWidgetId } =
    useEditorLive(
      'selectedWidgetIds',
      'hoveredWidgetId',
      'interacting',
      'flowDragWidgetId',
    );

  const [bounds, setBounds] = useState<WidgetBounds[]>([]);
  const [hoverBounds, setHoverBounds] = useState<WidgetBounds | null>(null);

  // Hide overlay during flow drag
  const isFlowDragging = flowDragWidgetId !== null;

  useEffect(() => {
    if (selectedWidgetIds.length === 0) {
      setBounds([]);
      return;
    }

    function measure() {
      const container = pageContainerRef.current;
      if (!container) return;

      const measured: WidgetBounds[] = [];
      for (const id of selectedWidgetIds) {
        const el = container.querySelector<HTMLElement>(
          `[data-widget-id="${id}"]`,
        );
        if (el) {
          measured.push({
            id,
            x: el.offsetLeft,
            y: el.offsetTop,
            w: el.offsetWidth,
            h: el.offsetHeight,
          });
        }
      }
      setBounds(measured);
    }

    measure();

    // Re-measure on DOM changes (widget moves, resizes)
    const container = pageContainerRef.current;
    if (!container) return;

    const observer = new MutationObserver(measure);
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [selectedWidgetIds, pageContainerRef, interacting]);

  // Also re-measure when document data changes during interaction
  useEffect(() => {
    if (selectedWidgetIds.length === 0) return;

    function measure() {
      const container = pageContainerRef.current;
      if (!container) return;

      const measured: WidgetBounds[] = [];
      for (const id of selectedWidgetIds) {
        const el = container.querySelector<HTMLElement>(
          `[data-widget-id="${id}"]`,
        );
        if (el) {
          measured.push({
            id,
            x: el.offsetLeft,
            y: el.offsetTop,
            w: el.offsetWidth,
            h: el.offsetHeight,
          });
        }
      }
      setBounds(measured);
    }

    // Use RAF to pick up style changes during drag
    let rafId: number;
    function loop() {
      if (interacting) {
        measure();
      }
      rafId = requestAnimationFrame(loop);
    }
    if (interacting) {
      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    }
  }, [selectedWidgetIds, pageContainerRef, interacting]);

  // Measure hover widget bounds
  useEffect(() => {
    const showHover =
      hoveredWidgetId && !selectedWidgetIds.includes(hoveredWidgetId);
    if (!showHover) {
      setHoverBounds(null);
      return;
    }

    const container = pageContainerRef.current;
    if (!container) return;

    const el = container.querySelector<HTMLElement>(
      `[data-widget-id="${hoveredWidgetId}"]`,
    );
    if (!el) {
      setHoverBounds(null);
      return;
    }

    setHoverBounds({
      id: hoveredWidgetId,
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    });
  }, [hoveredWidgetId, selectedWidgetIds, pageContainerRef]);

  if (isFlowDragging || (bounds.length === 0 && !hoverBounds)) return null;

  return (
    <>
      {hoverBounds && (
        <div
          data-hover-box={hoverBounds.id}
          style={{
            position: 'absolute',
            left: hoverBounds.x,
            top: hoverBounds.y,
            width: hoverBounds.w,
            height: hoverBounds.h,
            pointerEvents: 'none',
            outline: '1px dashed #0d99ff',
            outlineOffset: -1,
          }}
        />
      )}
      {bounds.map(b => (
        <div
          key={b.id}
          data-selection-box={b.id}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            pointerEvents: 'none',
            outline: '1px solid #0d99ff',
            outlineOffset: -1,
          }}
        >
          {/* Resize handles */}
          {HANDLE_DIRECTIONS.map(dir => (
            <HandleDot key={dir} direction={dir} boxW={b.w} boxH={b.h} />
          ))}
        </div>
      ))}
    </>
  );
}

function HandleDot({
  direction,
  boxW,
  boxH,
}: {
  direction: HandleDirection;
  boxW: number;
  boxH: number;
}) {
  const half = HANDLE_SIZE / 2;
  const pos = getHandlePosition(direction, boxW, boxH);

  const hitPad = 4;
  return (
    <div
      data-handle={direction}
      style={{
        position: 'absolute',
        left: pos.x - half - hitPad,
        top: pos.y - half - hitPad,
        width: HANDLE_SIZE + hitPad * 2,
        height: HANDLE_SIZE + hitPad * 2,
        padding: hitPad,
        pointerEvents: 'auto',
        cursor: HANDLE_CURSORS[direction],
      }}
    >
      <div
        style={{
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          background: '#fff',
          border: '1px solid #0d99ff',
          borderRadius: '50%',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
        }}
      />
    </div>
  );
}

function getHandlePosition(
  dir: HandleDirection,
  w: number,
  h: number,
): { x: number; y: number } {
  switch (dir) {
    case 'nw':
      return { x: 0, y: 0 };
    case 'n':
      return { x: w / 2, y: 0 };
    case 'ne':
      return { x: w, y: 0 };
    case 'e':
      return { x: w, y: h / 2 };
    case 'se':
      return { x: w, y: h };
    case 's':
      return { x: w / 2, y: h };
    case 'sw':
      return { x: 0, y: h };
    case 'w':
      return { x: 0, y: h / 2 };
  }
}
