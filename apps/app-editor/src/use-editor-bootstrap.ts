import type {
  PluginContext,
  PluginDefinition,
} from '@canvix-react/dock-editor';
import { DockEditor } from '@canvix-react/dock-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createDefaultDocument } from './create-document.js';
import { createRegistry } from './create-registry.js';

export interface BootstrapState {
  phase: 'loading' | 'ready';
  progress: number;
  messageKey: string;
}

interface BootstrapResult {
  state: BootstrapState;
  shellRef: (el: HTMLDivElement | null) => void;
  ctx: PluginContext | null;
  container: HTMLDivElement | null;
}

const PHASE_INTERVAL = 200;

export function useEditorBootstrap(
  plugins: PluginDefinition[],
): BootstrapResult {
  const [state, setState] = useState<BootstrapState>({
    phase: 'loading',
    progress: 20,
    messageKey: 'loading.document',
  });
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [ctx, setCtx] = useState<PluginContext | null>(null);
  const editorRef = useRef<DockEditor | null>(null);

  const shellRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el);
  }, []);

  useEffect(() => {
    if (!container) return;

    let cancelled = false;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const setPhase = async (progress: number, messageKey: string) => {
      if (cancelled) return;
      setState({ phase: 'loading', progress, messageKey });
      await delay(PHASE_INTERVAL);
    };

    const run = async () => {
      // Phase 2: Load document
      await setPhase(20, 'loading.document');
      if (cancelled) return;
      const doc = createDefaultDocument();

      // Phase 3: Register widgets
      await setPhase(40, 'loading.registry');
      if (cancelled) return;
      const registry = createRegistry();

      // Phase 4: Start editor
      await setPhase(60, 'loading.editor');
      if (cancelled) return;
      const editor = new DockEditor({
        document: doc,
        registry,
        plugins,
        container,
      });
      editorRef.current = editor;

      await editor.start();

      // Phase 5: Ready
      await setPhase(90, 'loading.ready');
      if (cancelled) return;

      setState({ phase: 'ready', progress: 100, messageKey: 'loading.ready' });
      setCtx(editor.getPluginContext());
    };

    run();

    return () => {
      cancelled = true;
      setCtx(null);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [container, plugins]);

  return { state, shellRef, ctx, container };
}
