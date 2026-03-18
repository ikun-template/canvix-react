import type { ThemeManager } from './types.js';

export function createThemeManager(
  defaultTheme: string = 'light',
): ThemeManager {
  let currentTheme = defaultTheme;
  const customThemes = new Map<string, Record<string, string>>();
  const listeners = new Set<() => void>();
  const root = document.documentElement;

  function notify() {
    for (const fn of listeners) fn();
  }

  function applyTokens(tokens: Record<string, string>) {
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
    }
  }

  // 初始化
  if (defaultTheme === 'dark') {
    root.classList.add('dark');
  }

  const manager: ThemeManager = {
    getTheme() {
      return currentTheme;
    },

    setTheme(name: string) {
      // 清除旧主题
      root.classList.remove('dark');
      root.removeAttribute('data-theme');

      if (name === 'dark') {
        root.classList.add('dark');
      } else if (name !== 'light') {
        // 自定义主题
        const tokens = customThemes.get(name);
        if (tokens) {
          root.setAttribute('data-theme', name);
          applyTokens(tokens);
        }
      }

      currentTheme = name;
      notify();
    },

    registerTheme(name: string, tokens: Record<string, string>) {
      customThemes.set(name, tokens);
    },

    mergeEditorTokens(tokens: Record<string, string>) {
      applyTokens(tokens);
    },

    onChange(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return manager;
}
