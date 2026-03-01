# Gdańsk Sacred Landscape Timeline

An interactive 800-year timeline (1200–2005) of Gdańsk's 17 major churches and sacred sites. Built with vanilla JavaScript ES modules, no bundler required.

## Quick Start

You need a local HTTP server — ES modules do not work over `file://`.

```bash
# Python 3
python -m http.server 8080

# Node / npm
npx serve .

# Node / npm (alternative)
npx http-server . -p 8080
```

Then open `http://localhost:8080` in your browser.

---

## Project Structure

```
D:\Claude_Code_Gdansk_experiment\
│
├── index.html              # App shell — all DOM structure, no logic
│
└── src/
    ├── main.js             # Entry point: init, keyboard, zoom, scroll sync
    ├── state.js            # All mutable state + filters + sort + colour maps
    ├── render.js           # Timeline rendering (axis, context tracks, lanes)
    ├── tooltip.js          # Hover tooltip with pin/unpin
    ├── detail.js           # Bottom-sheet drawer (church / event / war / plague)
    ├── map.js              # Leaflet interactive map + district polygons
    ├── ui.js               # Controls, filter chips, minimap, mobile tabs
    ├── styles.css          # Full stylesheet — v6 parchment + ink aesthetic
    │
    └── data/
        ├── churches.js     # 17 church objects + heraldic shield SVGs
        ├── context.js      # Wars, political events, plagues, rulers, eras
        ├── economic.js     # Grain export series, population data, districts
        ├── clusters.js     # 5 cluster definitions + 17×17 distance matrix
        └── geodata.js      # Historic district polygon coordinates (Leaflet)
```

---

## Church Images (Automated)

All church images are managed through a centralized configuration file with zero manual copy/paste required.

### Current Setup

- **Image configuration**: `assets/images/churches/church_images.json` (references for all 16 churches)
- **Placeholder images**: `assets/images/churches/*-exterior.jpg`, `*-interior.jpg` (32 files)
- **Churches data**: `src/data/churches.js` (automatically synced with config)

### Updating Images

When real photos become available:

1. **Place images** in `assets/images/churches/` with naming pattern: `{churchId}-exterior.jpg`, `{churchId}-interior.jpg`

2. **Update config** (optional): Edit `assets/images/churches/church_images.json` if you need custom URLs

3. **Sync to churches.js**:
   ```bash
   node tools/update_churches_from_config.js
   ```
   This updates all 16 churches automatically — no manual editing needed.

### How It Works

- `tools/create_image_config.js` — generates the centralized config
- `tools/update_churches_from_config.js` — applies config to `churches.js`
- `tools/generate_placeholder_images.js` — creates valid JPEG files for development

Once images are in place, simply replace the placeholder JPEG files and re-run the sync script. The app picks up images automatically.

---

## How to Run Tests / Verify

There are no automated tests. To verify everything works:

1. Start the server and open the app.
   ```bash
   python -m http.server 8080
   # Then open http://localhost:8080
   ```

2. Check the browser console for import errors.

3. Scroll the timeline — axis and context rows should scroll in sync with the lanes.

4. Click any church event dot — the detail drawer should open from the bottom.

5. **Verify images**: Click on any church to see the detail drawer. Scroll to "Church Images" section — you should see placeholder images (or real photos if provided).

6. Click **Map** in the toolbar — the Leaflet map should appear with coloured markers.

7. Use the filter chips to narrow visible churches — lanes should update immediately.

---

## Data Files

### Adding or Editing a Church — `src/data/churches.js`

Each church is an object in the `churches` array. Order matters — array index is used internally as `ci` (church index).

```js
{
  id: 'st_mary',              // unique string id
  name: 'St Mary\'s Basilica',
  shortName: 'St Mary',
  height: 77,                 // tower/nave height in metres
  capacity: 25000,
  cornerstoneYear: 1343,
  lat: 54.3490, lon: 18.6535, // WGS84
  origin: 'parish',           // 'parish' | 'monastic' | 'hospital'
  status: 'basilica',         // 'basilica' | 'parish_church' | 'monastic_church' | 'hospital_church'
  order: null,                // null | 'dominican' | 'franciscan' | 'cistercian' | ...
  symbol: {
    emoji: '⚜️',
    desc: 'Fleur-de-lis on gules',
    colors: 'Or fleur-de-lis on Gules',
  },
  organ: { has: true, year: 1755, desc: 'Rebuilt after war damage.' },
  facts: ['Largest brick church in the world.', '...'],
  relics: 'Last Judgement triptych by Hans Memling.',
  parishioners1500: 'Wealthy merchant families of the Hanseatic quarter.',
  tax1500: '~12 marks annually to the Bishop of Włocławek.',
  events: [
    { year: 1343, type: 'cornerstone', label: 'Foundation stone laid', detail: 'Long description...' },
    { year: 1502, type: 'founded',     label: 'Consecrated',           detail: '...' },
    // types: 'founded' | 'cornerstone' | 'expansion' | 'denomination' | 'destroyed' | 'notable'
  ],
  denomBars: [
    { start: 1343, end: 1557, type: 'catholic'  },
    { start: 1557, end: 1945, type: 'lutheran'  },
    { start: 1945, end: 2005, type: 'catholic'  },
    // types: 'catholic' | 'lutheran' | 'calvinist' | 'armenian' | 'secular'
  ],
}
```

