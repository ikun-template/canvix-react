import type { ReactNode } from 'react';

import { cn } from './utils.js';

interface FieldGroupProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function FieldGroup({ title, children, className }: FieldGroupProps) {
  return (
    <fieldset
      className={cn('border-border mb-3 rounded border px-2 py-2', className)}
    >
      <legend className="text-muted-foreground px-1 text-xs">{title}</legend>
      {children}
    </fieldset>
  );
}

export { FieldGroup };
export type { FieldGroupProps };
