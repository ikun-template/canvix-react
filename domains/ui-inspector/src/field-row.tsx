import type { ReactNode } from 'react';

import { cn } from './utils.js';

interface FieldRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function FieldRow({ label, children, className }: FieldRowProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-muted-foreground w-8 shrink-0 truncate text-xs">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export { FieldRow };
export type { FieldRowProps };
