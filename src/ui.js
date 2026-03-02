// ═══════════ UI MODULE ═══════════
// Controls, filter chips, track toggles, minimap scrubber,
// legend, mobile tab switching, and collapsible chrome.

import { churches }    from './data/churches.js';
import { clusterDefs } from './data/clusters.js';
import { eras, siegeBands, legendItems } from './data/context.js';
import { getGrainValue, getShipsValue, getShipsTrend, GRAIN_MAX } from './data/grainCurve.js';
import { REGIME_SHIFTS } from './data/regimeShifts.js';
import { district1450ByChurchId, district1450Names } from './data/districts1450.js';
import {
  START_YEAR, END_YEAR, viewStart, viewEnd,
  setViewStart, setViewEnd, resetViewRange,
  labelOffset, pixelsPerYear,
  yearToX, getTotalWidth,
  visibleChurches, sortedIndices,
  currentSort, trackVisibility,
  statusFilters, originFilters, organFilters, clusterFilters,
  setSort, applyFilters,
  toggleStatusFilter, toggleOriginFilter, toggleOrganFilter, toggleClusterFilter,
  clearAllFilters,
  toggleChurch, toggleAllChurches, deselectAllChurches, selectAllChurches,
  toggleTrack, allTracksOn, allTracksOff,
  denomColors,
  patronageMode, setPatronageMode, selectedGuildId, setSelectedGuild, getHighlightedChurchIds,
} from './state.js';
import { patronageGuilds, churchPatrons } from './data/patronage.js';
import { render }        from './render.js';
import { renderMap, openMapForMobile, returnMapToTimeline, setMapYear, isMapExpanded } from './map.js';
import { closePanel }    from './detail.js';
import { hideTT, showGenericTT } from './tooltip.js';

// ── Legend panel ──────────────────────────────────────────────
export function renderLegend() {
  // Populate the Legend panel (right-side collapsible)
  const eventsEl = document.getElementById('legendEvents');
  const denomsEl = document.getElementById('legendDenoms');
  if (!eventsEl || !denomsEl) return;

  // Event markers
  eventsEl.innerHTML = legendItems.map(item => {
    let icon;
    if (item.shape === 'diamond') {
      icon = `<div style="background:${item.color};width:8px;height:8px;transform:rotate(45deg);"></div>`;
    } else if (item.shape === 'brick') {
      icon = `<div style="width:11px;height:7px;border:1.5px solid ${item.color};border-radius:1px;"></div>`;
    } else {
      icon = `<div style="background:${item.color};width:8px;height:8px;border-radius:50%;"></div>`;
    }
    return `<div class="legend-item"><div class="legend-item-icon">${icon}</div>${item.label}</div>`;
  }).join('');

  // Denomination colours
  const denoms = [
    { key: 'catholic',  label: 'Catholic' },
    { key: 'lutheran',  label: 'Lutheran' },
    { key: 'calvinist', label: 'Calvinist' },
    { key: 'armenian',  label: 'Armenian' },
    { key: 'secular',   label: 'Secular' },
  ];
  denomsEl.innerHTML = denoms.map(d =>
    `<div class="legend-item"><div class="legend-item-swatch" style="background:var(--${d.key})"></div>${d.label}</div>`
  ).join('');
}

export function initLegendPanel() {
  const btn   = document.getElementById('legendToggleBtn');
  const panel = document.getElementById('legendPanel');
  const close = document.getElementById('legendPanelClose');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => panel.classList.toggle('collapsed'));
  close?.addEventListener('click', () => panel.classList.add('collapsed'));

  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!panel.classList.contains('collapsed') && !panel.contains(e.target) && e.target !== btn) {
      panel.classList.add('collapsed');
    }
  });
}

// ── Churches row — merged into filterBar, this is now a no-op ──
export function buildChurchRow() { /* Churches are now part of buildFilterChips() */ }

// ── Filter chips (collapsible) ────────────────────────────────

// Delegated click handler — attached once to the bar, survives innerHTML rebuilds
// Exclusive by default (clicking replaces); hold CTRL for additive multi-select
function _onFilterBarClick(e) {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  const action = chip.dataset.action;
  if (!action) return;
  const isCtrl = e.ctrlKey || e.metaKey;
  try {
    _handleFilterChipClick(action, isCtrl);
    buildFilterChips();
    buildChurchRow();
    render();
    renderMap();
    renderMinimap();
  } catch (err) {
    console.error('[filter click error]', err);
  }
}

export function buildFilterChips() {
  const bar = document.getElementById('filterBar');
  if (!bar) return;

  function chip(label, isOn, action) {
    return `<div class="filter-chip ${isOn ? 'on' : ''}" data-action="${action}"><div class="chip-dot"></div>${label}</div>`;
  }

  // CTRL multi-select hint (applies to Status/Type/Size filters)
  let html = '<span class="ctrl-hint" title="Hold CTRL to multi-select filters">Hold CTRL to multi-select</span>';

  // Status filter — multi-select
  html += '<div class="filter-section"><span class="filter-section-label">Status:</span>';
  [
    { k: 'cathedral', l: 'Cathedral' },
    { k: 'basilique', l: 'Basilique' },
    { k: 'church',    l: 'Church' },
  ].forEach(s => { html += chip(s.l, statusFilters.has(s.k), `status:${s.k}`); });
  html += '</div>';

  // Origin (Type) filter — multi-select
  html += '<div class="filter-section"><span class="filter-section-label">Type:</span>';
  [
    { k: 'parish',   l: 'Parish' },
    { k: 'monastic', l: 'Monastic' },
    { k: 'hospital', l: 'Hospital' },
  ].forEach(o => { html += chip(o.l, originFilters.has(o.k), `origin:${o.k}`); });
  html += '</div>';

  // Cluster filter (3 capacity-based clusters)
  html += '<div class="filter-section"><span class="filter-section-label">Size:</span>';
  [
    { k: 'A', l: 'Large',  c: '#2a6a48' },
    { k: 'B', l: 'Medium', c: '#5a3a8a' },
    { k: 'C', l: 'Small',  c: '#a05520' },
  ].forEach(o => {
    html += `<div class="filter-chip ${clusterFilters.has(o.k) ? 'on' : ''}" data-action="cluster:${o.k}"><div class="chip-dot" style="background:${o.c};opacity:1"></div>${o.l}</div>`;
  });
  html += '</div>';

  // Clear all filters button
  const hasAnyFilter = statusFilters.size || originFilters.size || clusterFilters.size;
  if (hasAnyFilter) {
    html += `<div class="filter-section"><div class="filter-chip" data-action="clearAll" style="border-color:var(--ev-destroyed);color:var(--ev-destroyed)"><div class="chip-dot" style="background:var(--ev-destroyed);opacity:1"></div>Clear Filters</div></div>`;
  }

  bar.innerHTML = html;

  // Event delegation — attach once; removeEventListener is a no-op if not yet attached
  bar.removeEventListener('click', _onFilterBarClick);
  bar.addEventListener('click', _onFilterBarClick);

  // Always rebuild the church bar alongside
  buildChurchBar();
}

