import type {
  PluginContext,
  PluginDefinition,
} from '@canvix-react/dock-editor';
import { DockEditor } from '@canvix-react/dock-editor';
import { canvasPlugin } from '@canvix-react/layout-editor-canvas';
import { inspectorPlugin } from '@canvix-react/layout-editor-inspector';
import { sidebarPlugin } from '@canvix-react/layout-editor-sidebar';
import { toolboxPlugin } from '@canvix-react/layout-editor-toolbox';
import { EditorProvider } from '@canvix-react/toolkit-editor';
import {
  DocumentRefProvider,
  DocumentLiveProvider,
} from '@canvix-react/toolkit-shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { createDefaultDocument } from './create-document.js';
import { createRegistry } from './create-registry.js';
import { EditorShell } from './editor-shell.js';
import { SlotErrorBoundary } from './slot-error-boundary.js';

const plugins: PluginDefinition[] = [
  canvasPlugin,
  sidebarPlugin,
  inspectorPlugin,
  toolboxPlugin,
];

export default function App() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [ctx, setCtx] = useState<PluginContext | null>(null);

  const shellRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el);
  }, []);

  useEffect(() => {
    if (!container) return;

    let cancelled = false;
    const doc = createDefaultDocument();
    const registry = createRegistry();

    const editor = new DockEditor({
      document: doc,
      registry,
      plugins,
      container,
    });

    editor.start().then(() => {
      if (!cancelled) setCtx(editor.getPluginContext());
    });

    return () => {
      cancelled = true;
      setCtx(null);
      editor.destroy();
    };
  }, [container]);

  const docRefValue = useMemo(
    () =>
      ctx
        ? {
            document: ctx.chronicle.getDocument(),
            getDocument: () => ctx.chronicle.getDocument(),
          }
        : null,
    [ctx],
  );

  const editorCtxValue = useMemo(
    () => (ctx ? { chronicle: ctx.chronicle } : null),
    [ctx],
  );

  const subscribeDocument = useCallback(
    (cb: () => void) =>
      ctx!.chronicle.onUpdate(model => {
        if (model.target === 'document') cb();
      }),
    [ctx],
  );

  return (
    <>
      <EditorShell ref={shellRef} />
      {ctx && docRefValue && editorCtxValue && container && (
        <DocumentRefProvider value={docRefValue}>
          <EditorProvider value={editorCtxValue}>
            <DocumentLiveProvider subscribe={subscribeDocument}>
              {plugins.map(p => {
                if (!p.slot || !p.component) return null;
                const slotEl = container.querySelector<HTMLElement>(
                  `[data-slot="${p.slot}"]`,
                );
                if (!slotEl) return null;
                const Component = p.component;
                return createPortal(
                  <SlotErrorBoundary slotName={p.slot} ctx={ctx}>
                    <Component ctx={ctx} />
                  </SlotErrorBoundary>,
                  slotEl,
                  p.name,
                );
              })}
            </DocumentLiveProvider>
          </EditorProvider>
        </DocumentRefProvider>
      )}
    </>
  );
}
