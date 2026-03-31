import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import type { ImageData } from './types.js';

export function ImageRender({ widget }: WidgetRenderProps<ImageData>) {
  const { custom_data: data } = widget;
  if (!data.src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f0f0',
          color: '#999',
        }}
      >
        拖入图片
      </div>
    );
  }

  return (
    <img
      src={data.src}
      alt={data.alt}
      style={{ width: '100%', height: '100%', objectFit: data.fit }}
    />
  );
}
