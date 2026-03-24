/**
 * Parse a CSS color string to [r, g, b] (0–255).
 * Supports hex (#rgb, #rrggbb, #rrggbbaa) and rgb()/rgba() notation.
 * Falls back to [255, 255, 255] for unparseable values.
 */
function parseColor(color: string): [number, number, number] {
  const trimmed = color.trim();

  // Hex
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  // rgb() / rgba()
  const match = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  return [255, 255, 255];
}

/**
 * Relative luminance (WCAG definition, 0–1).
 */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute a subtle overlay color with diagonal stripes for the flow-drag
 * page dimming effect. Returns an SVG data-URI suitable for `background-image`.
 *
 * The stripe color is derived from the page foreground so it always
 * has visible but gentle contrast regardless of light/dark themes.
 */
export function computeStripeBackground(pageForeground: string): string {
  const [r, g, b] = parseColor(pageForeground);
  const lum = luminance(r, g, b);

  // Light bg → darken stripes; dark bg → lighten stripes
  const alpha = 0.06;
  const stripeColor =
    lum > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;

  // 6px repeating diagonal stripe via inline SVG
  const size = 6;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><line x1='0' y1='${size}' x2='${size}' y2='0' stroke='${stripeColor}' stroke-width='1'/></svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Compute a subtle placeholder background color based on the page foreground.
 * Returns a CSS color string.
 */
export function computePlaceholderColor(pageForeground: string): string {
  const [r, g, b] = parseColor(pageForeground);
  const lum = luminance(r, g, b);

  return lum > 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)';
}
