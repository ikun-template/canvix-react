import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_HEIGHT = 120;

interface UseResizeHandleOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  initialTopHeight?: number;
}

export function useResizeHandle({
  containerRef,
  initialTopHeight = 240,
}: UseResizeHandleOptions) {
  const [topHeight, setTopHeight] = useState(initialTopHeight);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startY.current = e.clientY;
      startHeight.current = topHeight;
    },
    [topHeight],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const containerHeight = containerRef.current.clientHeight;
      const maxHeight = containerHeight - MIN_HEIGHT;
      const delta = e.clientY - startY.current;
      const next = Math.min(
        Math.max(startHeight.current + delta, MIN_HEIGHT),
        maxHeight,
      );
      setTopHeight(next);
    }

    function onMouseUp() {
      dragging.current = false;
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [containerRef]);

  return {
    topHeight,
    handleProps: {
      onMouseDown,
      className:
        'h-1 cursor-row-resize shrink-0 hover:bg-border active:bg-border transition-colors',
    },
  } as const;
}
