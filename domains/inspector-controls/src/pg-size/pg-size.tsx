import { FieldRow, NumberInput } from '@canvix-react/ui-inspector';

import type { UpdateField } from '../types.js';

interface PgSizeProps {
  width: number;
  height: number;
  updateField: UpdateField;
}

function PgSize({ width, height, updateField }: PgSizeProps) {
  return (
    <div className="flex gap-1">
      <div className="flex-1">
        <FieldRow label="宽">
          <NumberInput
            value={width}
            onChange={v => updateField(['layout', 'size', 0], v)}
          />
        </FieldRow>
      </div>
      <div className="flex-1">
        <FieldRow label="高">
          <NumberInput
            value={height}
            onChange={v => updateField(['layout', 'size', 1], v)}
          />
        </FieldRow>
      </div>
    </div>
  );
}

export { PgSize };
export type { PgSizeProps };
