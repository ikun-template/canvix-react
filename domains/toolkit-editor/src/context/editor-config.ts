import type { I18nManager } from '@canvix-react/i18n';
import type { ThemeManager } from '@canvix-react/theme';
import { createContext, useContext, useSyncExternalStore } from 'react';

export interface EditorConfigContextValue {
  i18n: I18nManager;
  theme: ThemeManager;
}

export const EditorConfigContext =
  createContext<EditorConfigContextValue | null>(null);
EditorConfigContext.displayName = 'EditorConfigContext';

export const EditorConfigProvider = EditorConfigContext.Provider;

export function useI18n() {
  const ctx = useContext(EditorConfigContext);
  if (!ctx)
    throw new Error('useI18n must be used within an EditorConfigProvider');
  const { i18n } = ctx;

  const locale = useSyncExternalStore(
    cb => i18n.onChange(cb),
    () => i18n.getLocale(),
  );

  return {
    t: i18n.t,
    locale,
    setLocale: i18n.setLocale,
    supportedLocales: i18n.getSupportedLocales(),
  };
}

export function useTheme() {
  const ctx = useContext(EditorConfigContext);
  if (!ctx)
    throw new Error('useTheme must be used within an EditorConfigProvider');
  const { theme } = ctx;

  const currentTheme = useSyncExternalStore(
    cb => theme.onChange(cb),
    () => theme.getTheme(),
  );

  return {
    theme: currentTheme,
    setTheme: theme.setTheme,
  };
}