export function buildChurchBar() {
  // Update the compact selector button text
  const btn = document.getElementById('churchSelectorBtn');
  if (!btn) return;
  const n = visibleChurches.size;
  const total = churches.length;
  if (n === total) btn.textContent = `All ${total} selected`;
  else if (n === 0) btn.textContent = 'None selected';
  else btn.textContent = `${n} of ${total} selected`;

  // Build dropdown list
  _buildChurchDropdownList();
}

function _buildChurchDropdownList() {
  const list = document.getElementById('churchDropdownList');
  if (!list) return;
  const q = (document.getElementById('churchDropdownSearch')?.value || '').toLowerCase().trim();

  // Group churches by district
  const churchesByDistrict = {};
  district1450Names.forEach(d => { churchesByDistrict[d] = []; });
  churches.forEach(c => {
    const d = district1450ByChurchId[c.id] || 'Unknown';
    if (churchesByDistrict[d]) churchesByDistrict[d].push(c);
  });

  let html = '';
  district1450Names.forEach(district => {
    const districtChurches = churchesByDistrict[district] || [];

    // Filter churches by search query
    const visibleChurchesInDistrict = districtChurches.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)
    );

    // Skip district if no churches match search
    if (q && visibleChurchesInDistrict.length === 0) return;

    // District header with tri-state checkbox
    const allSelected = visibleChurchesInDistrict.every(c => visibleChurches.has(c.id));
    const noneSelected = visibleChurchesInDistrict.every(c => !visibleChurches.has(c.id));
    const isIndeterminate = !allSelected && !noneSelected;

    html += `<div class="church-district-header" data-district="${district}">
      <div class="church-district-checkbox ${allSelected ? 'on' : ''} ${isIndeterminate ? 'indeterminate' : ''}" data-action="selectDistrict:${district}"></div>
      <span class="church-district-label">${district} (${visibleChurchesInDistrict.length})</span>
    </div>`;

    // Church items within this district
    visibleChurchesInDistrict.forEach(c => {
      const on = visibleChurches.has(c.id);
      html += `<div class="church-selector-item ${on ? 'on' : ''}" data-cid="${c.id}">
        <div class="church-selector-cb">${on ? '✓' : ''}</div>
        <span>${c.shortName}</span>
      </div>`;
    });
  });

  list.innerHTML = html;
}

// ── Portal dropdown: rendered on document.body to escape overflow:hidden ──
let _portalDropdown = null;
let _portalOpen = false;

function _positionPortal() {
  const btn = document.getElementById('churchSelectorBtn');
  if (!btn || !_portalDropdown) return;
  const r = btn.getBoundingClientRect();
  _portalDropdown.style.top  = (r.bottom + 4) + 'px';
  _portalDropdown.style.left = r.left + 'px';
}

function _openPortal() {
  if (_portalOpen) return;
  _portalOpen = true;
  _portalDropdown.classList.add('open');
  _positionPortal();
  _buildChurchDropdownList();
  const search = _portalDropdown.querySelector('.church-selector-search');
  search?.focus();
}

function _closePortal() {
  if (!_portalOpen) return;
  _portalOpen = false;
  _portalDropdown.classList.remove('open');
}

export function initChurchSelector() {
  const btn       = document.getElementById('churchSelectorBtn');
  const origDrop  = document.getElementById('churchDropdown');
  if (!btn || !origDrop) return;

  // Move dropdown to document.body (portal pattern)
  origDrop.parentNode.removeChild(origDrop);
  document.body.appendChild(origDrop);
  _portalDropdown = origDrop;

  // Apply portal positioning styles
  _portalDropdown.style.position = 'fixed';
  _portalDropdown.style.zIndex   = '10000';

  const search   = _portalDropdown.querySelector('.church-selector-search');
  const list     = _portalDropdown.querySelector('.church-selector-list');
  const selAll   = _portalDropdown.querySelector('#churchSelAll');
  const selNone  = _portalDropdown.querySelector('#churchSelNone');

  // Toggle dropdown
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (_portalOpen) _closePortal(); else _openPortal();
  });

  // Reposition on scroll/resize
  window.addEventListener('resize', _positionPortal);
  document.addEventListener('scroll', _positionPortal, true);

  // Search filter
  search?.addEventListener('input', () => _buildChurchDropdownList());

  // Select all / none — stopPropagation to keep dropdown open
  selAll?.addEventListener('click', e => { e.stopPropagation(); selectAllChurches(); buildChurchBar(); render(); renderMap(); renderMinimap(); });
  selNone?.addEventListener('click', e => { e.stopPropagation(); deselectAllChurches(); buildChurchBar(); render(); renderMap(); renderMinimap(); });

  // Item/district clicks (delegated) — stopPropagation to keep dropdown open
  list?.addEventListener('click', e => {
    e.stopPropagation();

    // Handle church item click
    const item = e.target.closest('.church-selector-item');
    if (item) {
      toggleChurch(item.dataset.cid);
      buildChurchBar();
      render();
      renderMap();
      renderMinimap();
      return;
    }

    // Handle district header click (whole district selection)
    const distHeader = e.target.closest('.church-district-header');
    if (!distHeader) return;
    const district = distHeader.dataset.district;
    if (!district) return;

    // Get all churches in this district
    const districtChurches = churches.filter(c => district1450ByChurchId[c.id] === district);
    if (!districtChurches.length) return;

    // Check if all are selected
    const allSelected = districtChurches.every(c => visibleChurches.has(c.id));

    // Toggle: if all selected, deselect all; otherwise select all
    districtChurches.forEach(c => {
      if (allSelected) visibleChurches.delete(c.id);
      else visibleChurches.add(c.id);
    });

    buildChurchBar();
    render();
    renderMap();
    renderMinimap();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (_portalOpen && !_portalDropdown.contains(e.target) && e.target !== btn) {
      _closePortal();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _portalOpen) _closePortal();
  });
}

