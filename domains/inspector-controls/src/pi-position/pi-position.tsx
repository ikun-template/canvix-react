import { PgPosition } from '../pg-position/index.js';
import type { UpdateField } from '../types.js';

interface PiPositionProps {
  value: { axis: [number, number] };
  updateField: UpdateField;
}

function PiPosition({ value, updateField }: PiPositionProps) {
  return (
    <PgPosition x={value.axis[0]} y={value.axis[1]} updateField={updateField} />
  );
}

export { PiPosition };
