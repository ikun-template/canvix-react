/*
 * Description: Centers the page in the viewport when canvas gets valid size or page switches.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { EditorRefContextValue } from '@canvix-react/toolkit-editor';
import { useEffect, useRef } from 'react';

export function useViewportCentering({
  ref,
  canvasRef,
  pageContainerRef,
  pageId,
}: {
  ref: EditorRefContextValue;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  pageContainerRef: React.RefObject<HTMLDivElement | null>;
  pageId: string | null;
}) {
  const viewportReadyRef = useRef(false);
  const centeredPageIdRef = useRef<string | null>(null);

  if (pageId !== centeredPageIdRef.current) {
    viewportReadyRef.current = false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pageId) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width: vw, height: vh } = entry.contentRect;
      if (vw === 0 || vh === 0) return;
      observer.disconnect();

      const pageEl = pageContainerRef.current;
      if (!pageEl) return;
      const { zoom: currentZoom } = ref.getSnapshot();

      viewportReadyRef.current = true;
      centeredPageIdRef.current = pageId;
      const pageW = pageEl.offsetWidth;
      const pageH = pageEl.offsetHeight;
      const cameraX = pageW / 2 - vw / (2 * currentZoom);
      const cameraY = pageH / 2 - vh / (2 * currentZoom);
      ref.setCamera(cameraX, cameraY);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [pageId, ref, canvasRef, pageContainerRef]);

  return { viewportReadyRef };
}
