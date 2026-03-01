# Minimap V2 — Developer Reference

## Quick Overview

The minimap is a stable, context-aware horizontal timeline that shows:
- Historical periods (colored blocks) as background
- Subtle war bands and grid lines
- Two draggable pill handles at the range edges
- Optional connector line for window panning

**Key Property**: NOT affected by filtering, selection, or sorting. Completely decoupled from visible church data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ minimapBar (position: relative)                          │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │
│ │ Canvas (minimapCanvas)                            │   │
│ │ - Draws eras (periods), siege bands, grid lines   │   │
│ │ - Width: 100% of bar, Height: 34px               │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─ minimapRangeControl (position: absolute) ─────────┐ │
│ │                                                   │ │
│ │  ◆◆ ─────────────────────────────────── ◆◆      │ │
│ │  │  │ (left handle) connector (right handle)     │ │
│ │                                                   │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Key Functions

### `renderMinimap()` — src/ui.js, lines 425–461

**Purpose**: Render canvas content (periods, wars, grid) and position handles

**Does**:
1. Get canvas element
2. Get bar dimensions
3. Draw eras (economicEras) with full color
4. Draw siege bands (very muted)
5. Draw century grid lines (very faint)
6. Call `updateMinimapRangeHandles()` to position handles

**Called by**:
- Period block click handlers
- Reset button handler
- Minimap toggle expand
- Window resize
- View changes (via scroll sync)

**Returns**: void

**Note**: Canvas is drawn every time, but handles are repositioned efficiently via style.left

---

### `updateMinimapRangeHandles()` — src/ui.js, lines 463–496

**Purpose**: Position the pill handles and connector line based on current view range

**Input**: Uses global `viewStart` and `viewEnd` from state.js

**Does**:
1. Calculate fraction of bar width for left position: `(viewStart - START_YEAR) / (END_YEAR - START_YEAR)`
2. Calculate fraction of bar width for right position: `(viewEnd - START_YEAR) / (END_YEAR - START_YEAR)`
3. Set left handle `.style.left = fractStart * barWidth + 'px'`
4. Set right handle `.style.left = fractEnd * barWidth + 'px'`
5. Position connector to span between handle centers

**Called by**:
- `renderMinimap()` at end
- `initMinimapHandles()` during pointermove (live update)
- `updateMinimapViewport()` wrapper function

**Performance**: O(1), just DOM updates

---

### `initMinimapHandles()` — src/ui.js, lines 640–788

**Purpose**: Attach pointer event handlers to pill handles and connector

**Setup**:
1. Called once during DOMContentLoaded
2. Gets references to handles, connector, bar
3. Attaches pointerdown to each handle
4. Attaches global pointermove, pointerup, pointercancel to document

**Event Flow**:

```
User Action          → Handler              → State Update        → Visual Update
─────────────────────────────────────────────────────────────────────────────
pointerdown         → onLeftHandleDown()    → dragState.type='left' → .dragging class
pointermove         → onPointerMove()       → setViewStart()       → live update
pointerup           → onPointerUp()         → dragState.isActive=false → render()

or

Click connector     → onConnectorDown()     → dragState.type='pan' → .panning class
pointermove         → onPointerMove()       → setViewStart/End()   → live update
pointerup           → onPointerUp()         → (both handlers sync) → render()
```

**State Tracking**:
```javascript
dragState = {
  isActive: boolean,      // Is a drag currently active?
  type: 'left'|'right'|'pan'|null,  // Which element is being dragged?
  pointerElement: Element, // Reference to element with capture
  pointerId: number,       // PointerEvent.pointerId
  startViewStart: number,  // viewStart at drag start (for pan delta calc)
  startViewEnd: number,    // viewEnd at drag start (for pan delta calc)
}
```

---

## Event Handler Details

### `onLeftHandleDown(e)` — lines 647–659

