/*
 * Description: Zoom percentage input for toolbox — displays current zoom and allows manual input.
 *
 * Author: qinzhenya
 * Created: 2026-03-31
 */

import { useEditorLive, useEditorRef } from '@canvix-react/toolkit-editor';
import { cn } from '@canvix-react/ui';
import { useEffect, useRef, useState } from 'react';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5;

export function ZoomInput() {
  const ref = useEditorRef();
  const zoom = useEditorLive('zoom');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = Math.round(zoom * 100);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(displayValue));

  useEffect(() => {
    if (!editing) {
      setDraft(String(displayValue));
    }
  }, [displayValue, editing]);

  function commit() {
    setEditing(false);

    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) return;

    const clamped = Math.min(Math.max(parsed / 100, ZOOM_MIN), ZOOM_MAX);
    ref.setZoom(clamped);
  }

  return (
    <div className={cn('relative flex items-center', 'h-7 w-14')}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={editing ? draft : String(displayValue)}
        className={cn(
          'h-full w-full pr-4',
          'rounded-md border border-transparent bg-transparent',
          'text-center text-xs tabular-nums',
          'outline-none',
          'focus:border-border',
        )}
        onFocus={() => {
          setEditing(true);
          setDraft(String(displayValue));
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        onBlur={commit}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
          }
          if (e.key === 'Escape') {
            setEditing(false);
            setDraft(String(displayValue));
            inputRef.current?.blur();
          }
        }}
      />
      <span className="text-muted-foreground pointer-events-none absolute right-1.5 text-xs">
        %
      </span>
    </div>
  );
}
