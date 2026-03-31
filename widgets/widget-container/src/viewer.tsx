/*
 * Description: Container widget viewer component.
 *
 * Author: xiaoyown
 * Created: 2026-03-31
 */

import { ViewerSlotRenderer } from '@canvix-react/page-renderer';
import type { WidgetRenderProps } from '@canvix-react/widget-registry';

import { ContainerRender } from './render.js';
import type { ContainerData } from './types.js';

export function ContainerViewer(props: WidgetRenderProps<ContainerData>) {
  return <ContainerRender {...props} SlotRenderer={ViewerSlotRenderer} />;
}
