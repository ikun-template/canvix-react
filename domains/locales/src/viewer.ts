import type { Messages } from '@canvix-react/i18n';

export const viewerMessages: Record<string, () => Promise<Messages>> = {
  'zh-CN': async () => {
    const [common, widgets] = await Promise.all([
      import('./langs/zh-CN/common.js'),
      import('./langs/zh-CN/widgets.js'),
    ]);
    return { ...common.default, ...widgets.default };
  },
  'en-US': async () => {
    const [common, widgets] = await Promise.all([
      import('./langs/en-US/common.js'),
      import('./langs/en-US/widgets.js'),
    ]);
    return { ...common.default, ...widgets.default };
  },
};
