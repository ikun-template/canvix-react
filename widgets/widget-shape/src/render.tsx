import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import type { ShapeData } from './types.js';

export function ShapeRender({ widget }: WidgetRenderProps<ShapeData>) {
  const { custom_data: data } = widget;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: data.fill,
        borderRadius: data.shape === 'circle' ? '50%' : data.borderRadius,
        border: data.stroke
          ? `${data.strokeWidth}px solid ${data.stroke}`
          : undefined,
      }}
    />
  );
}
