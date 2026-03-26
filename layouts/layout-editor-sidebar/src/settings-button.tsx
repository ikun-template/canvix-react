/*
 * Description: Settings gear button with dialog for editor configuration.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { Settings } from '@canvix-react/icon';
import { SettingsDialog } from '@canvix-react/layout-editor-settings';
import { useState } from 'react';

export function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-3.5" />
      </button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