// Exclusive toggle: without CTRL, select only this value (or clear if already solo-active).
// With CTRL, toggle additively.
function _exclusiveToggle(filterSet, val, isCtrl) {
  if (isCtrl) {
    // Additive: just toggle
    if (filterSet.has(val)) filterSet.delete(val); else filterSet.add(val);
  } else {
    // Exclusive: if this is the only active value, deselect it (show all)
    if (filterSet.size === 1 && filterSet.has(val)) {
      filterSet.clear();
    } else {
      filterSet.clear();
      filterSet.add(val);
    }
  }
}

function _handleFilterChipClick(action, isCtrl = false) {
  const colonIdx = action.indexOf(':');
  const type   = colonIdx === -1 ? action : action.slice(0, colonIdx);
  const rawVal = colonIdx === -1 ? '' : action.slice(colonIdx + 1);

  // For filter groups: without CTRL, clicking a value selects it exclusively
  // (or deselects if it's already the only active one). With CTRL, toggle additively.
  switch (type) {
    case 'status':
      _exclusiveToggle(statusFilters, rawVal, isCtrl);
      applyFilters();
      break;
    case 'origin':
      _exclusiveToggle(originFilters, rawVal, isCtrl);
      applyFilters();
      break;
    case 'cluster':
      _exclusiveToggle(clusterFilters, rawVal, isCtrl);
      applyFilters();
      break;
    case 'clearAll':   clearAllFilters();           break;
    case 'selectAll':  selectAllChurches();         break;
    case 'deselectAll':deselectAllChurches();       break;
    case 'church':     toggleChurch(rawVal);        break;
  }
}

// ── Filter bar (always visible — no collapse) ─────────────────
export function updateFilterSummary() { /* no-op: filter bar is always visible */ }
export function toggleFilters() { /* no-op: filter bar is always visible */ }

// ── Track toggles ─────────────────────────────────────────────
function _onTrackToggleClick(e) {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  if (chip.dataset.action === 'allTracksOn')  { allTracksOn();  }
  else if (chip.dataset.action === 'allTracksOff') { allTracksOff(); }
  else if (chip.dataset.track) { toggleTrack(chip.dataset.track); }
  else return;
  buildTrackToggles();
  render();
}

export function buildTrackToggles() {
  const el = document.getElementById('trackToggles');
  if (!el) return;
  const tracks = [
    { k: 'econEras',   l: 'Periods' },
    { k: 'rulers',     l: 'Kings/Rulers' },
    { k: 'wars',       l: 'Wars' },
    { k: 'political',  l: 'Political' },
    { k: 'religious',  l: 'Religious' },
    { k: 'plagues',    l: 'Plagues' },
    { k: 'urbanPower', l: 'Urban Power' },
    { k: 'population', l: 'Population' },
    { k: 'grain',      l: 'Grain Export' },
  ];
  const allOn  = tracks.every(t => trackVisibility[t.k]);
  const noneOn = tracks.every(t => !trackVisibility[t.k]);
  let html = '<span class="ctrl-label" style="margin-right:2px;flex-shrink:0;">Tracks:</span>';
  html += `<div class="filter-chip ${allOn ? 'on' : ''}" data-action="allTracksOn"><div class="chip-dot"></div>All</div>`;
  html += `<div class="filter-chip ${noneOn ? 'on' : ''}" data-action="allTracksOff"><div class="chip-dot"></div>None</div>`;
  html += '<div class="ctrl-sep" style="height:14px;margin:0 4px;"></div>';
  html += tracks.map(t => `<div class="filter-chip ${trackVisibility[t.k] ? 'on' : ''}" data-track="${t.k}"><div class="chip-dot"></div>${t.l}</div>`).join('');
  el.innerHTML = html;
  // Event delegation — attach once, survives innerHTML rebuild
  el.removeEventListener('click', _onTrackToggleClick);
  el.addEventListener('click', _onTrackToggleClick);
}

// ── Minimap scrubber ──────────────────────────────────────────
export function renderMinimap() {
  const canvas = document.getElementById('minimapCanvas');
  if (!canvas) return;
  const bar = document.getElementById('minimapBar');
  if (!bar) return;
  const W = bar.clientWidth;
  if (!W) return;
  canvas.width  = W;
  canvas.height = 34;
  const H   = 34;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const yToX = y => (y - START_YEAR) / (END_YEAR - START_YEAR) * W;

  // ── LAYER 1: Historical period era blocks (background) ─────
  // Stable context, independent of church filtering/sorting
  eras.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.fillRect(yToX(e.start), 0, yToX(e.end) - yToX(e.start), H);
  });

  // ── LAYER 2: Grain Export — grounded area graph ───────────
  // Raw grain export volume (k łaszts) — sole economic indicator in minimap.
  // sqrt scaling so the low-value early period (1200–1400) remains visible.
  // NOT affected by church filtering or sorting — macro context only.
  {
    const FILL   = 'rgba(180, 140, 40, 0.15)';   // muted amber, very subtle
    const STROKE = 'rgba(155, 115, 20, 0.45)';   // darker amber for top-edge line

    for (let x = 0; x < W; x++) {
      const year   = START_YEAR + (x / W) * (END_YEAR - START_YEAR);
      const val    = getGrainValue(year);
      const frac   = Math.sqrt(val / GRAIN_MAX);       // sqrt for early-period visibility
      const graphH = Math.max(1, Math.round(frac * H));
      const graphY = H - graphH;

      ctx.fillStyle = FILL;
      ctx.fillRect(x, graphY, 1, graphH);

      ctx.fillStyle = STROKE;
      ctx.fillRect(x, graphY, 1, 1);
    }
  }

  // ── LAYER 3: Subtle war / disruption bands ──────────────────
  siegeBands.forEach(s => {
    ctx.fillStyle = 'rgba(192,48,48,0.08)';
    ctx.fillRect(yToX(s.start), 0, Math.max(yToX(s.end) - yToX(s.start), 1), H);
  });

  // ── LAYER 4: Century divider grid lines ────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = START_YEAR; y <= END_YEAR; y += 100) {
    ctx.fillRect(yToX(y), 0, 1, H);
  }

  // ── LAYER 5: Regime Shift Markers ──────────────────────────
  // Thin vertical line + small diamond-tip at top for each structural break.
  // Muted dark ink — visible but not dominant; filter-independent context.
  {
    const MARKER_COLOR = 'rgba(48, 42, 36, 0.36)';  // darker neutral ink, subtler opacity
    REGIME_SHIFTS.forEach(m => {
      const x = Math.round(yToX(m.year));

      ctx.fillStyle = MARKER_COLOR;

      // Full-height thin vertical line (1px wide)
      ctx.fillRect(x, 0, 1, H);

      // Small diamond at the top of the line (6px tall, ±3px wide)
      ctx.beginPath();
      ctx.moveTo(x,     0);   // top tip
      ctx.lineTo(x + 3, 4);   // right
      ctx.lineTo(x,     8);   // bottom
      ctx.lineTo(x - 3, 4);   // left
      ctx.closePath();
      ctx.fill();
    });
  }

  // Reposition range handles (pill handles — no fill, edge only)
  updateMinimapRangeHandles();
}

