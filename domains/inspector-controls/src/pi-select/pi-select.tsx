import { FieldRow, SelectInput } from '@canvix-react/ui-inspector';

type SelectOption = string | { label: string; value: string };

interface PiSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: SelectOption[];
}

function PiSelect({ label, value, onChange, items }: PiSelectProps) {
  return (
    <FieldRow label={label}>
      <SelectInput value={value} onChange={onChange} items={items} />
    </FieldRow>
  );
}

export { PiSelect };
export type { PiSelectProps };
