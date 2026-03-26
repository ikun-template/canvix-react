/*
 * Description: Save button — triggers document save, shows dirty indicator.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import { Save } from '@canvix-react/icon';
import {
  useEditorLive,
  useEditorRef,
  useI18n,
} from '@canvix-react/toolkit-editor';
import { toast } from '@canvix-react/ui';
import { useCallback, useState } from 'react';

export function SaveButton() {
  const { t } = useI18n();
  const editorCtx = useEditorRef();
  const dirty = useEditorLive('dirty');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await editorCtx.save();
      toast({ variant: 'success', description: t('save.success') });
    } catch {
      toast({ variant: 'destructive', description: t('save.error') });
    } finally {
      setSaving(false);
    }
  }, [editorCtx, saving, t]);

  return (
    <button
      className={`relative flex size-7 items-center justify-center rounded-md transition-colors ${
        dirty
          ? 'text-foreground hover:text-foreground/80'
          : 'text-muted-foreground hover:text-foreground'
      } ${saving ? 'pointer-events-none opacity-50' : ''}`}
      onClick={handleSave}
      disabled={saving}
    >
      <Save className="size-3.5" />
      {dirty && (
        <span className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />
      )}
    </button>
  );
}
