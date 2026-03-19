import { FieldGroup } from '@canvix-react/ui-inspector';
import type { PropertyGroup } from '@canvix-react/widget-registry';

import { rendererMap } from './renderer-map.js';
import type { UpdateField } from './types.js';

const spanClass: Record<number, string> = {
  1: 'basis-[calc(25%-3px)]',
  2: 'basis-[calc(50%-2px)]',
  3: 'basis-[calc(75%-1px)]',
  4: 'basis-full',
};

interface PropertyRendererProps {
  groups: PropertyGroup[];
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
          <div className="flex flex-wrap gap-x-1 gap-y-1.5">
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
