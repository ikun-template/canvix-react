/*
 * Description: Editor bootstrap hook — creates and manages the Runtime lifecycle.
 *              Loads document from IndexedDB or creates a default one.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { DockEditor, type SaveAdapter } from '@canvix-react/dock-editor';
import type {
  EditorConfig,
  LayoutPluginDefinition,
  ServicePluginDefinition,
  WidgetPluginDefinition,
} from '@canvix-react/editor-types';
import { serialize, deserialize } from '@canvix-react/serializer';
import { documentService } from '@canvix-react/services';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createDefaultDocument } from './create-document.js';

export interface BootstrapState {
  phase: 'loading' | 'ready';
  progress: number;
  messageKey: string;
}

interface BootstrapOptions {
  plugins: LayoutPluginDefinition[];
  widgets: WidgetPluginDefinition[];
  servicePlugins?: ServicePluginDefinition[];
  config: EditorConfig;
  saveAdapter?: SaveAdapter;
}

interface BootstrapResult {
  state: BootstrapState;
  shellRef: (el: HTMLDivElement | null) => void;
  runtime: DockEditor | null;
}

const PHASE_INTERVAL = 200;

export function useEditorBootstrap(options: BootstrapOptions): BootstrapResult {
  const { plugins, widgets, servicePlugins, config, saveAdapter } = options;

  const [state, setState] = useState<BootstrapState>({
    phase: 'loading',
    progress: 20,
    messageKey: 'loading.document',
  });
  const [mounted, setMounted] = useState(false);
  const [runtime, setRuntime] = useState<DockEditor | null>(null);
  const editorInstance = useRef<DockEditor | null>(null);

  const shellRef = useCallback((el: HTMLDivElement | null) => {
    setMounted(el !== null);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    const setPhase = async (progress: number, messageKey: string) => {
      if (cancelled) return;
      setState({ phase: 'loading', progress, messageKey });
      await delay(PHASE_INTERVAL);
    };

    const run = async () => {
      // Phase 1: Load or create document
      await setPhase(20, 'loading.document');
      if (cancelled) return;

      let doc;
      let docId: string;

      const existing = await documentService.list();
      if (existing.length > 0) {
        const record = await documentService.get(existing[0].id);
        doc = record.data ? deserialize(record.data) : createDefaultDocument();
        docId = record.id;
      } else {
        doc = createDefaultDocument();
        const record = await documentService.create(doc.title || 'Untitled');
        await documentService.update(record.id, { data: serialize(doc) });
        docId = record.id;
      }
      if (cancelled) return;

      // Phase 2: Initialize editor
      await setPhase(60, 'loading.editor');
      if (cancelled) return;
      const editor = new DockEditor({
        document: doc,
        widgets,
        config,
        plugins,
        servicePlugins,
        documentId: docId,
        saveAdapter,
      });
      editorInstance.current = editor;

      await editor.start();

      // Phase 3: Finalize
      await setPhase(90, 'loading.ready');
      if (cancelled) return;

      setState({ phase: 'ready', progress: 100, messageKey: 'loading.ready' });
      setRuntime(editor);
    };

    run();

    return () => {
      cancelled = true;
      setRuntime(null);
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [mounted, plugins, widgets, servicePlugins, config, saveAdapter]);

  return { state, shellRef, runtime };
}
