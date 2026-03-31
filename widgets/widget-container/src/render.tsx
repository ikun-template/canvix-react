/*
 * Description: Container widget render component — shared by editor and viewer.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import type { WidgetRenderProps } from '@canvix-react/widget-registry';
import type { ComponentType } from 'react';

import type { ContainerData } from './types.js';

interface ContainerRenderProps extends WidgetRenderProps<ContainerData> {
  SlotRenderer: ComponentType<{ slotName: string }>;
}

export function ContainerRender({
  widget,
  SlotRenderer,
}: ContainerRenderProps) {
  const { custom_data: data } = widget;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: data.direction,
        gap: data.gap,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <SlotRenderer slotName="header" />
      </div>
      <div style={{ flex: 3, minWidth: 0, minHeight: 0 }}>
        <SlotRenderer slotName="content" />
      </div>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <SlotRenderer slotName="footer" />
      </div>
    </div>
  );
}
