import { useI18n } from '@canvix-react/i18n';
import { useTheme } from '@canvix-react/theme';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@canvix-react/ui';
import { useEffect, useRef, useState } from 'react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STORAGE_KEY = 'canvix-settings';

const LOCALE_LABELS: Record<string, string> = {
  'zh-CN': '中文',
  'en-US': 'English',
};

interface SettingsState {
  locale: string;
  theme: string;
}

function loadSavedSettings(): SettingsState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(settings: SettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function initSettingsFromStorage(
  setLocale: (locale: string) => Promise<void>,
  setTheme: (theme: string) => void,
) {
  const saved = loadSavedSettings();
  if (!saved) return;
  setTheme(saved.theme);
  void setLocale(saved.locale);
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, locale, setLocale, supportedLocales } = useI18n();
  const { theme, setTheme } = useTheme();

  const [draftLocale, setDraftLocale] = useState(locale);
  const [draftTheme, setDraftTheme] = useState(theme);

  // Snapshot saved state when dialog opens, for cancel revert
  const savedRef = useRef<SettingsState>({ locale, theme });

  useEffect(() => {
    if (open) {
      const saved = loadSavedSettings();
      savedRef.current = saved ?? { locale, theme };
      setDraftLocale(locale);
      setDraftTheme(theme);
    }
  }, [open]);

  // Live preview
  useEffect(() => {
    if (!open) return;
    if (draftTheme !== theme) setTheme(draftTheme);
  }, [draftTheme]);

  useEffect(() => {
    if (!open) return;
    if (draftLocale !== locale) void setLocale(draftLocale);
  }, [draftLocale]);

  function handleCancel() {
    const { locale: savedLocale, theme: savedTheme } = savedRef.current;
    setTheme(savedTheme);
    void setLocale(savedLocale);
    onOpenChange(false);
  }

  function handleApply() {
    saveSettings({ locale: draftLocale, theme: draftTheme });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) handleCancel();
      }}
    >
      <DialogContent
        className="gap-0 p-0 sm:max-w-sm"
        onPointerDownOutside={e => e.preventDefault()}
      >
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-base">{t('settings.title')}</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-4 px-5 py-5">
          <SettingRow label={t('settings.language')}>
            <Select value={draftLocale} onValueChange={setDraftLocale}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLocales.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    {LOCALE_LABELS[loc] ?? loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label={t('settings.theme')}>
            <Select value={draftTheme} onValueChange={setDraftTheme}>
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  {t('settings.theme.light')}
                </SelectItem>
                <SelectItem value="dark">{t('settings.theme.dark')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
        <Separator />
        <DialogFooter className="px-5 py-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={handleApply}>
            {t('common.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <div className="w-40">{children}</div>
    </div>
  );
}
