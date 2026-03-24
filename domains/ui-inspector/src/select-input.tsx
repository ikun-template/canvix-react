import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@canvix-react/ui';

import { cn } from './utils.js';

type SelectOption = string | { label: string; value: string };

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  items: SelectOption[];
  placeholder?: string;
  className?: string;
}

function normalizeOption(item: SelectOption) {
  return typeof item === 'string' ? { label: item, value: item } : item;
}

function SelectInput({
  value,
  onChange,
  items,
  placeholder,
  className,
}: SelectInputProps) {
  const options = items.map(normalizeOption);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          'h-8 w-full min-w-0 overflow-hidden px-2 text-sm',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SelectInput };
export type { SelectInputProps };
