// ═══════════ VIEWPORT UTILITY ═══════════
// Single source of truth for raw mobile-screen detection.
// Import isMobileScreen() instead of inlining window.innerWidth checks.
//
// NOTE: does NOT check for user-forced viewport overrides
// (document.body.dataset.viewport). That logic stays in main.js
// _isMobileViewport() so it can stay aware of the manual toggle.

import { MOBILE_BREAKPOINT, MOBILE_TOUCH_MAX_WIDTH } from '../config.js';

// Returns true when the screen dimensions or touch capabilities indicate
// a mobile/small-screen device.
//   • Unconditionally mobile if viewport width ≤ MOBILE_BREAKPOINT (900px)
//   • Also mobile if the device reports touch support AND width ≤ MOBILE_TOUCH_MAX_WIDTH (1024px)
//     — the upper bound prevents touchscreen laptops from triggering mobile mode.
export function isMobileScreen() {
  return window.innerWidth <= MOBILE_BREAKPOINT
      || (navigator.maxTouchPoints > 0 && window.innerWidth <= MOBILE_TOUCH_MAX_WIDTH);
}
