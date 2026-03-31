/*
 * Description: Container widget editor component.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import { EditorSlotRenderer } from '@canvix-react/toolkit-editor';
import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import { ContainerRender } from './render.js';
import type { ContainerData } from './types.js';

export function ContainerEditor(props: WidgetRenderProps<ContainerData>) {
  return <ContainerRender {...props} SlotRenderer={EditorSlotRenderer} />;
}
