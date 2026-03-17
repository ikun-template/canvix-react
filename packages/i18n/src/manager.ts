export type Messages = Record<string, string>;
export type MessageLoader = () => Promise<Messages>;
export type MessageLoaders = Record<string, MessageLoader>;

export interface I18nManager {
  getLocale(): string;
  setLocale(locale: string): Promise<void>;
  t(key: string, params?: Record<string, string | number>): string;
  getSupportedLocales(): string[];
  onChange(listener: () => void): () => void;
}

export interface CreateI18nOptions {
  defaultLocale: string;
  messages: MessageLoaders;
  fallbackLocale?: string;
}

export function createI18nManager(options: CreateI18nOptions): I18nManager {
  const { defaultLocale, messages, fallbackLocale } = options;

  let currentLocale = defaultLocale;
  let currentMessages: Messages = {};
  const cache = new Map<string, Messages>();
  const listeners = new Set<() => void>();

  function notify() {
    for (const fn of listeners) fn();
  }

  function interpolate(
    template: string,
    params?: Record<string, string | number>,
  ): string {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, key: string) =>
      params[key] !== undefined ? String(params[key]) : `{${key}}`,
    );
  }

  const manager: I18nManager = {
    getLocale() {
      return currentLocale;
    },

    async setLocale(locale: string) {
      if (!messages[locale]) {
        throw new Error(`Unsupported locale: ${locale}`);
      }

      if (cache.has(locale)) {
        currentMessages = cache.get(locale)!;
      } else {
        const loaded = await messages[locale]();
        cache.set(locale, loaded);
        currentMessages = loaded;
      }

      currentLocale = locale;
      notify();
    },

    t(key: string, params?: Record<string, string | number>): string {
      const value = currentMessages[key];
      if (value !== undefined) return interpolate(value, params);

      if (fallbackLocale && fallbackLocale !== currentLocale) {
        const fallback = cache.get(fallbackLocale);
        if (fallback?.[key] !== undefined) {
          return interpolate(fallback[key], params);
        }
      }

      return key;
    },

    getSupportedLocales() {
      return Object.keys(messages);
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
