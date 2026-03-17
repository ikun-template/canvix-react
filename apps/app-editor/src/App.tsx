import { Runtime } from '@canvix-react/dock-editor';
import { canvasPlugin } from '@canvix-react/layout-editor-canvas';
import { inspectorPlugin } from '@canvix-react/layout-editor-inspector';
import { sidebarPlugin } from '@canvix-react/layout-editor-sidebar';
import { toolboxPlugin } from '@canvix-react/layout-editor-toolbox';
import { useEffect, useRef } from 'react';

import { createDefaultDocument } from './create-document.js';
import { createRegistry } from './create-registry.js';
import { EditorShell } from './editor-shell.js';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const document = createDefaultDocument();
    const registry = createRegistry();

    const runtime = new Runtime({
      document,
      registry,
      plugins: [canvasPlugin, sidebarPlugin, inspectorPlugin, toolboxPlugin],
      container,
    });

    runtime.start();

    return () => {
      runtime.destroy();
    };
  }, []);

  return <EditorShell ref={containerRef} />;
}