function updateMinimapRangeHandles() {
  const bar = document.getElementById('minimapBar');
  if (!bar) return;
  const barW = bar.clientWidth;
  if (barW === 0) return;  // Bar not visible or not laid out yet

  // Calculate positions as fractions of the bar width
  const rangeFracStart = (viewStart - START_YEAR) / (END_YEAR - START_YEAR);
  const rangeFracEnd = (viewEnd - START_YEAR) / (END_YEAR - START_YEAR);

  const leftHandle = document.getElementById('minimapHandleLeft');
  const rightHandle = document.getElementById('minimapHandleRight');
  const connector = document.getElementById('minimapConnector');

  // Position left handle (pill shape is 18px wide, centered via margin-left: -9px)
  if (leftHandle) {
    const leftPx = rangeFracStart * barW;
    leftHandle.style.left = leftPx + 'px';
  }

  // Position right handle
  if (rightHandle) {
    const rightPx = rangeFracEnd * barW;
    rightHandle.style.left = rightPx + 'px';
  }

  // Position connector line between handles
  if (connector && leftHandle && rightHandle) {
    const leftPx = rangeFracStart * barW;
    const rightPx = rangeFracEnd * barW;
    connector.style.left = (leftPx + 9) + 'px';  // Start after left handle center (9px offset)
    connector.style.width = Math.max(0, (rightPx - leftPx - 18)) + 'px';  // Span between pill centers
  }
}

// ── Grain Curve Tooltip (global, escapes overflow:hidden) ──
// The minimap-bar has overflow:hidden, so the tooltip must be
// a fixed-positioned element parented to <body>, not to the bar.
export function initMinimapRibbonTooltip() {
  const canvas = document.getElementById('minimapCanvas');
  const bar    = document.getElementById('minimapBar');
  const tip    = document.getElementById('minimapRibbonTooltip');
  if (!canvas || !bar || !tip) return;

  function showTip(e) {
    const rect  = bar.getBoundingClientRect();
    const barW  = rect.width;
    if (barW === 0) return;

    const relX  = e.clientX - rect.left;
    const year  = START_YEAR + (relX / barW) * (END_YEAR - START_YEAR);
    const grain = getGrainValue(year);
    const ships = getShipsValue(year);
    const trend = getShipsTrend(year);

    // Year · grain value · ships + trend arrow (no interpretive labels)
    tip.innerHTML =
      `<span class="mrt-year">${Math.round(year)}</span>` +
      `<span class="mrt-sep"> · </span>` +
      `<span class="mrt-value">${grain.toFixed(0)}k łaszt</span>` +
      `<span class="mrt-sep"> · </span>` +
      `<span class="mrt-desc">${Math.round(ships)} ships ${trend}</span>`;

    // Position: above the minimap bar, horizontally near cursor
    const tipW  = tip.offsetWidth || 180;
    let   left  = e.clientX - tipW / 2;
    // Clamp so tooltip never escapes the viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    const top   = rect.top - tip.offsetHeight - 8;

    tip.style.left    = left + 'px';
    tip.style.top     = Math.max(4, top) + 'px';
    tip.style.opacity = '1';
    tip.style.visibility = 'visible';
  }

  function hideTip() {
    tip.style.opacity    = '0';
    tip.style.visibility = 'hidden';
  }

  // Attach to the canvas (not the bar) so pointer-capture on handles doesn't interfere
  canvas.addEventListener('mousemove',  showTip);
  canvas.addEventListener('mouseleave', hideTip);

  // Also hide when a handle drag starts (avoid tooltip flicker during pan)
  bar.addEventListener('mousedown', hideTip);
}

// ── Regime Shift Tooltip (global, fixed-position, higher z than ribbon tip) ──
// Appears on canvas hover when cursor is within ±5px of a regime marker.
// While a regime tooltip is visible, the ribbon tooltip is suppressed.
export function initMinimapRegimeTooltip() {
  const canvas = document.getElementById('minimapCanvas');
  const bar    = document.getElementById('minimapBar');
  const tip    = document.getElementById('minimapRegimeTooltip');
  if (!canvas || !bar || !tip) return;

  const HIT_PX = 5;  // hit-area half-width in screen pixels

  function showTip(e) {
    const rect = bar.getBoundingClientRect();
    const barW = rect.width;
    if (barW === 0) { hideTip(); return; }

    const relX = e.clientX - rect.left;

    // Find the nearest regime marker within hit area
    let nearest = null;
    let nearestDist = Infinity;
    REGIME_SHIFTS.forEach(m => {
      const markerX = (m.year - START_YEAR) / (END_YEAR - START_YEAR) * barW;
      const dist = Math.abs(relX - markerX);
      if (dist <= HIT_PX && dist < nearestDist) {
        nearest = m;
        nearestDist = dist;
      }
    });

    if (nearest) {
      // Build two-line tooltip content
      tip.innerHTML =
        `<div class="mrg-header">` +
          `<span class="mrg-year">${Math.round(nearest.year)}</span>` +
          `<span class="mrg-sep"> · </span>` +
          `<span class="mrg-label">${nearest.label}</span>` +
        `</div>` +
        `<div class="mrg-desc">${nearest.description}</div>`;

      // Position: above the minimap bar, horizontally near cursor
      const tipW = tip.offsetWidth || 220;
      let left = e.clientX - tipW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      const top = rect.top - tip.offsetHeight - 8;

      tip.style.left       = left + 'px';
      tip.style.top        = Math.max(4, top) + 'px';
      tip.style.opacity    = '1';
      tip.style.visibility = 'visible';

      // Suppress ribbon tooltip while regime tooltip is active
      const ribbonTip = document.getElementById('minimapRibbonTooltip');
      if (ribbonTip) {
        ribbonTip.style.opacity    = '0';
        ribbonTip.style.visibility = 'hidden';
      }
    } else {
      hideTip();
    }
  }

  function hideTip() {
    tip.style.opacity    = '0';
    tip.style.visibility = 'hidden';
  }

  // Register AFTER ribbon tooltip listeners so regime tooltip takes priority
  canvas.addEventListener('mousemove',  showTip);
  canvas.addEventListener('mouseleave', hideTip);
  bar.addEventListener('mousedown',     hideTip);
}

