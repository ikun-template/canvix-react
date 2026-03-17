import { forwardRef } from 'react';

export const EditorShell = forwardRef<HTMLDivElement>(
  function EditorShell(_, ref) {
    return (
      <div ref={ref} className="editor-shell">
        <div className="editor-shell__sidebar" data-slot="sidebar" />
        <div className="editor-shell__canvas" data-slot="canvas" />
        <div className="editor-shell__inspector" data-slot="inspector" />
        <div className="editor-shell__toolbox" data-slot="toolbox" />
      </div>
    );
  },
);
