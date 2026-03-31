import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import type { TextData } from './types.js';

export function TextRender({ widget }: WidgetRenderProps<TextData>) {
  const { custom_data: data } = widget;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize: data.fontSize,
        color: data.color,
        textAlign: data.align,
        padding: 8,
        wordBreak: 'break-word',
      }}
    >
      {data.content}
    </div>
  );
}
