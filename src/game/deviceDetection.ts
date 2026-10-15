/**
 * Detects touch screen devices (smartphones, tablets) vs fixed desktop devices.
 * Supports forced overrides from settings if the user wants to toggle on/off.
 */

export function isTouchDevice(forcedOverride?: boolean): boolean {
  if (typeof forcedOverride === 'boolean') {
    return forcedOverride;
  }
  if (typeof window === 'undefined') return false;

  const hasTouchPoints = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || ((navigator as unknown as { msMaxTouchPoints: number }).msMaxTouchPoints > 0));
  const hasTouchEvents = 'ontouchstart' in window;
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth <= 1024;

  return (hasTouchPoints || hasTouchEvents || isCoarsePointer) && isSmallScreen;
}
