/*
 * Description: Editor configuration types.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { I18nManager } from '@canvix-react/i18n';
import type { ThemeManager } from '@canvix-react/theme';

export interface EditorConfig {
  i18n: I18nManager;
  theme: ThemeManager;
}
