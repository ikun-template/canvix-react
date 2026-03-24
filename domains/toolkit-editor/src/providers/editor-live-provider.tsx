import type { ReactNode } from 'react';
import { useMemo, useRef, useSyncExternalStore } from 'react';

import {
  EditorDispatchContext,
  type EditorDispatch,
} from '../context/editor-dispatch.js';
import {
  EditorLiveContext,
  type EditorLiveContextValue,
} from '../context/editor-live.js';
import { EditorStateStore } from '../store/editor-state-store.js';

interface EditorLiveProviderProps {
  initialPageId?: string;
  children: ReactNode;
}

export function EditorLiveProvider({
  initialPageId,
  children,
}: EditorLiveProviderProps) {
  const storeRef = useRef<EditorStateStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new EditorStateStore({ initialPageId });
  }
  const store = storeRef.current;

  const snapshot = useSyncExternalStore(store.onChange, store.getSnapshot);

  const dispatch = useMemo<EditorDispatch>(
    () => ({
      setActivePage: pageId => store.setActivePage(pageId),
      setSelection: widgetIds => store.setSelection(widgetIds),
      setHoveredWidget: id => store.setHoveredWidget(id),
      setActiveTool: tool => store.setActiveTool(tool),
      setZoom: zoom => store.setZoom(zoom),
      setScroll: (x, y) => store.setScroll(x, y),
      setInteracting: value => store.setInteracting(value),
      setFlowDrag: (widgetId, size) => store.setFlowDrag(widgetId, size),
      setFlowDropIndex: index => store.setFlowDropIndex(index),
      getSnapshot: store.getSnapshot,
      onChange: store.onChange,
    }),
    [store],
  );

  const value: EditorLiveContextValue = snapshot;

  return (
    <EditorDispatchContext.Provider value={dispatch}>
      <EditorLiveContext.Provider value={value}>
        {children}
      </EditorLiveContext.Provider>
    </EditorDispatchContext.Provider>
  );
}
