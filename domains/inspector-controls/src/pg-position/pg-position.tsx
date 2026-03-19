import { FieldRow, NumberInput } from '@canvix-react/ui-inspector';

import type { UpdateField } from '../types.js';

interface PgPositionProps {
  x: number;
  y: number;
  updateField: UpdateField;
}

function PgPosition({ x, y, updateField }: PgPositionProps) {
  return (
    <div className="flex gap-1">
      <div className="flex-1">
        <FieldRow label="X">
          <NumberInput
            value={x}
            onChange={v => updateField(['position', 'axis', 0], v)}
          />
        </FieldRow>
      </div>
      <div className="flex-1">
        <FieldRow label="Y">
          <NumberInput
            value={y}
            onChange={v => updateField(['position', 'axis', 1], v)}
          />
        </FieldRow>
      </div>
    </div>
  );
}

export { PgPosition };
export type { PgPositionProps };
