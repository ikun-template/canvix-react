import type { PluginDefinition } from '@canvix-react/dock-editor';
import { createI18nManager } from '@canvix-react/i18n';
import { canvasPlugin } from '@canvix-react/layout-editor-canvas';
import { inspectorPlugin } from '@canvix-react/layout-editor-inspector';
import { initSettingsFromStorage } from '@canvix-react/layout-editor-settings';
import { sidebarPlugin } from '@canvix-react/layout-editor-sidebar';
import { toolboxPlugin } from '@canvix-react/layout-editor-toolbox';
import { editorMessages } from '@canvix-react/locales';
import { createThemeManager } from '@canvix-react/theme';
import {
  EditorConfigProvider,
  type EditorConfigContextValue,
  EditorLiveProvider,
  EditorRefProvider,
  type EditorRefContextValue,
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

const plugins: PluginDefinition[] = [
  canvasPlugin,
  sidebarPlugin,
  inspectorPlugin,
  toolboxPlugin,
];

const pluginMetas = plugins.map(p => ({ name: p.name, slot: p.slot }));

const editorConfigValue: EditorConfigContextValue = {
  i18n: i18nManager,
  theme: themeManager,
};

export default function App() {
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    i18nReady.then(() => setI18nLoaded(true));
  }, []);

  const { state, shellRef, ctx, container } = useEditorBootstrap(plugins);

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
      ctx
        ? {
            chronicle: ctx.chronicle,
            editorState: ctx.editorState,
            registry: ctx.registry,
            plugins: pluginMetas,
            update: ctx.update,
            beginTemp: ctx.beginTemp,
          }
        : null,
    [ctx],
  );

  const subscribeDocument = useCallback(
    (cb: () => void) =>
      ctx!.chronicle.onUpdate(model => {
        if (model.target === 'document') cb();
      }),
    [ctx],
  );

  if (!i18nLoaded) return null;

  return (
    <EditorConfigProvider value={editorConfigValue}>
      {state.phase === 'loading' && <EditorLoading state={state} />}
      <EditorShell ref={shellRef} hidden={state.phase === 'loading'} />
      {ctx && docRefValue && editorRefValue && container && (
        <EditorRefProvider value={editorRefValue}>
          <DocumentRefProvider value={docRefValue}>
            <EditorLiveProvider>
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
            </EditorLiveProvider>
          </DocumentRefProvider>
        </EditorRefProvider>
      )}
    </EditorConfigProvider>
  );
}
