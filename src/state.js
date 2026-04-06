// ═══════════ STATE MODULE ═══════════
// All mutable app state lives here. Import and mutate these directly.
// Computed values (sorted indices, visible set) are re-derived by calling
// the exported functions after updating raw state.

import { churches } from './data/churches.js?v=5';
import { clusterDefs, distMatrix } from './data/clusters.js';
import { district1450ByChurchId } from './data/districts1450.js';

// ── Timeline layout constants ──
export const START_YEAR = 1150;
export const END_YEAR   = 2005;

// ── Default focused view (medieval / early-modern Gdańsk) ──
export const DEFAULT_VIEW_START = 1150;
export const DEFAULT_VIEW_END   = 1750;

// Visible range (controlled by the range navigator strip). Defaults to medieval focus.
export let viewStart = DEFAULT_VIEW_START;
export let viewEnd   = DEFAULT_VIEW_END;
export function setViewStart(v) { viewStart = Math.max(START_YEAR, Math.min(v, viewEnd - 50)); }
export function setViewEnd(v)   { viewEnd   = Math.min(END_YEAR,   Math.max(v, viewStart + 50)); }
export function resetViewRange() { viewStart = START_YEAR; viewEnd = END_YEAR; }

// Pixels per year (zoom level). Use setPixelsPerYear() to change.
export let pixelsPerYear = 8;
export function setPixelsPerYear(v) { pixelsPerYear = v; }

// Label column width (px). Updated on init and resize.
export let labelOffset = window.innerWidth <= 768 ? 110 : 180;
export function setLabelOffset(v) { labelOffset = v; }

// ── Mobile timeline viewport ──────────────────────────────────────────────────
// Defines a fixed-width "window" into the full timeline that will be used for
// mobile rendering. Desktop code uses viewStart/viewEnd/pixelsPerYear above and
// is completely unaffected by anything in this section.
//
// MOBILE_TIMELINE_WINDOW_YEARS is the single constant to tweak if the visible
// span needs to change — one place, one number, rest derives automatically.

export const MOBILE_TIMELINE_WINDOW_YEARS = 150;

// Default window start: 1250 puts early Teutonic-Rule church activity front
// and centre (window covers 1250–1400) without starting at the empty frontier.
const _MOBILE_DEFAULT_START = 1250;

export let mobileViewStart = _MOBILE_DEFAULT_START;
export let mobileViewEnd   = _MOBILE_DEFAULT_START + MOBILE_TIMELINE_WINDOW_YEARS;

// Move the mobile window to a new start year.
// Automatically derives mobileViewEnd and clamps so the window never
// goes outside START_YEAR..END_YEAR.
export function setMobileViewStart(year) {
  const clamped  = Math.max(START_YEAR, Math.min(year, END_YEAR - MOBILE_TIMELINE_WINDOW_YEARS));
  mobileViewStart = clamped;
  mobileViewEnd   = clamped + MOBILE_TIMELINE_WINDOW_YEARS;
}

