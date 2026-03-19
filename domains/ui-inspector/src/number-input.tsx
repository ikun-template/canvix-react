import { Input } from '@canvix-react/ui';
import type { ComponentProps } from 'react';

import { cn } from './utils.js';

interface NumberInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  className,
  ...props
}: NumberInputProps) {
  return (
    <Input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      className={cn('h-7 px-2 text-xs', className)}
      {...props}
    />
  );
}

export { NumberInput };
export type { NumberInputProps };