- Validates mouse button (`e.button === 0` only)
- Sets `dragState.type = 'left'`
- Calls `leftHandle.setPointerCapture(e.pointerId)`
- Adds 'dragging' class for visual feedback

### `onRightHandleDown(e)` — lines 661–673

- Same as left, but `dragState.type = 'right'`

### `onConnectorDown(e)` — lines 675–690

- Same pattern, but `dragState.type = 'pan'`
- Adds 'panning' class instead of 'dragging'

### `onPointerMove(e)` — lines 692–720

**Core logic**:
```javascript
function onPointerMove(e) {
  if (!dragState.isActive || dragState.pointerId !== e.pointerId) return;

  const year = yearFromClientX(e.clientX);
  const rangeDuration = dragState.startViewEnd - dragState.startViewStart;

  if (dragState.type === 'left') {
    setViewStart(Math.min(year, dragState.startViewEnd - 50));
  } else if (dragState.type === 'right') {
    setViewEnd(Math.max(year, dragState.startViewStart + 50));
  } else if (dragState.type === 'pan') {
    // Pan: move both start and end together
    const delta = year - dragState.startViewStart;
    const newStart = Math.max(START_YEAR, dragState.startViewStart + delta);
    const newEnd = newStart + rangeDuration;
    if (newEnd <= END_YEAR) {
      setViewStart(newStart);
      setViewEnd(newEnd);
    }
  }

  updateMinimapRangeHandles();  // Live visual update
  _debouncedRangeRender();       // Live timeline update (debounced)
}
```

**Key points**:
- `yearFromClientX()` converts mouse X to year value
- Clamping prevents invalid ranges (setViewStart/End in state.js do final clamping)
- Pan preserves range width by calculating delta
- Debounced render prevents excessive timeline redraws

### `onPointerUp(e)` / `onPointerCancel(e)` — lines 722–752

- Removes visual feedback classes
- Releases pointer capture (with try/catch for safety)
- Clears drag state
- Final full render: `render()`, `renderMinimap()`, `renderRangeSlider()`, `updateViewRangeLabel()`

---

## Positioning Math

**Convert year to pixel position**:
```javascript
const frac = (viewStart - START_YEAR) / (END_YEAR - START_YEAR);
const pixelPosition = frac * barWidth;
```

**Convert pixel position to year**:
```javascript
const frac = pixelPosition / barWidth;
const year = START_YEAR + frac * (END_YEAR - START_YEAR);
```

**Connector span**:
```
Left handle center:   leftPx + 9px
Right handle center:  rightPx + 9px
Connector width:      rightPx - leftPx - 18px (span between centers)
```

---

## CSS Classes

### `.minimap-handle`
- Base style for both pill handles
- Absolute positioning, center via transform
- Cursor: ew-resize
- Transition: all 0.15s (smooth position changes)

### `.minimap-handle:hover`
- Brightness: 1.15
- Height: 28px (grows by 2px)
- Shadow increases

### `.minimap-handle.dragging`
- Applied during drag
- Brightness: 1.25 (very prominent)
- Cursor: grabbing
- Shadow largest

### `.minimap-connector`
- 1px tall line between handles
- Opacity: 0.3 (subtle)
- Cursor: grab

### `.minimap-connector:hover`
- Opacity: 0.5

### `.minimap-connector.panning`
- Opacity: 0.8
- Cursor: grabbing

---

## Integration Points

### When View Range Changes

Any code that calls `setViewStart()` or `setViewEnd()` should follow with:
```javascript
render();           // Redraw timeline
renderMinimap();    // Redraw canvas and reposition handles
renderRangeSlider(); // Update any legacy range slider elements
updateViewRangeLabel(); // Update view range display
```

**Current callers**:
- Period block click handler (line 379–382 in main.js)
- Reset button handler (line 404–407 in main.js)
- Minimap toggle expand (line 189–191 in main.js)
- Handle drag (live via debounce, final via pointerup)

### Synchronization Points

