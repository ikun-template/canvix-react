import { createContext, useContext, useSyncExternalStore } from 'react';

import type { I18nManager } from './manager.js';

const I18nContext = createContext<I18nManager | null>(null);

export const I18nProvider = I18nContext.Provider;

export function useI18n() {
  const manager = useContext(I18nContext);
  if (!manager) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  const locale = useSyncExternalStore(
    cb => manager.onChange(cb),
    () => manager.getLocale(),
  );

  return {
    t: manager.t,
    locale,
  };
}
