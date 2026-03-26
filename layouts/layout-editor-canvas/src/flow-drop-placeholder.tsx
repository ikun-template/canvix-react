/*
 * Description: Visual placeholder shown during flow drag reordering.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export function FlowDropPlaceholder({
  size,
  color,
}: {
  size: [number, number] | null;
  color: string;
}) {
  return (
    <div
      data-flow-placeholder=""
      style={{
        width: size?.[0] ?? 100,
        height: size?.[1] ?? 40,
        background: color,
        borderRadius: 8,
        transition: 'all 200ms ease',
      }}
    />
  );
}
