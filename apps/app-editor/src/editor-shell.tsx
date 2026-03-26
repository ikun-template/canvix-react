/*
 * Description: Editor shell — grid layout container that handles loading/ready states
 *              and renders plugins into named slot areas.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { DockEditor } from '@canvix-react/dock-editor';
import type { LayoutPluginDefinition } from '@canvix-react/editor-types';
import type { I18nManager } from '@canvix-react/i18n';
import type { EditorRefContextValue } from '@canvix-react/toolkit-editor';
import { EditorRefProvider } from '@canvix-react/toolkit-editor';
import {
  DocumentRefProvider,
  DocumentLiveProvider,
} from '@canvix-react/toolkit-shared';
import { Toaster } from '@canvix-react/ui';
import { forwardRef, useMemo, type ReactNode } from 'react';

import { SlotErrorBoundary } from './slot-error-boundary.js';
import type { BootstrapState } from './use-editor-bootstrap.js';

interface EditorShellProps {
  state: BootstrapState;
  i18n: I18nManager;
  plugins: LayoutPluginDefinition[];
  runtime: DockEditor | null;
}

const SLOT_STYLES: Record<string, string> = {
  sidebar: 'bg-background border-border relative border-r [grid-area:sidebar]',
  canvas: 'bg-cvx-canvas-bg relative overflow-auto [grid-area:canvas]',
  inspector:
    'bg-background border-border overflow-y-auto border-l [grid-area:inspector]',
  toolbox:
    'pointer-events-none absolute right-65 bottom-3 left-55 z-50 flex justify-center',
};

export const EditorShell = forwardRef<HTMLDivElement, EditorShellProps>(
  function EditorShell({ state, i18n, plugins, runtime }, ref) {
    const loading = state.phase === 'loading';

    // ── Derive React context values from runtime ──

    const ctx = useMemo(() => {
      if (!runtime) return null;
      const ec = runtime.getEditorContext();
      const editorValue: EditorRefContextValue = {
        config: ec.config,
        chronicle: ec.chronicle,
        registry: ec.registry,
        plugins: ec.plugins,
        update: ec.update,
        beginDraft: ec.beginDraft,
        setActivePage: id => ec.store.setActivePage(id),
        setSelection: ids => ec.store.setSelection(ids),
        setHoveredWidget: id => ec.store.setHoveredWidget(id),
        setActiveTool: tool => ec.store.setActiveTool(tool),
        setZoom: z => ec.store.setZoom(z),
        setCamera: (x, y) => ec.store.setCamera(x, y),
        setInteracting: v => ec.store.setInteracting(v),
        setFlowDrag: (id, size) => ec.store.setFlowDrag(id, size),
        setFlowDropIndex: idx => ec.store.setFlowDropIndex(idx),
        setDirty: v => ec.store.setDirty(v),
        batch: fn => ec.store.batch(fn),
        getSnapshot: ec.store.getSnapshot,
        onChange: ec.store.onChange,
        save: ec.save,
      };
      return {
        editorValue,
        docValue: { getDocument: ec.getDocument },
        subscribeDocument: ec.subscribeDocument,
        chronicle: ec.chronicle,
      };
    }, [runtime]);

    // ── Slot mapping ──

    const slotContent = new Map<string, ReactNode>();
    if (ctx) {
      for (const p of plugins) {
        const Component = p.component;
        slotContent.set(
          p.slot,
          <SlotErrorBoundary
            key={p.name}
            slotName={p.slot}
            chronicle={ctx.chronicle}
          >
            <Component />
          </SlotErrorBoundary>,
        );
      }
    }

    // ── Grid areas ──

    const slotAreas = (
      <>
        <div className={SLOT_STYLES.sidebar}>{slotContent.get('sidebar')}</div>
        <div className={SLOT_STYLES.canvas}>{slotContent.get('canvas')}</div>
        <div className={SLOT_STYLES.inspector}>
          {slotContent.get('inspector')}
        </div>
        <div className={SLOT_STYLES.toolbox}>{slotContent.get('toolbox')}</div>
      </>
    );

    return (
      <>
        {loading && (
          <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
            <div className="bg-muted h-1 w-64 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {i18n.t(state.messageKey)}
            </p>
          </div>
        )}
        <div
          ref={ref}
          className="relative grid h-full w-full grid-cols-[220px_1fr_260px] grid-rows-[1fr] [grid-template-areas:'sidebar_canvas_inspector']"
          style={loading ? { visibility: 'hidden' } : undefined}
        >
          {ctx ? (
            <EditorRefProvider value={ctx.editorValue}>
              <DocumentRefProvider value={ctx.docValue}>
                <DocumentLiveProvider subscribe={ctx.subscribeDocument}>
                  {slotAreas}
                </DocumentLiveProvider>
              </DocumentRefProvider>
            </EditorRefProvider>
          ) : (
            slotAreas
          )}
        </div>
        <Toaster />
      </>
    );
  },
);
