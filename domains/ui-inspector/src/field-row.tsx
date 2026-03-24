import type { ReactNode } from 'react';

import { cn } from './utils.js';

interface FieldRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function FieldRow({ label, children, className }: FieldRowProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-muted-foreground text-xs leading-none">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export { FieldRow };
export type { FieldRowProps };