// Reset mobile window to the default position (called on viewport switch to mobile).
export function resetMobileViewport() {
  setMobileViewStart(_MOBILE_DEFAULT_START);
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Filter / sort state ──
export let currentSort = '';  // set by setSort() on init — empty prevents accidental flip on first call

// Multi-select filter Sets — empty = no filter (show all)
export const statusFilters   = new Set();  // 'cathedral' | 'basilique' | 'church' | 'chapel' | 'other'
export const originFilters   = new Set();  // 'parish' | 'monastic' | 'hospital' | 'chapel'
export const organFilters    = new Set();  // 'has' | 'none'
export const clusterFilters  = new Set();  // 'A'|'B'|'C'
export const district1450Filters = new Set();  // District (1450) spatial classification

// Church name text filter — empty string = no filter
export let churchNameFilter = '';
export function setChurchNameFilter(q) { churchNameFilter = q.toLowerCase().trim(); applyFilters(); }

// Keep legacy aliases so existing imports don't crash (used by ui.js updateFilterSummary)
export let originFilter  = null;
export let statusFilter  = null;
export let organFilter   = null;
export let orderFilter   = null;
export let clusterFilter = null;

// Mutable Set of visible church ids (controlled by filters + manual toggle)
export let visibleChurches = new Set(churches.map(c => c.id));

// Current sorted order of church indices (array of ints 0..N-1)
export let sortedIndices = churches.map((_, i) => i);

// Track visibility (context tracks above church lanes)
export const trackVisibility = {
  rulers:     true,
  wars:       true,
  political:  true,
  religious:  true,
  plagues:    true,
  population: true,
  econEras:   true,
  urbanPower: true,   // Optional — sparse civic authority markers
  grain:      true,
};

// Selected church index for map highlight (-1 = none)
export let selectedCI = -1;
export function setSelectedCI(v) { selectedCI = v; }

// ── Colour maps ──
export const typeColors = {
  founded:      'var(--ev-founded)',
  cornerstone:  'var(--ev-cornerstone)',
  expansion:    'var(--ev-expansion)',
  denomination: 'var(--ev-denomination)',
  destroyed:    'var(--ev-destroyed)',
  notable:      'var(--ev-notable)',
  tumult:       'var(--ev-tumult)',
};

export const denomColors = {
  catholic:  '#c0463a',
  lutheran:  '#3a7a9e',
  calvinist: '#9035b5',
  armenian:  '#c0842a',
  secular:   '#8a8a90',
};

export const denomNames = {
  catholic:  'Catholic',
  lutheran:  'Lutheran',
  calvinist: 'Calvinist',
  armenian:  'Armenian Cath.',
  secular:   'Secular',
};

// ── Geometry helpers ──
export function yearToX(y) {
  return labelOffset + (y - viewStart) * pixelsPerYear;
}
export function getTotalWidth() {
  return labelOffset + (viewEnd - viewStart) * pixelsPerYear + 60;
}

// ── Cluster helpers ──
export function getCluster(ci) {
  const id = churches[ci].id;
  return clusterDefs.find(cl => cl.members.includes(id)) || null;
}

export function getMostSimilar(ci, n = 5) {
  const row = distMatrix[ci];
  return row
    .map((d, j) => ({ idx: j, dist: d }))
    .filter(p => p.idx !== ci)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

// ── Sorting ──

// St. Mary's coordinates (reference point for distance sort)
const _STMARY_LAT = 54.3498;
const _STMARY_LON = 18.6531;

function _haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns total years a church was Catholic (sum of all catholic denomBar spans)
function _catholicYears(ch) {
  return ch.denomBars
    .filter(b => b.type === 'catholic')
    .reduce((acc, b) => acc + (b.end - b.start), 0);
}

// Returns the earliest founded year for a church
function _foundedYear(ch) {
  const ev = ch.events.find(e => e.type === 'founded');
  return ev ? ev.year : ch.cornerstoneYear;
}

// Sort direction state: maps sort key → 'desc' | 'asc'
// cornerstone starts 'asc' (oldest first = natural timeline order); all others start 'desc' (largest first)
const _sortDir = { cornerstone: 'asc', established: 'asc' };

// Returns raw (always ascending) sort value for a church index
function _sortVal(k, ci) {
  const ch = churches[ci];
  switch (k) {
    case 'cornerstone':  return ch.cornerstoneYear;
    case 'established':  return _foundedYear(ch);
    case 'height':       return ch.height;
    case 'capacity':     return ch.capacity;
    case 'distance':     return _haversineKm(ch.lat, ch.lon, _STMARY_LAT, _STMARY_LON);
    case 'catholicism':  return _catholicYears(ch);
    default:             return 0;
  }
}

export function getSortedIndices(k) {
  const ix = churches.map((_, i) => i);
  // Date sorts default asc if not yet set, metric sorts default desc
  const defaultDir = (k === 'cornerstone' || k === 'established') ? 'asc' : 'desc';
  const dir = _sortDir[k] !== undefined ? _sortDir[k] : defaultDir;
  ix.sort((a, b) => {
    const va = _sortVal(k, a);
    const vb = _sortVal(k, b);
    return dir === 'desc' ? vb - va : va - vb;
  });
  return ix;
}

export function setSort(k) {
  if (currentSort === k) {
    // Same key clicked again → flip direction
    _sortDir[k] = (_sortDir[k] === 'desc') ? 'asc' : 'desc';
  } else {
    // New key → date sorts default asc (oldest first), metrics default desc (largest first)
    _sortDir[k] = (k === 'cornerstone' || k === 'established') ? 'asc' : 'desc';
  }
  currentSort = k;
  // Mutate in-place so ES module live bindings stay valid
  const ix = getSortedIndices(k);
  sortedIndices.length = 0;
  ix.forEach(v => sortedIndices.push(v));
  // Update active button state and direction indicator
  document.querySelectorAll('.sort-btn').forEach(b => {
    const isActive = b.dataset.sort === k;
    b.classList.toggle('active', isActive);
    if (isActive) {
      b.dataset.dir = _sortDir[k];
    } else {
      delete b.dataset.dir;
    }
  });
}

// ── Filtering ──
export function applyFilters() {
  // Mutate in-place so ES module live bindings stay valid
  visibleChurches.clear();
  churches.forEach((c, ci) => {
    // Each category: empty Set = no restriction; otherwise church must match at least one value in the Set
    const sMatch  = statusFilters.size  === 0 || statusFilters.has(c.status);
    const oMatch  = originFilters.size  === 0 || originFilters.has(c.origin);
    const orgMatch = organFilters.size  === 0
      || (organFilters.has('has') && c.organ.has)
      || (organFilters.has('none') && !c.organ.has);
    const cl = getCluster(ci);
    const clMatch = clusterFilters.size === 0 || (cl && clusterFilters.has(cl.id));
    const d1450 = district1450ByChurchId[c.id] || 'Unknown';
    const d1450Match = district1450Filters.size === 0 || district1450Filters.has(d1450);
    const nameMatch = !churchNameFilter
      || c.name.toLowerCase().includes(churchNameFilter)
      || c.shortName.toLowerCase().includes(churchNameFilter);
    if (sMatch && oMatch && orgMatch && clMatch && d1450Match && nameMatch) visibleChurches.add(c.id);
  });
}

// Toggle a value in/out of a filter Set, then reapply
export function toggleStatusFilter(v)  { _toggleSet(statusFilters,  v); applyFilters(); }
export function toggleOriginFilter(v)  { _toggleSet(originFilters,  v); applyFilters(); }
export function toggleOrganFilter(v)   { _toggleSet(organFilters,   v); applyFilters(); }
export function toggleClusterFilter(v) { _toggleSet(clusterFilters, v); applyFilters(); }
export function toggleDistrict1450Filter(v) { _toggleSet(district1450Filters, v); applyFilters(); }

export function clearAllFilters() {
  statusFilters.clear(); originFilters.clear();
  organFilters.clear();  clusterFilters.clear();
  district1450Filters.clear();
  applyFilters();
}

function _toggleSet(set, v) {
  if (set.has(v)) set.delete(v); else set.add(v);
}

export function toggleChurch(id) {
  if (visibleChurches.has(id)) visibleChurches.delete(id);
  else visibleChurches.add(id);
}

export function deselectAllChurches() {
  visibleChurches.clear();
}

export function selectAllChurches() {
  churches.forEach(c => visibleChurches.add(c.id));
}

export function toggleAllChurches() {
  if (visibleChurches.size === churches.length) {
    visibleChurches.clear();
  } else {
    churches.forEach(c => visibleChurches.add(c.id));
  }
}

export function toggleTrack(key) {
  trackVisibility[key] = !trackVisibility[key];
}
export function allTracksOn()  { Object.keys(trackVisibility).forEach(k => { trackVisibility[k] = true;  }); }
export function allTracksOff() { Object.keys(trackVisibility).forEach(k => { trackVisibility[k] = false; }); }

// ── [EXPERIMENT] Synced Periods Mode ──────────────────────────
// When true, the Periods (economic eras) row uses percentage-based
// positioning aligned with the axis ruler (1200–2005 full range)
// instead of pixel-based positioning tied to the scrollable content.
// This fixes the visual drift between the ruler year-scale and the
// period bands. Toggle via the ⚗ button on the Periods row label.
export let syncedPeriodsExperiment = true;
export function setSyncedPeriodsExperiment(v) { syncedPeriodsExperiment = v; }

// ── Patronage Mode (panel open/close only — no filtering) ──
export let patronageMode = false;
export function setPatronageMode(v) { patronageMode = v; }
