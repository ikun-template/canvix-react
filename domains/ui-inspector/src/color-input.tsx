import { useCallback, useRef } from 'react';

import { useColorPickerService } from './color-picker-provider.js';
import { cn } from './utils.js';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function ColorInput({ value, onChange, className }: ColorInputProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const picker = useColorPickerService();

  const handleClick = useCallback(() => {
    if (ref.current) {
      picker.open(ref.current, { value, onChange });
    }
  }, [picker, value, onChange]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        'border-input flex h-7 w-full items-center gap-1.5 rounded-md border px-1.5 text-xs',
        className,
      )}
    >
      <span
        className="border-input size-4 shrink-0 rounded-sm border"
        style={{ backgroundColor: value }}
      />
      <span className="text-muted-foreground truncate">
        {value || '未设置'}
      </span>
    </button>
  );
}

export { ColorInput };
export type { ColorInputProps };