export function updateMinimapViewport() {
  // Legacy name kept for compatibility with scroll sync
  // Now only updates range handles, not the fill
  updateMinimapRangeHandles();
}

export function updateViewRangeLabel() {
  const label = document.getElementById('viewRangeLabel');
  if (!label) return;
  const start = Math.round(viewStart);
  const end = Math.round(viewEnd);
  label.textContent = `View: ${start}–${end}`;

  // Show/hide ⟲ Full reset button whenever view range differs from global
  const resetBtn = document.getElementById('btnResetRange');
  if (resetBtn) {
    const isNarrowed = viewStart > START_YEAR || viewEnd < END_YEAR;
    resetBtn.style.display = isNarrowed ? '' : 'none';
  }
}

export function minimapClick(e) {
  const bar  = document.getElementById('minimapBar');
  if (!bar) return;
  const rect = bar.getBoundingClientRect();
  const frac = (e.clientX - rect.left) / rect.width;
  const year = START_YEAR + frac * (END_YEAR - START_YEAR);
  // Only scroll if click is within the selected range (not on overlays/handles)
  if (year >= viewStart && year <= viewEnd) {
    window._scrollToYear?.(year);
  }
}

// ── Range slider ──────────────────────────────────────────────
export function renderRangeSlider() {
  const bar = document.getElementById('minimapBar');
  if (!bar) return;

  const leftOverlay  = document.getElementById('rangeOverlayLeft');
  const rightOverlay = document.getElementById('rangeOverlayRight');
  const leftHandle   = document.getElementById('rangeHandleLeft');
  const rightHandle  = document.getElementById('rangeHandleRight');
  const leftLabel    = document.getElementById('rangeLabelLeft');
  const rightLabel   = document.getElementById('rangeLabelRight');

  if (!leftOverlay || !rightOverlay || !leftHandle || !rightHandle) return;

  const leftFrac  = (viewStart - START_YEAR) / (END_YEAR - START_YEAR);
  const rightFrac = (viewEnd   - START_YEAR) / (END_YEAR - START_YEAR);

  leftOverlay.style.width = (leftFrac * 100) + '%';
  rightOverlay.style.left  = (rightFrac * 100) + '%';
  rightOverlay.style.width = ((1 - rightFrac) * 100) + '%';

  leftHandle.style.left  = (leftFrac * 100) + '%';
  rightHandle.style.left = (rightFrac * 100) + '%';

  if (leftLabel)  leftLabel.textContent  = Math.round(viewStart);
  if (rightLabel) rightLabel.textContent = Math.round(viewEnd);

  // Show/hide reset button
  const resetBtn = document.getElementById('btnResetRange');
  if (resetBtn) {
    resetBtn.style.display = (viewStart > START_YEAR || viewEnd < END_YEAR) ? '' : 'none';
  }

  // Show/hide year labels only when range is narrowed
  const isNarrowed = viewStart > START_YEAR || viewEnd < END_YEAR;
  leftHandle.style.opacity  = isNarrowed ? '1' : '0.5';
  rightHandle.style.opacity = isNarrowed ? '1' : '0.5';
}

// Debounced render during drag
let _rangeRenderTimer = null;
function _debouncedRangeRender() {
  if (_rangeRenderTimer) return;
  _rangeRenderTimer = setTimeout(() => {
    _rangeRenderTimer = null;
    render();
    updateMinimapViewport();
    updateViewRangeLabel();
  }, 40);
}

export function initRangeSlider() {
  const bar = document.getElementById('minimapBar');
  if (!bar) return;

  function yearFromClientX(clientX) {
    const rect = bar.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return START_YEAR + frac * (END_YEAR - START_YEAR);
  }

  let dragging = null; // 'left' | 'right' | null

  // Mouse/touch start on handles
  ['rangeHandleLeft', 'rangeHandleRight'].forEach(id => {
    const handle = document.getElementById(id);
    if (!handle) return;
    const side = id.includes('Left') ? 'left' : 'right';

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      dragging = side;
      handle.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });

    handle.addEventListener('touchstart', e => {
      e.stopPropagation();
      dragging = side;
      handle.classList.add('dragging');
    }, { passive: true });
  });

  function onMove(e) {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const year = yearFromClientX(clientX);
    if (dragging === 'left') setViewStart(year);
    else setViewEnd(year);
    renderRangeSlider();
    _debouncedRangeRender();
  }

  function onEnd() {
    if (!dragging) return;
    // Remove dragging class from both handles
    document.getElementById('rangeHandleLeft')?.classList.remove('dragging');
    document.getElementById('rangeHandleRight')?.classList.remove('dragging');
    dragging = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    // Final full render
    render();
    renderMinimap();
    renderRangeSlider();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove, { passive: true });
  document.addEventListener('touchend', onEnd);

  // Double-click on dimmed overlay → reset range
  ['rangeOverlayLeft', 'rangeOverlayRight'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      resetViewRange();
      render();
      renderMinimap();
      renderRangeSlider();
    });
  });
}

