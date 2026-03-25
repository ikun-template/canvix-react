import type { LayoutPluginDefinition } from '@canvix-react/dock-editor';
import { createI18nManager } from '@canvix-react/i18n';
import { Settings } from '@canvix-react/icon';
import { canvasPlugin } from '@canvix-react/layout-editor-canvas';
import { inspectorPlugin } from '@canvix-react/layout-editor-inspector';
import {
  initSettingsFromStorage,
  SettingsDialog,
} from '@canvix-react/layout-editor-settings';
import { sidebarPlugin } from '@canvix-react/layout-editor-sidebar';
import { toolboxPlugin } from '@canvix-react/layout-editor-toolbox';
import { editorMessages } from '@canvix-react/locales';
import { createThemeManager } from '@canvix-react/theme';
import {
  type EditorConfig,
  EditorRefProvider,
  type EditorRefContextValue,
  EditorStateStore,
} from '@canvix-react/toolkit-editor';
import {
  DocumentRefProvider,
  DocumentLiveProvider,
} from '@canvix-react/toolkit-shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { EditorLoading } from './editor-loading.js';
import { EditorShell } from './editor-shell.js';
import { SlotErrorBoundary } from './slot-error-boundary.js';
import { useEditorBootstrap } from './use-editor-bootstrap.js';

const themeManager = createThemeManager();
const i18nManager = createI18nManager({
  defaultLocale: 'zh-CN',
  messages: editorMessages,
  fallbackLocale: 'zh-CN',
});

// Load initial locale, then restore saved settings (theme + locale override)
const i18nReady = i18nManager.setLocale('zh-CN').then(() => {
  initSettingsFromStorage(i18nManager.setLocale, themeManager.setTheme);
});

const plugins: LayoutPluginDefinition[] = [
  canvasPlugin,
  sidebarPlugin,
  inspectorPlugin,
  toolboxPlugin,
];

const pluginMetas = plugins.map(p => ({ name: p.name, slot: p.slot }));

const editorConfig: EditorConfig = {
  i18n: i18nManager,
  theme: themeManager,
};

export default function App() {
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    i18nReady.then(() => setI18nLoaded(true));
  }, []);

  const { state, shellRef, ctx, container } = useEditorBootstrap(plugins);

  // Create EditorStateStore once when ctx becomes available
  const store = useMemo(() => {
    if (!ctx) return null;
    const doc = ctx.chronicle.getDocument();
    return new EditorStateStore({ initialPageId: doc.pages[0]?.id });
  }, [ctx]);

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

  const editorRefValue = useMemo<EditorRefContextValue | null>(
    () =>
      ctx && store
        ? {
            config: editorConfig,
            chronicle: ctx.chronicle,
            registry: ctx.registry,
            plugins: pluginMetas,
            update: ctx.update,
            beginTemp: ctx.beginTemp,
            setActivePage: pageId => store.setActivePage(pageId),
            setSelection: widgetIds => store.setSelection(widgetIds),
            setHoveredWidget: id => store.setHoveredWidget(id),
            setActiveTool: tool => store.setActiveTool(tool),
            setZoom: zoom => store.setZoom(zoom),
            setCamera: (x, y) => store.setCamera(x, y),
            setInteracting: value => store.setInteracting(value),
            setFlowDrag: (widgetId, size) => store.setFlowDrag(widgetId, size),
            setFlowDropIndex: index => store.setFlowDropIndex(index),
            batch: fn => store.batch(fn),
            getSnapshot: store.getSnapshot,
            onChange: store.onChange,
          }
        : null,
    [ctx, store],
  );

  const subscribeDocument = useCallback(
    (cb: () => void) =>
      ctx!.chronicle.onUpdate(model => {
        if (model.target === 'document') cb();
      }),
    [ctx],
  );

  if (!i18nLoaded) return null;

  const ready = ctx && docRefValue && editorRefValue && container;

  return (
    <>
      {state.phase === 'loading' && (
        <EditorLoading state={state} i18n={i18nManager} />
      )}
      <EditorShell ref={shellRef} hidden={state.phase === 'loading'} />
      {ready && (
        <EditorRefProvider value={editorRefValue}>
          <DocumentRefProvider value={docRefValue}>
            <DocumentLiveProvider subscribe={subscribeDocument}>
              <SettingsButton container={container} />
              {plugins.map(p => {
                if (!p.slot || !p.component) return null;
                const slotEl = container.querySelector<HTMLElement>(
                  `[data-slot="${p.slot}"]`,
                );
                if (!slotEl) return null;
                const Component = p.component;
                return createPortal(
                  <SlotErrorBoundary
                    key={p.name}
                    slotName={p.slot}
                    chronicle={ctx.chronicle}
                  >
                    <Component ctx={ctx} />
                  </SlotErrorBoundary>,
                  slotEl,
                  p.name,
                );
              })}
            </DocumentLiveProvider>
          </DocumentRefProvider>
        </EditorRefProvider>
      )}
    </>
  );
}

function SettingsButton({ container }: { container: HTMLElement }) {
  const [open, setOpen] = useState(false);

  const sidebarEl = container.querySelector<HTMLElement>(
    '[data-slot="sidebar"]',
  )?.parentElement;
  if (!sidebarEl) return null;

  return createPortal(
    <>
      <button
        className="text-muted-foreground hover:text-foreground absolute bottom-2 left-2 z-10 flex size-7 items-center justify-center rounded-md transition-colors"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-3.5" />
      </button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>,
    sidebarEl,
  );
}
