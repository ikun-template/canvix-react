import type { I18nManager } from '@canvix-react/i18n';

import type { BootstrapState } from './use-editor-bootstrap.js';

export function EditorLoading({
  state,
  i18n,
}: {
  state: BootstrapState;
  i18n: I18nManager;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
      <div className="bg-muted h-1 w-64 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${state.progress}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {i18n.t(state.messageKey)}
      </p>
    </div>
  );
}