// ── Minimap handle dragging (pill-based, robust range adjustment) ────
export function initMinimapHandles() {
  const bar = document.getElementById('minimapBar');
  const leftHandle = document.getElementById('minimapHandleLeft');
  const rightHandle = document.getElementById('minimapHandleRight');
  const connector = document.getElementById('minimapConnector');

  if (!bar || !leftHandle || !rightHandle) return;

  // Calculate year from client X position on the minimap bar
  function yearFromClientX(clientX) {
    const rect = bar.getBoundingClientRect();
    if (rect.width === 0) return START_YEAR;
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return START_YEAR + frac * (END_YEAR - START_YEAR);
  }

  // Update year tooltip for a handle (text + visibility)
  function updateTooltip(handle, year, forceShow = false) {
    const tooltip = handle.querySelector('.minimap-year-tooltip');
    if (!tooltip) return;

    // Update text
    tooltip.textContent = Math.round(year);

    // Explicitly ensure visibility during drag
    if (forceShow) {
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.style.pointerEvents = 'none';
    }
  }

  // Update both tooltips to show current viewStart/viewEnd
  function updateBothTooltips(forceShow = false) {
    updateTooltip(leftHandle, viewStart, forceShow);
    updateTooltip(rightHandle, viewEnd, forceShow);
  }

  // Hide both tooltips
  function hideTooltips() {
    const leftTooltip = leftHandle.querySelector('.minimap-year-tooltip');
    const rightTooltip = rightHandle.querySelector('.minimap-year-tooltip');
    if (leftTooltip) {
      leftTooltip.style.opacity = '0';
      leftTooltip.textContent = '';
    }
    if (rightTooltip) {
      rightTooltip.style.opacity = '0';
      rightTooltip.textContent = '';
    }
  }

  // State tracking
  let dragState = {
    isActive: false,
    type: null,      // 'left' | 'right' | 'pan' | null
    pointerElement: null,
    pointerId: null,
    startViewStart: null,
    startViewEnd: null,
  };

  // ─── LEFT HANDLE DRAG ───────────────────────────────────────
  function onLeftHandleDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;  // Only primary button for mouse
    e.preventDefault();
    e.stopPropagation();

    dragState = {
      isActive: true,
      type: 'left',
      pointerElement: leftHandle,
      pointerId: e.pointerId,
      startViewStart: viewStart,
      startViewEnd: viewEnd,
    };

    leftHandle.classList.add('dragging');
    updateBothTooltips(true);  // Show and update tooltip immediately on drag start
    leftHandle.setPointerCapture(e.pointerId);
  }

  // ─── RIGHT HANDLE DRAG ──────────────────────────────────────
  function onRightHandleDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragState = {
      isActive: true,
      type: 'right',
      pointerElement: rightHandle,
      pointerId: e.pointerId,
      startViewStart: viewStart,
      startViewEnd: viewEnd,
    };

    rightHandle.classList.add('dragging');
    updateBothTooltips(true);  // Show and update tooltip immediately on drag start
    rightHandle.setPointerCapture(e.pointerId);
  }

  // ─── CONNECTOR DRAG (optional pan) ──────────────────────────
  function onConnectorDown(e) {
    if (!connector) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragState = {
      isActive: true,
      type: 'pan',
      pointerElement: connector,
      pointerId: e.pointerId,
      startViewStart: viewStart,
      startViewEnd: viewEnd,
    };

    connector.classList.add('panning');
    updateBothTooltips(true);  // Show and update tooltip immediately on drag start
    connector.setPointerCapture(e.pointerId);
  }

  // ─── UNIFIED MOVE HANDLER ──────────────────────────────────
  function onPointerMove(e) {
    if (!dragState.isActive || dragState.pointerId !== e.pointerId) return;

    const year = yearFromClientX(e.clientX);
    const rangeDuration = dragState.startViewEnd - dragState.startViewStart;

    if (dragState.type === 'left') {
      setViewStart(Math.min(year, dragState.startViewEnd - 50));
    } else if (dragState.type === 'right') {
      setViewEnd(Math.max(year, dragState.startViewStart + 50));
    } else if (dragState.type === 'pan') {
      // Pan: move both start and end together, preserving zoom width
      const delta = year - dragState.startViewStart;
      const newStart = Math.max(START_YEAR, dragState.startViewStart + delta);
      const newEnd = newStart + rangeDuration;
      if (newEnd <= END_YEAR) {
        setViewStart(newStart);
        setViewEnd(newEnd);
      }
    }

    // Live visual updates
    updateMinimapRangeHandles();
    updateBothTooltips(true);  // Update year tooltips live during drag (keep visible)
    _debouncedRangeRender();
  }

  // ─── UNIFIED UP/CANCEL HANDLER ─────────────────────────────
  function onPointerUp(e) {
    if (!dragState.isActive || dragState.pointerId !== e.pointerId) return;

    // Remove visual feedback
    leftHandle.classList.remove('dragging');
    rightHandle.classList.remove('dragging');
    if (connector) connector.classList.remove('panning');

    // Release pointer capture
    if (dragState.pointerElement) {
      try {
        dragState.pointerElement.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Capture was already released or element is gone
      }
    }

    dragState.isActive = false;

    // Hide tooltips after drag
    hideTooltips();

    // Final full render
    render();
    renderMinimap();
    renderRangeSlider();
    updateViewRangeLabel();
  }

  function onPointerCancel(e) {
    if (!dragState.isActive || dragState.pointerId !== e.pointerId) return;

    leftHandle.classList.remove('dragging');
    rightHandle.classList.remove('dragging');
    if (connector) connector.classList.remove('panning');

    // Hide tooltips after drag is cancelled
    hideTooltips();

    if (dragState.pointerElement) {
      try {
        dragState.pointerElement.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Already released
      }
    }

    dragState.isActive = false;
  }

  // ─── HOVER LISTENERS (update tooltip on hover) ──────────────
  leftHandle.addEventListener('pointerenter', () => {
    if (!dragState.isActive) {
      updateBothTooltips(true);  // Show tooltip on hover
    }
  });
  rightHandle.addEventListener('pointerenter', () => {
    if (!dragState.isActive) {
      updateBothTooltips(true);  // Show tooltip on hover
    }
  });
  leftHandle.addEventListener('pointerleave', () => {
    if (!dragState.isActive) {
      hideTooltips();  // Hide tooltip when leaving handle
    }
  });
  rightHandle.addEventListener('pointerleave', () => {
    if (!dragState.isActive) {
      hideTooltips();  // Hide tooltip when leaving handle
    }
  });

  // ─── ATTACH ALL LISTENERS ──────────────────────────────────
  leftHandle.addEventListener('pointerdown', onLeftHandleDown);
  rightHandle.addEventListener('pointerdown', onRightHandleDown);
  if (connector) {
    connector.addEventListener('pointerdown', onConnectorDown);
  }

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
}

// ── Sort buttons ──────────────────────────────────────────────
export function initSortButtons() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.sort;
      setSort(k);
      // setRenderSortKey(k) is handled in main.js via the re-export
      render();
    });
  });
}

