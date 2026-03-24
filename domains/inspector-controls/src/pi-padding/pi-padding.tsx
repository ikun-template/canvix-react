import { ChevronDown, ChevronUp } from '@canvix-react/icon';
import { FieldRow, NumberInput } from '@canvix-react/ui-inspector';
import { useState } from 'react';

type Padding = [number, number, number, number];

interface PiPaddingProps {
  label: string;
  value: Padding;
  onChange: (value: Padding) => void;
}

const labels = ['上', '右', '下', '左'] as const;

function isUniform(v: Padding) {
  return v[0] === v[1] && v[1] === v[2] && v[2] === v[3];
}

function PiPadding({ label, value, onChange }: PiPaddingProps) {
  const uniform = isUniform(value);
  const [expanded, setExpanded] = useState(false);
  const showExpanded = expanded || !uniform;

  const Icon = showExpanded ? ChevronUp : ChevronDown;

  const update = (index: number, v: number) => {
    const next = [...value] as Padding;
    next[index] = v;
    onChange(next);
  };

  const updateAll = (v: number) => {
    onChange([v, v, v, v]);
  };

  const toggle = () => {
    if (showExpanded) {
      onChange([value[0], value[0], value[0], value[0]]);
      setExpanded(false);
    } else {
      setExpanded(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs leading-none">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <NumberInput value={value[0]} onChange={updateAll} min={0} />
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
            onClick={toggle}
            title={showExpanded ? '统一设置' : '分别设置四边'}
          >
            <Icon size={12} />
          </button>
        </div>
      </div>

      {showExpanded && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {([0, 1] as const).map(i => (
              <div key={labels[i]} className="min-w-0 flex-1">
                <FieldRow label={labels[i]}>
                  <NumberInput
                    value={value[i]}
                    onChange={v => update(i, v)}
                    min={0}
                  />
                </FieldRow>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {([2, 3] as const).map(i => (
              <div key={labels[i]} className="min-w-0 flex-1">
                <FieldRow label={labels[i]}>
                  <NumberInput
                    value={value[i]}
                    onChange={v => update(i, v)}
                    min={0}
                  />
                </FieldRow>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { PiPadding };
export type { PiPaddingProps };
