# Minimap V2 — Quick Test Guide

## Pre-Flight Checklist

Before user testing, verify:

- [ ] Browser console shows no errors
- [ ] Minimap starts collapsed (click "Overview" to expand)
- [ ] Minimap canvas shows colored period blocks
- [ ] Two pill-shaped handles visible at range edges
- [ ] Thin line connector visible between handles
- [ ] All handles have « and » labels

---

## Test Scenarios

### 1️⃣ Expand Minimap
**Steps**:
1. Load app
2. Click "Overview" button
3. Minimap expands showing periods

**Expected**:
- Minimap height transitions from 0 to 34px
- Canvas renders with period colors
- Handles position correctly at viewStart/viewEnd
- Toggle button text changes to collapse state

---

### 2️⃣ Drag Left Handle

**Setup**: Minimap expanded, current range 1200–2005

**Steps**:
1. Click left pill handle (« symbol)
2. Drag right slowly
3. Watch timeline update live
4. Release

**Expected**:
- Handle follows mouse during drag
- Timeline zooms/shifts as you drag
- Year under cursor matches viewStart
- On release: smooth final render

**Visual**:
- Handle changes from normal to "dragging" state
- Handle glows (brightness increased)
- Cursor shows ew-resize during drag

---

### 3️⃣ Drag Right Handle

**Setup**: Minimap expanded

**Steps**:
1. Click right pill handle (» symbol)
2. Drag left slowly
3. Watch timeline update live
4. Release

**Expected**:
- Identical behavior to Test 2, but affects viewEnd
- Left handle stays fixed
- Right handle follows mouse

---

### 4️⃣ Try to Invert Handles (Crossing Test)

**Setup**: Minimap expanded, range 1300–1600

**Steps**:
1. Drag left handle far to the right, past the right handle
2. Try to "cross" the handles
3. Release

**Expected**:
- Left handle stops moving when it reaches ~1550 (right - 50 years)
- Handles maintain minimum 50-year separation
- Handles DO NOT cross or invert

---

### 5️⃣ Drag Connector (Pan Window)

**Setup**: Minimap expanded, range 1400–1500

**Steps**:
1. Click the thin line between handles
2. Drag right
3. Watch range move as a unit
4. Release

**Expected**:
- Both handles move together smoothly
- Range width (100 years) stays constant
- Timeline pans along with handles
- Entire view window slides across history

**Visual**:
- Connector glows (opacity increases)
- Cursor changes to "grab" → "grabbing"

---

### 6️⃣ Click Period Block

**Setup**: Minimap expanded, main timeline visible

**Steps**:
1. Scroll timeline to see "Economic Eras" (colored period blocks)
2. Click on a period block (e.g., "Medieval")
3. Watch minimap handles jump

**Expected**:
- Timeline zooms to that period (±15 years padding)
- Both handles repositioned to match new viewStart/viewEnd
- Timeline automatically scrolls to show period
- Smooth transition

---

### 7️⃣ Apply Filters (Should NOT affect Minimap)

**Setup**: Minimap expanded, viewing full range

**Steps**:
1. In Filters section, toggle status/origin/denomination filters
2. Select/deselect individual churches
3. Watch minimap

**Expected**:
- Main timeline churches appear/disappear (expected)
- **Minimap visuals do NOT change** ✓
- Period blocks still visible
- Handles stay in same position
- Connector line unchanged

**This is the critical test** — minimap ignores filters completely

---

### 8️⃣ Full Reset Button

**Setup**: Minimap expanded, custom range selected

**Steps**:
1. Adjust range to something narrow (e.g., 1500–1600)
2. Click "Full" button (or reset button)
3. Watch handles return to edges

**Expected**:
- viewStart jumps to 1200 (START_YEAR)
- viewEnd jumps to 2005 (END_YEAR)
- Both handles move to bar edges
- Timeline resets to full history view

---

### 9️⃣ Minimap During Zoom

**Setup**: Desktop, app fully rendered

**Steps**:
1. Use +/- zoom buttons or Period clicks
2. Watch minimap during zoom changes
3. Collapse/expand minimap
4. Verify consistency