// ── Chrome collapse (mobile + desktop) ───────────────────────
export function toggleMobileChrome() {
  const chrome = document.getElementById('mChrome');
  const btn    = document.getElementById('mChromeToggle');
  const isCollapsed = chrome.classList.toggle('collapsed');
  btn.classList.toggle('collapsed', isCollapsed);
  btn.textContent = isCollapsed ? '▶' : '▼';
}

// ── Mobile tab switching ──────────────────────────────────────
let _currentMobileTab = 'timeline';

export function switchTab(tabId) {
  const wasMap = _currentMobileTab === 'map';
  _currentMobileTab = tabId;

  // If leaving Map tab, move the map element back to the timeline panel
  if (wasMap && tabId !== 'map') {
    returnMapToTimeline();
  }

  // Update tab active state (v6 style tabs)
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });

  // Hide all screens, show the target
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('scr' + _capitalize(tabId));
  if (target) target.classList.add('active');

  // Auto-collapse filters panel when switching to Map view
  if (tabId === 'map') {
    const chrome = document.getElementById('mChrome');
    const btn = document.getElementById('mChromeToggle');
    if (chrome && btn) {
      chrome.classList.add('collapsed');
      btn.classList.add('collapsed');
      btn.textContent = '▶';
    }
    openMapForMobile();
  }

  closePanel();
  hideTT();
}

