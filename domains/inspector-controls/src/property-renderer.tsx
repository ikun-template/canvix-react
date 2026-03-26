import type { InspectorGroup, UpdateField } from '@canvix-react/editor-types';
import { FieldGroup } from '@canvix-react/ui-inspector';

import { rendererMap } from './renderer-map.js';

const spanClass: Record<number, string> = {
  1: 'min-w-0 basis-[calc(25%-6px)]',
  2: 'min-w-0 basis-[calc(50%-4px)]',
  3: 'min-w-0 basis-[calc(75%-2px)]',
  4: 'min-w-0 basis-full',
};

interface PropertyRendererProps {
  groups: InspectorGroup[];
  widgetData: Record<string, unknown>;
  updateField: UpdateField;
}

function PropertyRenderer({
  groups,
  widgetData,
  updateField,
}: PropertyRendererProps) {
  return (
    <>
      {groups.map(group => (
        <FieldGroup key={group.title} title={group.title}>
          <div className="flex flex-wrap gap-x-2 gap-y-2.5">
            {group.properties.map(prop => {
              const Comp = rendererMap[prop.renderer];
              if (!Comp) return null;

              const value = resolveChain(widgetData, prop.chain);
              const span = prop.span ?? 4;

              return (
                <div key={prop.chain.join('.')} className={spanClass[span]}>
                  <Comp
                    label={prop.label}
                    value={value}
                    onChange={(v: unknown) => updateField(prop.chain, v)}
                    updateField={updateField}
                    {...(prop.options?.items
                      ? { items: prop.options.items as string[] }
                      : undefined)}
                    {...(prop.options?.step !== undefined
                      ? { step: prop.options.step as number }
                      : undefined)}
                    {...(prop.options?.min !== undefined
                      ? { min: prop.options.min as number }
                      : undefined)}
                    {...(prop.options?.max !== undefined
                      ? { max: prop.options.max as number }
                      : undefined)}
                  />
                </div>
              );
            })}
          </div>
        </FieldGroup>
      ))}
    </>
  );
}

function resolveChain(
  obj: Record<string, unknown>,
  chain: (string | number)[],
): unknown {
  let current: unknown = obj;
  for (const key of chain) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export { PropertyRenderer };
export type { PropertyRendererProps };