After editing, reload the page. No build step needed.

### Adding a Shield SVG — `src/data/churches.js`

At the bottom of `churches.js`, `shieldSVGs` is an object keyed by church `id`:

```js
export const shieldSVGs = {
  st_mary: `<svg viewBox="0 0 60 70">...</svg>`,
  // ...
};
```

Paste inline SVG markup as a string. The drawer renders it at `48px` wide via the `.drawer-shield` class.

### Adding a Historical Event — `src/data/context.js`

```js
// Political events
export const politicalEvents = [
  { year: 1308, label: 'Teutonic takeover', color: '#a03030', detail: '...' },
  // ...
];

// Wars / conflicts
export const wars = [
  { start: 1454, end: 1466, label: 'Thirteen Years War', detail: '...' },
  // ...
];

// Calamities / epidemics
export const calamities = [
  { year: 1348, label: 'Black Death', detail: '...' },
  // ...
];
```

### Adding Economic Data — `src/data/economic.js`

```js
export const grainExport = [
  { year: 1460, value: 10000 },  // lasts in shiplacds
  // ...
];

export const populationData = [
  { year: 1300, value: 5000 },
  // ...
];
```

Values are normalised to track height (0–36px) automatically. No manual scaling needed.

---

## How to Change the Visual Design

All design tokens are CSS custom properties at the top of `src/styles.css`:

```css
:root {
  --parchment:    #f5edd8;   /* main background */
  --parchment-dk: #e8d9bb;   /* slightly darker panels */
  --ink:          #2a1f0e;   /* header, drawer, dark panels */
  --ink-lt:       #5c4a2a;   /* secondary dark text */
  --amber:        #c8860a;   /* primary accent */
  --amber-lt:     #e8a020;   /* lighter amber */
  --gold:         #e0bc40;   /* active states */

  /* Denomination colours */
  --catholic:     #8b3a2a;
  --lutheran:     #2a5c6e;
  --calvinist:    #4a6a3a;
  --armenian:     #7a4a1a;
  --secular:      #8a8070;

  /* Event dot colours */
  --ev-founded:       #2a6a48;
  --ev-cornerstone:   #8a5020;
  --ev-expansion:     #1a6868;
  --ev-denomination:  #5a3a8a;
  --ev-destroyed:     #a03030;
  --ev-notable:       #c8860a;
}
```

**Fonts** are loaded from Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;400;600;1,8..60,400&display=swap" rel="stylesheet">
```

Change `family=Cinzel` and `family=Source+Serif+4` to swap typefaces.

---

## How to Add a New Context Track

Context tracks are the coloured rows above the church lanes (rulers, wars, political, plagues, population, grain, districts).

**1. Add data** to the appropriate file in `src/data/`.

**2. Add track visibility state** in `src/state.js`:

```js
export const trackVisibility = {
  // ... existing tracks ...
  myTrack: true,   // ← add here
};
```

**3. Add HTML row** in `index.html` inside `.tl-ctx-area`:

```html
<div class="tl-ctx-row" id="myTrackRow" style="display:none">
  <div class="tl-ctx-label">My Track</div>
  <div class="tl-ctx-scroll tl-ctx-scroll-c">
    <div class="tl-ctx-inner" id="myTrackInner"></div>
  </div>