**Expected**:
- Handles always match current zoom range
- Minimap stays synchronized with timeline
- No visual lag or misalignment
- Works on mobile and desktop

---

### 🔟 Responsive Behavior

**Mobile**:
1. Load on phone/tablet
2. Note: Minimap likely hidden on mobile (CSS display: none)
3. Controls work via +/- buttons instead

**Desktop Widths**:
1. 1920px wide: Minimap very wide, precise handle dragging
2. 1024px wide: Minimap narrower, still draggable
3. 768px: Minimap may start hiding (check CSS)

**Expected**: Handles always draggable regardless of minimap bar width

---

## Visual Inspection Checklist

- [ ] Pill handles are rounded (not rectangular)
- [ ] Handles have subtle white border
- [ ] Handles have shadow (3D appearance)
- [ ] Handles grow slightly on hover
- [ ] Connector line appears between handles
- [ ] Period blocks visible behind handles
- [ ] Siege bands subtle (not intrusive)
- [ ] Century grid lines very faint
- [ ] « » labels clearly readable
- [ ] Colors match app theme (dark/light)

---

## Performance Checks

**Drag smoothness**:
- Handles move smoothly at ~60 FPS
- No stuttering or jank during drag
- Timeline updates don't block handle movement

**Memory**:
- Open DevTools → Memory tab
- Take snapshot before/after dragging
- No significant heap growth

**Console**:
- No JavaScript errors logged
- No warnings about memory leaks

---

## Troubleshooting

**Problem**: Handles don't move when dragged
- Check: Is minimap expanded? (Click "Overview")
- Check: Are you clicking directly on the pill?
- Check: Console for errors?

**Problem**: Minimap is empty (no periods visible)
- Check: eras array in src/data/context.js is populated
- Check: renderMinimap() is being called
- Check: Canvas width is > 0

**Problem**: Handles stuck at edges
- Check: viewStart is exactly 1200 or viewEnd exactly 2005
- Expected behavior — handles stop at global boundaries
- Try dragging the OTHER handle or connector

**Problem**: Only right handle works
- This was the original bug
- Check: initMinimapHandles() is imported and called
- Check: leftHandle element has correct ID
- Check: onLeftHandleDown is being attached

---

## Success Criteria

✅ **All 6 acceptance tests pass**:
1. Left handle drag changes viewStart
2. Right handle drag changes viewEnd
3. Handles cannot cross
4. Filters don't affect minimap visuals
5. Period click updates both handles
6. Minimap shows periods (not empty)

✅ **No console errors**

✅ **Smooth, responsive interaction**

✅ **Visual polish** (shadows, hover effects, colors match theme)

---

## Demo Script (5 minutes)

1. **"Let me expand the Overview minimap"**
   → Click "Overview" button

2. **"Notice the period blocks — this is our stable historical context"**
   → Point to colored blocks in minimap

3. **"Now let me zoom to just the Medieval period by dragging the left handle"**
   → Drag left handle to ~1200–1400

4. **"See how the timeline followed? Both handles work independently"**
   → Drag right handle to narrow/expand

5. **"Here's the cool part — I can pan the entire range by dragging this line"**
   → Drag connector line to move range smoothly

6. **"Notice the minimap doesn't change when I select/deselect churches"**
   → Toggle filter, point out minimap unchanged

7. **"Let me click this period block to focus on it"**
   → Click period in timeline, show handles jump

**Total time**: ~2 minutes of interaction, very smooth

---

## Browser Compatibility

- ✅ Chrome/Chromium (pointer events native)
- ✅ Firefox (pointer events native)
- ✅ Safari (pointer events iOS 13+)
- ✅ Edge (pointer events native)

If users report issues on older browsers, pointer events may not be supported. Would need fallback to mouse/touch events.

---

## Next Steps if Issues Found

1. **Handles don't move**: Verify initMinimapHandles() is in DOMContentLoaded
2. **Minimap empty**: Check renderMinimap() canvas drawing logic
3. **Slow/janky**: Profile with DevTools, check debounce timing
4. **Visual misalignment**: Verify updateMinimapRangeHandles() calculations
5. **Mobile issues**: Check responsive CSS for minimap-bar on small screens

---

**Ready for testing!** 🚀
