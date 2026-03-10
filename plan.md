# Plan: Merge Range Handles into Main Timeline Axis

## Problem Analysis

### Root Causes of Current Issues

**1. Coordinate system mismatch:**
- Range strip: maps full 1200-2005 linearly to track width as percentages: `(year - 1200) / 805 * 100%`
- Axis: maps only viewStart-viewEnd at zoom level: `labelOffset + (year - viewStart) * pixelsPerYear`
- These are completely independent systems — the strip compresses 805 years into one bar while the axis shows only the selected range at the current zoom

**2. Left handle instability:**
- Dragging the left handle calls `setViewStart()` → `render()` → re-renders the axis and all lanes with new `viewStart` → changes content widths and scroll positions
- Since the range strip's `_clientToYear()` uses `getBoundingClientRect()` on the track, layout reflows during drag can shift the track position
- Near `START_YEAR` (1200), the handle oscillates between clamped values as reflows occur
- Inconsistent minimum gap: drag uses `viewEnd - 100` but `setViewStart()` uses `viewEnd - 50`

**3. Visual duplication:**
- Two horizontal lines occupy vertical space showing the same concept (time range)
- The strip shows the full range with handles; the axis shows the visible range with ticks — confusing

## Solution: Static Overview Axis with Integrated Handles

Transform the axis row from a scrolling view-range display into a static full-range overview with embedded drag handles. One coordinate system, one visual element.

### Key Design Decisions

1. The axis shows the FULL timeline (1200-2005) at all times — it does NOT scroll horizontally
2. Both tick marks and drag handles use the same percentage math: `(year - 1200) / 805 * 100%`
3. The selected range (viewStart-viewEnd) is highlighted; unselected areas are dimmed
4. The axis row gets slightly taller (44px vs 34px) to accommodate handles above the tick line
5. During drag, only the handle/fill positions update — no axis re-render, eliminating jitter
6. Drag feedback: small floating year labels appear above each handle while dragging

## Files Changed

### 1. `index.html`
- Remove the `#rsBar` div (the entire range strip)
- Rewrite the `.tl-axis-row` to include: stub with range label + reset, axis area with ticks + handles + fill + mute overlays

### 2. `src/styles.css`
- Remove the entire "RANGE NAVIGATOR STRIP" CSS block (~90 lines)
- Rewrite the "FROZEN AXIS ROW" CSS block with new unified styles for axis + handles + fill + mute overlays

### 3. `src/render.js` — `renderAxis()`
- Render ticks for the FULL range (START_YEAR to END_YEAR) using percentage positioning
- Era bands and siege bands use the same percentage math
- Adaptive tick density suited for 805-year overview

### 4. `src/main.js`
- `initRangeStrip()` → `initRangeHandles()`: new references, unified coordinate system, stable drag
- During drag: only handle/fill CSS updates (no `render()` call) — eliminates jitter
- `render()` called at drag END only
- Consistent 50-year minimum gap
- Remove `axisScroll` from scroll sync (axis no longer scrolls)
- Rename `_updateRangeStrip` → `_updateRangeHandles`

## What This Fixes

1. **Coordinate mismatch**: One system — percentage of full range — for both ticks and handles
2. **Left handle instability**: No layout reflow during drag (axis is static)
3. **Visual duplication**: One elegant axis with integrated range selection
4. **Smooth dragging**: No render() during drag, only CSS position updates
5. **Clean left boundary**: Simple percentage clamp, no jitter

## What Stays the Same

- viewStart / viewEnd state management
- yearToX() for lane/track content
- render() pipeline
- Default range 1200-1750
- All context track and church lane rendering
- Zoom / view mode / keyboard shortcuts
