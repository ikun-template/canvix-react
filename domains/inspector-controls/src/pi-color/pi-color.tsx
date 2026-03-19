import { ColorInput, FieldRow } from '@canvix-react/ui-inspector';

interface PiColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function PiColor({ label, value, onChange }: PiColorProps) {
  return (
    <FieldRow label={label}>
      <ColorInput value={value} onChange={onChange} />
    </FieldRow>
  );
}

export { PiColor };
export type { PiColorProps };
