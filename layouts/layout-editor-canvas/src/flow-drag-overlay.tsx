/*
 * Description: Diagonal stripe overlay shown during flow drag operations.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

export function FlowDragOverlay({
  stripeBackground,
  visible,
}: {
  stripeBackground: string;
  visible: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: stripeBackground,
        backgroundRepeat: 'repeat',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    />
  );
}
