'use client';

import { XIcon } from 'lucide-react';
import { Toast as ToastPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '../lib/utils.js';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 2000;

// ── Toast state management ──

type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

type Action =
  | { type: 'ADD'; toast: ToastData }
  | { type: 'DISMISS'; id: string }
  | { type: 'REMOVE'; id: string };

interface State {
  toasts: ToastData[];
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  for (const listener of listeners) {
    listener(memoryState);
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return {
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'DISMISS':
      return state;
    case 'REMOVE':
      return {
        toasts: state.toasts.filter(t => t.id !== action.id),
      };
  }
}

const DISMISS_ANIMATION_DELAY = 300;

function toast(props: Omit<ToastData, 'id'>) {
  const id = genId();
  dispatch({ type: 'ADD', toast: { ...props, id } });
  setTimeout(() => {
    dispatch({ type: 'DISMISS', id });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), DISMISS_ANIMATION_DELAY);
  }, TOAST_REMOVE_DELAY);
  return id;
}

function useToastState() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return state;
}

// ── Toast components ──

function ToastProvider({
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider data-slot="toast-provider" {...props} />;
}

function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'fixed right-0 bottom-0 z-[100] flex max-h-screen w-auto flex-col gap-2 p-4 sm:max-w-[260px]',
        className,
      )}
      {...props}
    />
  );
}

function ToastRoot({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & {
  variant?: ToastVariant;
}) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        'group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-md border py-3 pr-8 pl-3 shadow-lg transition-all',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
        variant === 'default' && 'bg-background text-foreground border-border',
        variant === 'success' &&
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        variant === 'destructive' &&
          'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      className={cn(
        'text-foreground/50 hover:text-foreground absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none',
        className,
      )}
      toast-close=""
      {...props}
    >
      <XIcon className="size-4" />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  );
}

// ── Toaster (drop-in global component) ──

function Toaster() {
  const { toasts } = useToastState();

  return (
    <ToastProvider>
      {toasts.map(t => (
        <ToastRoot key={t.id} variant={t.variant}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && (
              <ToastDescription>{t.description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

export {
  toast,
  Toaster,
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastClose,
  ToastTitle,
  ToastDescription,
};
