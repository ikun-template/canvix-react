import type { EditorRefContextValue } from '@canvix-react/toolkit-editor';
import { useEffect, useRef } from 'react';

import { SCROLL_MARGIN_RATIO, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './types.js';

interface UseZoomPanOptions {
  ref: EditorRefContextValue;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  spaceHeldRef: React.RefObject<boolean>;
  pageSize: [number, number];
}

function clampCamera(
  cx: number,
  cy: number,
  canvas: HTMLElement,
  pageW: number,
  pageH: number,
  zoom: number,
): { x: number; y: number } {
  const viewW = canvas.clientWidth / zoom;
  const viewH = canvas.clientHeight / zoom;
  const margin = Math.max(viewW, viewH) * SCROLL_MARGIN_RATIO;

  function clampAxis(cam: number, viewSize: number, pageSize: number) {
    const min = -margin;
    const max = pageSize + margin - viewSize;
    return min < max
      ? Math.min(max, Math.max(min, cam))
      : (pageSize - viewSize) / 2;
  }

  return {
    x: clampAxis(cx, viewW, pageW),
    y: clampAxis(cy, viewH, pageH),
  };
}

export function useZoomPan({
  ref,
  canvasRef,
  spaceHeldRef,
  pageSize,
}: UseZoomPanOptions) {
  const panStateRef = useRef<{
    active: boolean;
    pointerId: number;
    lastX: number;
    lastY: number;
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

      const snap = ref.getSnapshot();
      const oldZoom = snap.zoom;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom + delta));

      if (newZoom === oldZoom) return;

      // Zoom-to-cursor in world space: keep the world point under cursor fixed
      const camera = snap.camera;
      const newCameraX = camera.x + mouseX * (1 / oldZoom - 1 / newZoom);
      const newCameraY = camera.y + mouseY * (1 / oldZoom - 1 / newZoom);

      ref.batch(() => {
        ref.setZoom(newZoom);
        ref.setCamera(newCameraX, newCameraY);
      });
    }

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [ref, canvasRef, pageSize]);

  function startPan(e: PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    panStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    };

    canvas.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const st = panStateRef.current;
      if (!st) return;
      const snap = ref.getSnapshot();
      const { zoom, camera } = snap;
      // Incremental screen delta → world-space displacement → camera moves inversely
      const dx = (ev.clientX - st.lastX) / zoom;
      const dy = (ev.clientY - st.lastY) / zoom;
      st.lastX = ev.clientX;
      st.lastY = ev.clientY;
      const clamped = clampCamera(
        camera.x - dx,
        camera.y - dy,
        canvas!,
        pageSize[0],
        pageSize[1],
        zoom,
      );
      ref.setCamera(clamped.x, clamped.y);
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
