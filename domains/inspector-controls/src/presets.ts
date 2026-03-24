import type { PropertyGroup } from '@canvix-react/widget-registry';

export function createBasePropertyGroup(): PropertyGroup {
  return {
    title: '基础属性',
    properties: [
      { chain: ['position'], renderer: 'position', label: '位置', span: 4 },
      { chain: ['layout'], renderer: 'size', label: '尺寸', span: 4 },
      { chain: ['rotation'], renderer: 'number', label: '旋转', span: 2 },
      {
        chain: ['opacity'],
        renderer: 'number',
        label: '透明',
        span: 2,
        options: { step: 0.1, min: 0, max: 1 },
      },
      {
        chain: ['layout', 'padding'],
        renderer: 'padding',
        label: '内边距',
        span: 4,
      },
    ],
  };
}
