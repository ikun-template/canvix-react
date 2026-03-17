import type { WidgetRuntime } from '@canvix-react/schema-widget';

import { useRenderer } from './context.js';

interface WidgetContentProps {
  widget: WidgetRuntime;
}

export function WidgetContent({ widget }: WidgetContentProps) {
  const { registry, mode } = useRenderer();

  const definition = registry.get(widget.type);
  if (!definition) {
    return <div data-unknown-type={widget.type} />;
  }

  const Component =
    mode === 'editor' ? definition.render.editor : definition.render.viewer;

  return <Component data={widget.custom_data} />;
}
