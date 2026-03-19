import { FieldRow, NumberInput } from '@canvix-react/ui-inspector';

interface PiNumberProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

function PiNumber({ label, value, onChange, step, min, max }: PiNumberProps) {
  return (
    <FieldRow label={label}>
      <NumberInput
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        max={max}
      />
    </FieldRow>
  );
}

export { PiNumber };
export type { PiNumberProps };