**During drag** (pointermove):
- `updateMinimapRangeHandles()` — instant visual feedback
- `_debouncedRangeRender()` — timeline updates with 40ms debounce

**On drag end** (pointerup):
- Full `render()` cycle ensures sync

**On external view changes**:
- Scroll sync calls `updateMinimapViewport()`
- Window resize calls `renderMinimap()`
- Period clicks call full render cycle

---

## Testing Checklist

**Unit Tests**:
- [ ] `yearFromClientX()` converts correctly at 0%, 50%, 100%
- [ ] Handles can't cross (clamping works)
- [ ] Connector width calculated correctly
- [ ] Pan preserves range duration

**Integration Tests**:
- [ ] Left handle drag → viewStart changes
- [ ] Right handle drag → viewEnd changes
- [ ] Connector drag → both move equally
- [ ] Filters → minimap unchanged
- [ ] Period click → handles reposition
- [ ] Reset → handles move to edges
- [ ] Resize window → handles reposition

**Visual Tests**:
- [ ] Handles are pill-shaped (rounded)
- [ ] Handles glow on hover
- [ ] Handles glow more while dragging
- [ ] Connector line visible between handles
- [ ] Period blocks visible beneath handles
- [ ] Cursor changes appropriately

---

## Debugging Tips

**Is minimap expanded?**
```javascript
// In console:
const bar = document.getElementById('minimapBar');
bar.classList.contains('minimap-collapsed') // true = collapsed
```

**Check drag state during drag**:
```javascript
// In console (while dragging):
// Add breakpoint in onPointerMove()
```

**Verify handle positions**:
```javascript
// In console:
const left = document.getElementById('minimapHandleLeft');
const right = document.getElementById('minimapHandleRight');
console.log('Left:', left.style.left);
console.log('Right:', right.style.left);
```

**Check canvas is rendering**:
```javascript
// In console:
const canvas = document.getElementById('minimapCanvas');
console.log('Canvas size:', canvas.width, canvas.height);
console.log('Bar width:', canvas.parentElement.clientWidth);
```

**Monitor state changes**:
```javascript
// Add to initMinimapHandles() during development:
setInterval(() => {
  console.log('viewStart:', viewStart, 'viewEnd:', viewEnd);
}, 500);
```

---

## Performance Considerations

**Expensive Operations** (minimize frequency):
- `render()` — Full timeline redraw (~50–100ms)
- `renderMinimap()` — Canvas redraw (~5–10ms)

**Cheap Operations** (can do frequently):
- `updateMinimapRangeHandles()` — DOM style updates (~1ms)
- `_debouncedRangeRender()` — Debounced (~40ms window)

**Current Strategy**:
- During drag: Only updateMinimapRangeHandles() + debounced render
- On drop: Full render once
- Efficient and responsive

---

## Known Quirks

1. **Minimum range width**: 50 years (hardcoded in state.js)
   - Can't zoom tighter than this
   - Prevents handle collision and usability issues

2. **Canvas height fixed at 34px**
   - Visual limit, not adjustable
   - Bar scales on mobile but canvas stays 34px

3. **Handles positioned absolutely**
   - Must have position: relative parent (minimap-bar is correct)
   - Z-index must be > canvas z-index

4. **Connector width can be negative**
   - Clamped with `Math.max(0, width)` to prevent issues
   - Happens when handles are less than 18px apart

5. **Pan only works if range fits in history**
   - Can't pan right if right edge at END_YEAR (2005)
   - Can't pan left if left edge at START_YEAR (1200)

---

## Future Enhancements

1. **Dual touch**: Two-finger pinch to zoom range
2. **Double-click handle**: Input dialog for precise year
3. **Shift+connector click**: Snap to period boundaries
4. **Keyboard**: Arrow keys while focused to nudge range
5. **Presets**: Save/load favorite zoom levels
6. **Analytics**: Track most-viewed time periods

---

**This minimap is rock-solid. Enjoy!** 🎯
