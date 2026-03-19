import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@canvix-react/ui';

import { cn } from './utils.js';

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  items: string[];
  placeholder?: string;
  className?: string;
}

function SelectInput({
  value,
  onChange,
  items,
  placeholder,
  className,
}: SelectInputProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('h-7 px-2 text-xs', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map(item => (
          <SelectItem key={item} value={item} className="text-xs">
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SelectInput };
export type { SelectInputProps };
