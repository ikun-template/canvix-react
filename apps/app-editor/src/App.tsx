import type {
  EditorConfig,
  LayoutPluginDefinition,
} from '@canvix-react/editor-types';
import { createI18nManager } from '@canvix-react/i18n';
import { canvasPlugin } from '@canvix-react/layout-editor-canvas';
import { inspectorPlugin } from '@canvix-react/layout-editor-inspector';
import { initSettingsFromStorage } from '@canvix-react/layout-editor-settings';
import { sidebarPlugin } from '@canvix-react/layout-editor-sidebar';
import { toolboxPlugin } from '@canvix-react/layout-editor-toolbox';
import { editorMessages } from '@canvix-react/locales';
import { serialize, servicesAdapter } from '@canvix-react/serializer';
import { createThemeManager } from '@canvix-react/theme';
import { containerDefinition } from '@canvix-react/widget-container/definition';
import { imageDefinition } from '@canvix-react/widget-image/definition';
import { shapeDefinition } from '@canvix-react/widget-shape/definition';
import { textDefinition } from '@canvix-react/widget-text/definition';
import { useEffect, useState } from 'react';

import { EditorShell } from './editor-shell.js';
import { useEditorBootstrap } from './use-editor-bootstrap.js';

// ── Static configuration ──

const themeManager = createThemeManager();
const i18nManager = createI18nManager({
  defaultLocale: 'zh-CN',
  messages: editorMessages,
  fallbackLocale: 'zh-CN',
});

const i18nReady = i18nManager.setLocale('zh-CN').then(() => {
  initSettingsFromStorage(i18nManager.setLocale, themeManager.setTheme);
});

const plugins: LayoutPluginDefinition[] = [
  canvasPlugin,
  sidebarPlugin,
  inspectorPlugin,
  toolboxPlugin,
];

const editorConfig: EditorConfig = {
  i18n: i18nManager,
  theme: themeManager,
};

const widgets = [
  textDefinition,
  imageDefinition,
  shapeDefinition,
  containerDefinition,
];

const saveAdapter = { serialize, persist: servicesAdapter.save };

// ── App ──

export default function App() {
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    i18nReady.then(() => setI18nLoaded(true));
  }, []);

  const { state, shellRef, runtime } = useEditorBootstrap({
    plugins,
    widgets,
    config: editorConfig,
    saveAdapter,
  });

  if (!i18nLoaded) return null;

  return (
    <EditorShell
      ref={shellRef}
      state={state}
      i18n={i18nManager}
      plugins={plugins}
      runtime={runtime}
    />
  );
}
