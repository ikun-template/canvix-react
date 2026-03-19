import { PgSize } from '../pg-size/index.js';
import type { UpdateField } from '../types.js';

interface PiSizeProps {
  value: { size: [number, number] };
  updateField: UpdateField;
}

function PiSize({ value, updateField }: PiSizeProps) {
  return (
    <PgSize
      width={value.size[0]}
      height={value.size[1]}
      updateField={updateField}
    />
  );
}

export { PiSize };