</div>
```

**4. Add a render function** in `src/render.js`:

```js
function renderMyTrack() {
  const inner = document.getElementById('myTrackInner');
  if (!inner) return;
  inner.style.width = getTotalWidth() + 'px';
  inner.innerHTML = myData.map(d =>
    `<div class="my-marker" style="left:${yearToX(d.year)}px">${d.label}</div>`
  ).join('');
}
```

Then call it inside `renderContextTracks()`:

```js
if (trackVisibility.myTrack) {
  setCtxRowVisible('myTrackRow', true);
  renderMyTrack();
} else {
  setCtxRowVisible('myTrackRow', false);
}
```

**5. Add a toggle chip** — `buildTrackToggles()` in `src/ui.js` reads `trackVisibility` keys automatically, so the chip appears once you add the key to state.

**6. Add search support** in `src/main.js` `searchEvents()` if the track items have labels.

---

## How to Add a New Filter

**1. Add filter state** in `src/state.js`:

```js
export let myFilter = null;

export function setMyFilter(v) { myFilter = v; _resetOthers('myFilter'); applyFilters(); }
```

Update `_resetOthers()` and `applyFilters()` to include the new filter.

**2. Add a chip group** in `buildFilterChips()` in `src/ui.js`.

**3. Handle the chip click** in `_handleFilterChipClick()` in `src/ui.js`.

---

## Architecture Notes

- **No bundler.** All modules use native `<script type="module">` and `import`/`export`. A local HTTP server is required.
- **State as live bindings.** `state.js` exports mutable `let` variables. ES module exports are live — importers always see the current value. Never reassign `sortedIndices` from outside `state.js`; mutate it in place.
- **Scroll sync.** `#lanesScroll` is the single scroll master. Its `scroll` event propagates to `#axisScroll`, all `.tl-ctx-scroll` elements, and `#tlLabels` Y-scroll. Nothing else should set `scrollLeft` on those elements.
- **Render is not reactive.** Call `render()` explicitly after state changes. Filters call `applyFilters()` then `render()` must be called by the UI layer.
- **Tooltip vs Drawer.** Tooltips (hover) are in `tooltip.js`. The detail drawer (click) is in `detail.js`. They are independent — opening the drawer does not close a pinned tooltip.
- **Map initialises lazily.** Leaflet is loaded from CDN and the map is not initialised until the first `toggleMapPanel()` call. This avoids the Leaflet "map container already initialised" error on multiple opens.

---

## Feature Parity vs Original (v11)

| Feature | Original v11 | This Project |
|---|---|---|
| 17 churches with full data | ✅ | ✅ |
| Denomination bars per church | ✅ | ✅ |
| Event dots (6 types) | ✅ | ✅ |
| Rulers context track | ✅ | ✅ |
| Wars context track | ✅ | ✅ |
| Political events track | ✅ | ✅ |
| Plagues / calamities track | ✅ | ✅ |
| Population chart track | ✅ | ✅ |
| Grain export chart track | ✅ | ✅ |
| Historic districts track | ✅ | ✅ |
| Zoom in / out / fit | ✅ | ✅ |
| Era jump buttons | ✅ | ✅ |
| Sort (6 modes) | ✅ | ✅ |
| Origin / status filters | ✅ | ✅ |
| Organ filter | ✅ | ✅ |
| Monastic order filter | ✅ | ✅ |
| Cluster filter | ✅ | ✅ |
| Individual church toggles | ✅ | ✅ |
| Minimap scrubber | ✅ | ✅ |
| Hover tooltips | ✅ | ✅ |
| Pinnable tooltips | ✅ | ✅ |
| Search / highlight | ✅ | ✅ |
| Detail drawer — church | ✅ | ✅ |
| Detail drawer — political | ✅ | ✅ |
| Detail drawer — calamity | ✅ | ✅ |
| Detail drawer — war | ✅ | ✅ |
| Similarity scores | ✅ | ✅ |
| Cluster badges | ✅ | ✅ |
| Heraldic shields | ✅ | ✅ |
| Leaflet interactive map | ✅ | ✅ |
| Map by denomination year | ✅ | ✅ |
| Historic district polygons | ✅ | ✅ |
| Church list screen | ✅ | ✅ |
| Keyboard shortcuts | ✅ | ✅ |
| Mobile tab navigation | ✅ | ✅ |
| Collapsible chrome | ✅ | ✅ |
| v6 parchment/ink aesthetic | v11 style | ✅ |
| Cinzel + Source Serif fonts | v11 fonts | ✅ |

---

## Known Limitations

- **`file://` protocol does not work.** Use a local server.
- **No offline support.** Google Fonts, Leaflet, and CartoDB tiles require internet access.
- **Chrome height overlap.** The collapsible `.m-chrome` section sits in normal flow above the fixed `.screens` container. If the chrome is expanded and tall, it may overlap the top of the timeline. A future fix would update `--header-effective-h` via JS on chrome toggle.
- **No persistence.** Filter state, sort, and scroll position are not saved between sessions.
