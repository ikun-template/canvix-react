import type { ComponentType } from 'react';

import { PiColor } from './pi-color/index.js';
import { PiNumber } from './pi-number/index.js';
import { PiPosition } from './pi-position/index.js';
import { PiSelect } from './pi-select/index.js';
import { PiSize } from './pi-size/index.js';
import { PiText } from './pi-text/index.js';

interface PiComponentProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  items?: string[];
  step?: number;
  min?: number;
  max?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rendererMap: Record<string, ComponentType<any>> = {
  number: PiNumber,
  text: PiText,
  color: PiColor,
  select: PiSelect,
  position: PiPosition,
  size: PiSize,
};

export { rendererMap };
export type { PiComponentProps };
