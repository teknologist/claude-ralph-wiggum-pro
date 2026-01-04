/**
 * Responsive breakpoint constants
 * Uses standard Tailwind CSS breakpoints:
 * - md: 768px
 * - Mobile: < 768px (max-width: 767px)
 * - Desktop: >= 768px (min-width: 768px)
 */

export const BREAKPOINTS = {
  /** Mobile devices (< 768px) */
  MOBILE: '(max-width: 767px)' as const,
  /** Desktop/tablet (>= 768px) */
  DESKTOP: '(min-width: 768px)' as const,
} as const;

/** Swipe gesture configuration */
export const SWIPE_CONFIG = {
  /** Width of swipe action button in pixels */
  BUTTON_WIDTH: 80,
  /** Minimum swipe distance to trigger action (50% of button width) */
  THRESHOLD: 40,
  /** Transition duration in milliseconds */
  ANIMATION_DURATION: 200,
} as const;
