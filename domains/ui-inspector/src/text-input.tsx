import { Input } from '@canvix-react/ui';
import type { ComponentProps } from 'react';

import { cn } from './utils.js';

interface TextInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: string;
  onChange: (value: string) => void;
}

function TextInput({ value, onChange, className, ...props }: TextInputProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn('h-8 px-2 text-sm', className)}
      {...props}
    />
  );
}

export { TextInput };
export type { TextInputProps };
