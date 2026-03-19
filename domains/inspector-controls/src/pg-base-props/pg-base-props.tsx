import { FieldGroup, FieldRow, NumberInput } from '@canvix-react/ui-inspector';

import { PgPosition } from '../pg-position/index.js';
import { PgSize } from '../pg-size/index.js';
import type { UpdateField } from '../types.js';

interface PgBasePropsData {
  position: { axis: [number, number] };
  layout: { size: [number, number] };
  rotation: number;
  opacity: number;
}

interface PgBasePropsProps {
  data: PgBasePropsData;
  updateField: UpdateField;
}

function PgBaseProps({ data, updateField }: PgBasePropsProps) {
  return (
    <FieldGroup title="基础属性">
      <PgPosition
        x={data.position.axis[0]}
        y={data.position.axis[1]}
        updateField={updateField}
      />
      <PgSize
        width={data.layout.size[0]}
        height={data.layout.size[1]}
        updateField={updateField}
      />
      <FieldRow label="旋转">
        <NumberInput
          value={data.rotation}
          onChange={v => updateField(['rotation'], v)}
        />
      </FieldRow>
      <FieldRow label="透明度">
        <NumberInput
          value={data.opacity}
          onChange={v => updateField(['opacity'], v)}
          step={0.1}
          min={0}
          max={1}
        />
      </FieldRow>
    </FieldGroup>
  );
}

export { PgBaseProps };
export type { PgBasePropsData, PgBasePropsProps };
