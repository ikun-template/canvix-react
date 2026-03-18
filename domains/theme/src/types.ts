export interface ThemeManager {
  getTheme(): string;
  setTheme(name: string): void;
  registerTheme(name: string, tokens: Record<string, string>): void;
  mergeEditorTokens(tokens: Record<string, string>): void;
  onChange(listener: () => void): () => void;
}
