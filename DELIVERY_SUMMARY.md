# UX Upgrade Sprint — Delivery Summary

## 1. Color System (Single Source of Truth)

**File:** `src/theme.js`

A new theme module centralizes all color and shape definitions in one place. CSS custom properties remain the visual layer (`:root` in `styles.css`); `theme.js` provides JS-accessible constants for rendering logic.

| Export | Purpose |
|---|---|
| `denominationColors` | Hex values for Catholic, Lutheran, Calvinist, Armenian, Secular |
| `eventColors` | CSS var references for each event type |
| `eventShapes` | Shape + label + description for each event type |
| `eventMarkerSVG()` | Generates inline SVG marker by type, color, and size |
| `legendShapeSVG()` | Smaller SVG swatch for legend display |
| `uiNeutrals` | CSS var references for background/text tokens |

**Palette philosophy:** Muted defaults; saturated colors appear only on hover, focus, or selection. Denomination colors are mid-saturation by design. Context track overlays use very low-alpha fills (`0.02`-`0.08`) to stay beneath church data.

---

## 2. Event Marker Shapes (Non-Color Encoding)

Each event type now renders a distinct SVG shape, making types distinguishable without relying solely on color (WCAG non-color encoding).

| Event Type | Shape | Color Var |
|---|---|---|
| Founded | Circle | `--ev-founded` |
| Cornerstone laid | Diamond (rotated square) | `--ev-cornerstone` |
| Expansion / addition | Rounded square | `--ev-expansion` |
| Denomination change | Hexagon | `--ev-denomination` |
| Destruction | X (cross) | `--ev-destroyed` |
| Notable event | Triangle | `--ev-notable` |

Markers are 13x13 SVG with white stroke outlines for contrast on the warm parchment timeline. All markers have `tabindex="0"`, `role="button"`, and `aria-label` for keyboard access.

---

## 3. Typography Scale and System Font

**System font stack** (no webfonts for UI text):
```
system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif
```

Google Fonts (Inter, Cinzel, Source Serif 4) remain loaded for header/decorative use but UI elements use the system stack via `--font-ui`.

**Font scale tokens:**

| Token | Size | Usage |
|---|---|---|
| `--fs-base` | 14px | Default body text |
| `--fs-secondary` | 12px | Secondary labels, metadata |
| `--fs-sm` | 11px | Small annotations |
| `--fs-micro` | 9px | Sort values, fine metadata |

**Tabular numbers:** Year labels and sort values use `font-variant-numeric: tabular-nums` for columnar alignment.

---

## 4. Spacing and Row Density

- **Lane height:** Increased from 46px to 54px (`--lane-h: 54px`), giving +8px vertical breathing room per church row.
- **Alternating rows:** Even-numbered lanes get `background: rgba(0,0,0,0.018)` for subtle zebra striping.
- **Church name:** Uses `font-weight: 500` (medium) with system font for prominence.
- **Metadata de-emphasized:** Sort values use `--fs-micro` (9px) at 70% opacity.

---

## 5. Mobile Bottom Sheet

**Files:** `index.html`, `src/styles.css`, `src/ui.js`

A slide-up bottom sheet replaces the sidebar controls on viewports at or below 768px.

- **Trigger:** Gear icon button, visible only on mobile.
- **Tabs:** Tracks | Churches | Sort | Search -- each tab dynamically builds its content.
- **Interactions:** Tap tab to switch, tap chip to toggle filter, swipe-down on handle to dismiss.
- **Overlay:** Semi-transparent backdrop closes sheet on tap.
- **Content builds dynamically** from current app state (track visibility, church list, sort options).

---

## 6. Focus on Churches Toggle

**Button:** "Focus Churches" in the desktop controls bar.

| Action | Result |
|---|---|
| Activate | Adds `body.focus-churches` class; collapses all context tracks (rulers, wars, plagues, political) via CSS `max-height: 0; opacity: 0` with transition |
| Deactivate | Removes class; restores tracks to their previous visibility |
| Mobile first load | Auto-activates on viewports at or below 768px to prioritize church data |

Context track overlays always have `pointer-events: none` on their container, so they never block interaction with church lane markers regardless of Focus mode.

---

## 7. Tooltip Pin and Auto-Dismiss

- **Hover** a marker: transient tooltip appears.
- **Click** a marker: tooltip pins in place (stays until dismissed).
- **Open detail drawer:** Any pinned tooltip is auto-dismissed via `unpinTT()` call at the start of `detail.js _open()`.
- **Click outside** pinned tooltip: dismisses it.

---

## 8. Interactive Row Feedback

- **Row hover:** Hovered church lane stays at full opacity; all other lanes dim to 72% opacity.
- **Transition:** 180ms ease-out opacity fade.
- **`prefers-reduced-motion`:** All transitions and animations are disabled when the user's OS requests reduced motion.

---

## 9. Keyboard Accessibility

- **Focus ring:** All interactive elements (buttons, legend items, event markers) show a visible `2px solid var(--accent)` outline on `:focus-visible`.
- **Legend items:** `tabindex="0"`, Enter/Space toggles description popover, Escape closes.
- **Event markers:** `tabindex="0"`, Enter/Space triggers tooltip, full `aria-label` with event type, year, and church name.
- **WCAG AA contrast:** Dark UI text (`--text-primary: #e8e4dc`) on dark backgrounds, dark text on parchment timeline -- both meet 4.5:1 minimum.

---

## 10. Confessional Overlay Cleanup

Confessional realignment overlays (1525 Reformation bands) are now visual-only:
- Tooltips removed (they overlapped with other tooltips and added no value).
- `pointer-events: none` set on overlay bands.
- Overlay still renders its colored bands for historical context but is non-interactive.

---

## Files Modified

| File | Changes |
|---|---|
| `src/theme.js` | **New** -- color/shape single source of truth |
| `src/styles.css` | Typography, spacing, lane height, alternating rows, focus states, reduced-motion, row hover, bottom sheet, legend, focus-churches |
| `src/render.js` | SVG marker shapes, keyboard access on markers, confessional tooltip removal |
| `src/ui.js` | Legend with shapes, legend keyboard, focus-churches toggle, bottom sheet |
| `src/detail.js` | Auto-dismiss pinned tooltip on drawer open |
| `src/main.js` | Import and init focus-churches + bottom sheet |
| `index.html` | Focus Churches button, bottom sheet HTML structure |
