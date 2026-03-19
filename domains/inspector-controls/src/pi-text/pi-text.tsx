import { FieldRow, TextInput } from '@canvix-react/ui-inspector';

interface PiTextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function PiText({ label, value, onChange }: PiTextProps) {
  return (
    <FieldRow label={label}>
      <TextInput value={value} onChange={onChange} />
    </FieldRow>
  );
}

export { PiText };
export type { PiTextProps };