function _capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Mobile filter/info views (used by filters + info tabs) ───
export function buildMobileFilters() {
  // Build the filters screen content (mirrors buildFilterChips but in card groups)
  const el = document.getElementById('scrFilters');
  if (!el) return;

  const sorts   = ['cornerstone', 'established', 'height', 'capacity', 'distance', 'catholicism'];
  const sortLabels = { cornerstone: 'Cornerstone', established: 'Established', height: 'Height', capacity: 'Capacity', distance: 'Dist. St.Mary', catholicism: 'Catholicism' };

  let html = `<div style="padding:12px;overflow-y:auto;flex:1;">`;

  // Sort
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Sort By</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  sorts.forEach(s => {
    html += `<div class="filter-chip ${currentSort === s ? 'on' : ''}" data-action="sort:${s}"><div class="chip-dot"></div>${sortLabels[s]}</div>`;
  });
  html += `</div></div>`;

  // Tracks
  const _allTracksOn  = Object.values(trackVisibility).every(Boolean);
  const _noneTracksOn = Object.values(trackVisibility).every(v => !v);
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Visible Tracks</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  html += `<div class="filter-chip ${_allTracksOn ? 'on' : ''}" data-action="allTracksOn"><div class="chip-dot"></div>All</div>`;
  html += `<div class="filter-chip ${_noneTracksOn ? 'on' : ''}" data-action="allTracksOff"><div class="chip-dot"></div>None</div>`;
  Object.entries(trackVisibility).forEach(([k, v]) => {
    html += `<div class="filter-chip ${v ? 'on' : ''}" data-action="track:${k}"><div class="chip-dot"></div>${k.charAt(0).toUpperCase() + k.slice(1)}</div>`;
  });
  html += `</div></div>`;

  // Status
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Status</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  [
    { k: 'cathedral', l: 'Cathedral' },
    { k: 'basilique', l: 'Basilique' },
    { k: 'church',    l: 'Church' },
  ].forEach(o => {
    html += `<div class="filter-chip ${statusFilters.has(o.k) ? 'on' : ''}" data-action="status:${o.k}"><div class="chip-dot"></div>${o.l}</div>`;
  });
  html += `</div></div>`;

  // Type (origin)
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Type</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  [
    { k: 'parish',   l: 'Parish' },
    { k: 'monastic', l: 'Monastic' },
    { k: 'hospital', l: 'Hospital' },
  ].forEach(o => {
    html += `<div class="filter-chip ${originFilters.has(o.k) ? 'on' : ''}" data-action="origin:${o.k}"><div class="chip-dot"></div>${o.l}</div>`;
  });
  html += `</div></div>`;

  // Size (capacity-based clusters)
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Size</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  [
    { k: 'A', l: 'Large',  c: '#2a6a48' },
    { k: 'B', l: 'Medium', c: '#5a3a8a' },
    { k: 'C', l: 'Small',  c: '#a05520' },
  ].forEach(o => {
    html += `<div class="filter-chip ${clusterFilters.has(o.k) ? 'on' : ''}" data-action="cluster:${o.k}"><div class="chip-dot" style="background:${o.c};opacity:1"></div>${o.l}</div>`;
  });
  html += `</div></div>`;

  // Organ
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Organ</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
  html += `<div class="filter-chip ${organFilters.has('has') ? 'on' : ''}" data-action="organ:has"><div class="chip-dot"></div>Has Organ</div>`;
  html += `<div class="filter-chip ${organFilters.has('none') ? 'on' : ''}" data-action="organ:none"><div class="chip-dot"></div>No Organ</div>`;
  html += `</div></div>`;

  // Clear filters (if any active)
  const hasAnyMobileFilter = statusFilters.size || originFilters.size || organFilters.size || clusterFilters.size;
  if (hasAnyMobileFilter) {
    html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
      <div class="filter-chip" data-action="clearAll" style="border-color:var(--ev-destroyed);color:var(--ev-destroyed)"><div class="chip-dot" style="background:var(--ev-destroyed);opacity:1"></div>Clear Filters</div>
      </div></div>`;
  }

  // Individual churches
  const allOn = visibleChurches.size === churches.length;
  html += `<div style="background:var(--bg-elevated);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid var(--border-subtle);">
    <div style="font-family:var(--font-ui);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Churches</div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;">
    <div class="filter-chip ${allOn ? 'on' : ''}" data-action="selectAll"><div class="chip-dot"></div>All</div>
    <div class="filter-chip ${visibleChurches.size === 0 ? 'on' : ''}" data-action="deselectAll"><div class="chip-dot"></div>None</div>`;
  churches.forEach(c => {
    html += `<div class="filter-chip ${visibleChurches.has(c.id) ? 'on' : ''}" data-action="church:${c.id}"><div class="chip-dot"></div>${c.shortName}</div>`;
  });
  html += `</div></div></div>`;

  el.innerHTML = html;

  el.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const act = chip.dataset.action || '';
      const colonIdx = act.indexOf(':');
      const type   = colonIdx === -1 ? act : act.slice(0, colonIdx);
      const rawVal = colonIdx === -1 ? '' : act.slice(colonIdx + 1);
      if (type === 'sort')              { setSort(rawVal); render(); }
      else if (act === 'allTracksOn')  { allTracksOn();  render(); }
      else if (act === 'allTracksOff') { allTracksOff(); render(); }
      else if (type === 'track')        { toggleTrack(rawVal); render(); }
      else if (act === 'selectAll')     { selectAllChurches(); render(); renderMap(); }
      else if (act === 'deselectAll'){ deselectAllChurches(); render(); renderMap(); }
      else if (type === 'church')    { toggleChurch(rawVal); render(); renderMap(); }
      else { _handleFilterChipClick(act); render(); renderMap(); renderMinimap(); }
      buildMobileFilters();
    });
  });
}

// ── Mobile touch: drag-to-dismiss drawer ─────────────────────
export function setupMobileTouchDismiss() {
  const drawer = document.getElementById('drawer');
  if (!drawer) return;
  let startY = 0, currentY = 0;

  drawer.addEventListener('touchstart', e => {
    const rect = drawer.getBoundingClientRect();
    if (e.touches[0].clientY - rect.top > 44) return;
    startY = e.touches[0].clientY;
    drawer.style.transition = 'none';
  }, { passive: true });

  drawer.addEventListener('touchmove', e => {
    if (!startY) return;
    currentY = e.touches[0].clientY;
    const dy = currentY - startY;
    if (dy > 0) drawer.style.transform = `translateY(${dy}px)`;
  }, { passive: true });

  drawer.addEventListener('touchend', () => {
    if (!startY) return;
    drawer.style.transition = '';
    if (currentY - startY > 80) {
      closePanel();
    } else {
      drawer.style.transform = drawer.classList.contains('open') ? 'translateY(0)' : '';
    }
    startY = 0; currentY = 0;
  }, { passive: true });
}

// ── Patronage Mode (Guild Lens) ─────────────────────────────

let _patTab = 'guilds'; // 'guilds' | 'founders'

const _guildIcons = {
  merchants: '⚓', maritime: '🚢', brewers: '🍺', butchers: '🥩',
  bakers: '🍞', goldsmiths: '💎', weavers: '🧵', stgeorge: '🛡',
};

export function buildPatronageBar() {
  const bar = document.getElementById('patronageBar');
  if (!bar) return;

  let html = '';

  // Tab switcher
  html += `<div class="pat-tabs">
    <div class="pat-tab ${_patTab === 'guilds' ? 'active' : ''}" data-pat-tab="guilds">Guilds</div>
    <div class="pat-tab ${_patTab === 'founders' ? 'active' : ''}" data-pat-tab="founders">Founders</div>
  </div>`;

  // Guilds panel
  html += `<div class="pat-panel ${_patTab !== 'guilds' ? 'hidden' : ''}" id="patGuildsPanel">`;
  patronageGuilds.forEach(g => {
    const icon = _guildIcons[g.id] || '🏛';
    const sel = selectedGuildId === g.id ? 'selected' : '';
    html += `<div class="patron-guild-item ${sel}" data-guild="${g.id}">
      <span class="pat-icon">${icon}</span>${g.name}
    </div>`;
  });
  html += '</div>';

  // Founders panel
  html += `<div class="pat-panel ${_patTab !== 'founders' ? 'hidden' : ''}" id="patFoundersPanel">`;
  html += '<div class="pat-founders-list">';
  const chKeys = Object.keys(churchPatrons);
  chKeys.forEach(cid => {
    const p = churchPatrons[cid];
    const ch = churches.find(c => c.id === cid);
    if (!ch) return;
    html += `<div class="pat-founder-row">
      <span class="pat-founder-name">${ch.shortName}</span>
      <span class="pat-founder-detail">${p.founder}</span>
      ${p.order ? `<span class="pat-founder-order">${p.order}</span>` : ''}
    </div>`;
  });
  html += '</div></div>';

  bar.innerHTML = html;

  // Attach tab click handlers
  bar.querySelectorAll('.pat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _patTab = tab.dataset.patTab;
      buildPatronageBar();
    });
  });

  // Attach guild click handlers (single-select)
  bar.querySelectorAll('.patron-guild-item').forEach(item => {
    item.addEventListener('click', () => {
      const gid = item.dataset.guild;
      if (selectedGuildId === gid) {
        setSelectedGuild(null); // deselect
      } else {
        setSelectedGuild(gid);
      }
      buildPatronageBar();
      render();
    });
    // Hover tooltip for guild details
    item.addEventListener('mouseenter', ev => {
      const g = patronageGuilds.find(x => x.id === item.dataset.guild);
      if (!g) return;
      let ttHtml = `<div class="tt-title" style="font-size:11px;margin-bottom:3px;">${g.name}</div>`;
      ttHtml += `<div class="tt-body" style="font-size:10px;margin-bottom:4px;">${g.description}</div>`;
      ttHtml += `<div style="font-size:9px;color:var(--accent);margin-bottom:2px;">Confirmed links:</div>`;
      g.targetsConfirmed.forEach(t => {
        const ch = churches.find(c => c.id === t.churchId);
        ttHtml += `<div style="font-size:9px;color:var(--text-secondary);margin-left:6px;">• ${ch ? ch.shortName : t.churchId}</div>`;
      });
      if (g.targetsPossible && g.targetsPossible.length) {
        ttHtml += `<div style="font-size:9px;color:var(--text-muted);margin-top:3px;">Possible links:</div>`;
        g.targetsPossible.forEach(t => {
          const ch = churches.find(c => c.id === t.churchId);
          ttHtml += `<div style="font-size:9px;color:var(--text-muted);margin-left:6px;font-style:italic;">• ${ch ? ch.shortName : t.churchId}</div>`;
        });
      }
      showGenericTT(ev, ttHtml);
    });
    item.addEventListener('mouseleave', hideTT);
  });
}

export function togglePatronageMode() {
  const newMode = !patronageMode;
  setPatronageMode(newMode);

  const bar = document.getElementById('patronageBar');
  const btn = document.getElementById('patronageToggleBtn');
  if (bar) bar.style.display = newMode ? '' : 'none';
  if (btn) btn.classList.toggle('active', newMode);

  if (newMode) {
    buildPatronageBar();
  }
  render();
}

export function initPatronageToggle() {
  const btn = document.getElementById('patronageToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', togglePatronageMode);
}
