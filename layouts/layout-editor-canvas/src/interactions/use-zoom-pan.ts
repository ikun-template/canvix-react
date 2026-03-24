import type { EditorDispatch } from '@canvix-react/toolkit-editor';
import { useEffect, useRef } from 'react';

import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './types.js';

interface UseZoomPanOptions {
  dispatch: EditorDispatch;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  spaceHeldRef: React.RefObject<boolean>;
}

export function useZoomPan({
  dispatch,
  canvasRef,
  spaceHeldRef,
}: UseZoomPanOptions) {
  const panStateRef = useRef<{
    active: boolean;
    pointerId: number;
    originX: number;
    originY: number;
    startScrollX: number;
    startScrollY: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const rect = canvas!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const snap = dispatch.getSnapshot();
      const oldZoom = snap.zoom;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom + delta));

      if (newZoom === oldZoom) return;

      // Adjust scroll to keep mouse position stable
      const scroll = snap.scroll;
      const scale = newZoom / oldZoom;
      const newScrollX = mouseX - scale * (mouseX - scroll.x);
      const newScrollY = mouseY - scale * (mouseY - scroll.y);

      dispatch.setZoom(newZoom);
      dispatch.setScroll(newScrollX, newScrollY);
    }

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [dispatch, canvasRef]);

  function startPan(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scroll = dispatch.getSnapshot().scroll;
    panStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      originX: e.clientX,
      originY: e.clientY,
      startScrollX: scroll.x,
      startScrollY: scroll.y,
    };

    canvas.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const st = panStateRef.current;
      if (!st) return;
      const dx = ev.clientX - st.originX;
      const dy = ev.clientY - st.originY;
      dispatch.setScroll(st.startScrollX + dx, st.startScrollY + dy);
    }

    function onUp() {
      panStateRef.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  // Space key tracking for temporary hand tool
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.code === 'Space' &&
        !e.repeat &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        (spaceHeldRef as React.MutableRefObject<boolean>).current = true;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        (spaceHeldRef as React.MutableRefObject<boolean>).current = false;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [spaceHeldRef]);

  return { startPan };
}
