# Wave 4 — Patronage Mode Implementation Plan

## Files to Create
1. **`src/data/patronage.js`** — Guild data + church patron lookup maps

## Files to Modify
2. **`src/state.js`** — Add patronageMode, selectedGuild state
3. **`src/ui.js`** — Add Patronage toggle button, guild panel builder, founders tab
4. **`src/render.js`** — Highlight/dim churches when guild selected
5. **`src/tooltip.js`** — Extend showChurchTT with patron/guild info
6. **`src/detail.js`** — Add patronage section to church detail drawer
7. **`src/styles.css`** — Patronage panel + dim/highlight styles
8. **`index.html`** — Add patronage toggle button + panel container
9. **`src/main.js`** — Wire patronage init

## Implementation Order

### Step 1: Data (patronage.js)
- Export `patronageGuilds` array (~8 confirmed guilds with schema)
- Export `churchPatrons` lookup map: `{ stmary: { founder, order, guildsConfirmed, notes } }`
- Guild schema: `{ id, name, type, description, targetsConfirmed, targetsPossible?, insideConfirmed?, insidePossible? }`
- Use exact church IDs from churches.js

### Step 2: State (state.js)
- `export let patronageMode = false;`
- `export let selectedGuildId = null;`
- `export function setPatronageMode(v)`
- `export function setSelectedGuild(id)`
- `export function getHighlightedChurchIds()` — returns Set of churchIds for selected guild's targetsConfirmed

### Step 3: HTML (index.html)
- Add Patronage toggle button in controls bar (after map button)
- Add patronage panel div (after sortBar, inside .m-chrome): `<div class="filter-bar patronage-bar" id="patronageBar" style="display:none">`

### Step 4: CSS (styles.css)
- `.patronage-bar` — panel with tabs
- `.patron-guild-item` — selectable guild chip (single-select)
- `.patron-guild-item.selected` — active state
- `.patron-tab` — tab switching
- `.ch-lane.pat-dim` — opacity: 0.35 (dimmed churches)
- `.ch-label.pat-dim` — opacity: 0.4
- `.ch-lane.pat-hi` — full opacity + subtle border highlight
- `.ch-label.pat-hi` — full opacity + accent color

### Step 5: UI (ui.js)
- `buildPatronageBar()` — builds the patronage panel with two tabs
- Guilds tab: render patronageGuilds as clickable items, single-select
- Founders tab: render read-only list from churchPatrons
- Guild hover: showGenericTT with confirmed + possible links
- Guild click: setSelectedGuild(id), re-render
- Wire patronage toggle button

### Step 6: Render (render.js)
- In `renderLanes()`: when patronageMode && selectedGuildId:
  - Get highlighted church IDs from state
  - Add `pat-hi` class to matching .ch-lane and .ch-label
  - Add `pat-dim` class to non-matching visible churches
  - Keep existing visibility logic (don't override visibleChurches)

### Step 7: Tooltips (tooltip.js + detail.js)
- Extend `showChurchTT()`: add patron section (founder, order, confirmed guilds ≤2 + "+N more")
- Extend `openCD()`: add patronage section with founder, order, all confirmed guild links

## Highlight/Dim Approach
- CSS classes only (no inline opacity)
- `pat-dim` on lane + label = 0.35-0.4 opacity
- `pat-hi` on lane + label = full opacity + subtle left border accent
- Transitions smooth via existing `transition: opacity 0.2s`
- When no guild selected but mode ON: no dim/highlight (all normal)
- When mode OFF: remove all pat-* classes
