import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import type { ImageData } from './types.js';

export function ImageViewer({ widget }: WidgetRenderProps<ImageData>) {
  const { custom_data: data } = widget;
  if (!data.src) return null;

  return (
    <img
      src={data.src}
      alt={data.alt}
      style={{ width: '100%', height: '100%', objectFit: data.fit }}
    />
  );
}
