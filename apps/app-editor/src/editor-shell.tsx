import { forwardRef } from 'react';

export const EditorShell = forwardRef<HTMLDivElement>(
  function EditorShell(_, ref) {
    return (
      <div
        ref={ref}
        className="relative grid h-full w-full grid-cols-[220px_1fr_260px] grid-rows-[1fr] [grid-template-areas:'sidebar_canvas_inspector']"
      >
        <div
          className="bg-background border-border overflow-y-auto border-r [grid-area:sidebar]"
          data-slot="sidebar"
        />
        <div
          className="bg-cvx-canvas-bg relative overflow-auto [grid-area:canvas]"
          data-slot="canvas"
        />
        <div
          className="bg-background border-border overflow-y-auto border-l [grid-area:inspector]"
          data-slot="inspector"
        />
        <div
          className="pointer-events-none absolute right-[260px] bottom-3 left-[220px] z-50 flex justify-center"
          data-slot="toolbox"
        />
      </div>
    );
  },
);
