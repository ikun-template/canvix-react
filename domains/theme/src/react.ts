import { createContext, useContext, useSyncExternalStore } from 'react';

import type { ThemeManager } from './types.js';

const ThemeContext = createContext<ThemeManager | null>(null);

export const ThemeProvider = ThemeContext.Provider;

export function useTheme() {
  const manager = useContext(ThemeContext);
  if (!manager) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const theme = useSyncExternalStore(
    cb => manager.onChange(cb),
    () => manager.getTheme(),
  );

  return {
    theme,
    setTheme: manager.setTheme,
  };
}
