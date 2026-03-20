import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@canvix-react/ui';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface Measurable {
  getBoundingClientRect: () => DOMRect;
}

interface PickerTarget {
  value: string;
  onChange: (hex: string) => void;
}

interface ColorPickerService {
  open: (anchor: HTMLElement, target: PickerTarget) => void;
  close: () => void;
}

const ColorPickerServiceContext = createContext<ColorPickerService | null>(
  null,
);

export function useColorPickerService(): ColorPickerService {
  const ctx = useContext(ColorPickerServiceContext);
  if (!ctx)
    throw new Error(
      'useColorPickerService must be used within InspectorColorPickerProvider',
    );
  return ctx;
}

function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function InspectorColorPickerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<PickerTarget | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const anchorRef = useRef<Measurable>(null);

  const open = useCallback((anchor: HTMLElement, t: PickerTarget) => {
    anchorRef.current = anchor;
    setTarget(t);
    setPickerKey(k => k + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTarget(null);
  }, []);

  const handleChange = useCallback(
    (rgba: [number, number, number, number]) => {
      target?.onChange(rgbaToHex(rgba[0], rgba[1], rgba[2]));
    },
    [target],
  );

  return (
    <ColorPickerServiceContext.Provider value={{ open, close }}>
      {children}
      <Popover open={isOpen} onOpenChange={o => !o && close()}>
        <PopoverAnchor virtualRef={anchorRef} />
        <PopoverContent
          className="w-64 p-3"
          align="start"
          side="left"
          sideOffset={8}
        >
          {target && (
            <ColorPicker
              key={pickerKey}
              defaultValue={target.value}
              onChange={handleChange}
              className="gap-3"
            >
              <ColorPickerSelection className="h-32 rounded-md" />
              <div className="flex gap-2">
                <div className="flex shrink-0 items-center">
                  <ColorPickerEyeDropper className="size-8" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <ColorPickerHue />
                  <ColorPickerAlpha />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerOutput className="h-7 w-16 text-xs" />
                <ColorPickerFormat className="flex-1" />
              </div>
            </ColorPicker>
          )}
        </PopoverContent>
      </Popover>
    </ColorPickerServiceContext.Provider>
  );
}
