import { imageDefinition } from '@canvix-react/widget-image/definition';
import { createWidgetRegistry } from '@canvix-react/widget-registry';
import { shapeDefinition } from '@canvix-react/widget-shape/definition';
import { textDefinition } from '@canvix-react/widget-text/definition';

export function createRegistry() {
  const registry = createWidgetRegistry();

  registry.register(textDefinition);
  registry.register(imageDefinition);
  registry.register(shapeDefinition);

  return registry;
}
