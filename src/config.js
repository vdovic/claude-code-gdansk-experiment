// ═══════════ APP CONFIGURATION ═══════════
// Single source of truth for constants and defaults previously
// scattered across map.js, main.js, and index.html.
// Import from here instead of hard-coding magic numbers in module files.

// ── Historic map overlay ──────────────────────────────────────
// Geographic bounds for the Kubicki historic church map (street plan of
// medieval Gdańsk). The original 508×768 image was affine-warped using
// 10 church anchor points (least-squares) to remove ~2° rotation so
// L.imageOverlay can display it axis-aligned. Max residual ≈ 68 m.
export const HISTORIC_MAP_BOUNDS = [[54.34188, 18.64220], [54.36082, 18.66571]];

// Default year shown on the map year slider when the app first loads.
// 1655 sits in the Swedish Wars / Baroque peak — a visually rich period.
export const DEFAULT_MAP_YEAR = 1655;

// Default opacity of the historic map overlay (0–1 scale). 0.23 = 23%.
export const DEFAULT_HISTORIC_OPACITY = 0.23;

// ── Viewport / responsive breakpoints ────────────────────────
// Screens at or below this width use the mobile layout unconditionally.
export const MOBILE_BREAKPOINT = 900;

// Touch-capable devices (navigator.maxTouchPoints > 0) at or below this
// width are also treated as mobile. The upper bound prevents touchscreen
// laptops and desktops from incorrectly triggering mobile mode.
export const MOBILE_TOUCH_MAX_WIDTH = 1024;
