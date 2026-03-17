import type { Messages } from '@canvix-react/i18n';

export const editorMessages: Record<string, () => Promise<Messages>> = {
  'zh-CN': () => import('./langs/zh-CN/index.js').then(m => m.default),
  'en-US': () => import('./langs/en-US/index.js').then(m => m.default),
};
