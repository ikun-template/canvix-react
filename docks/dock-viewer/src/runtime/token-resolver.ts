import type { DocumentRuntime } from '@canvix-react/schema-document';
import type { PageRuntime } from '@canvix-react/schema-page';
import type { WidgetRuntime } from '@canvix-react/schema-widget';

export interface ResolveContext {
  document: DocumentRuntime;
  page: PageRuntime;
  widget?: WidgetRuntime;
}

export type TokenHandler = (
  path: string,
  ctx: ResolveContext,
) => string | undefined;

const TOKEN_RE = /\{([^}]+)\}/g;

export class TokenResolver {
  private handlers = new Map<string, TokenHandler>();

  register(scope: string, handler: TokenHandler): void {
    this.handlers.set(scope, handler);
  }

  /**
   * Resolve all `{scope.path}` tokens in a string value.
   * Returns the original value if no tokens are found or handler is missing.
   */
  resolve(value: string, ctx: ResolveContext): string {
    return value.replace(TOKEN_RE, (match, expr: string) => {
      const dotIndex = expr.indexOf('.');
      if (dotIndex < 0) return match;

      const scope = expr.slice(0, dotIndex);
      const path = expr.slice(dotIndex + 1);
      const handler = this.handlers.get(scope);
      if (!handler) return match;

      return handler(path, ctx) ?? match;
    });
  }
}
