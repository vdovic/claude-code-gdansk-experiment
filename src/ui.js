// ═══════════ UI MODULE ═══════════
// Controls, filter chips, track toggles,
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
  patronageMode, setPatronageMode,
} from './state.js';
import { churchPatrons } from './data/patronage.js';
import { render }        from './render.js';
import { renderMap, openMapForMobile, returnMapToTimeline, setMapYear, isMapExpanded } from './map.js';
import { closePanel }    from './detail.js';
import { hideTT, showGenericTT } from './tooltip.js';
import { eventShapes, eventMarkerSVG, eventColors, ctxMarkerSVG } from './theme.js';

// ── Legend panel ──────────────────────────────────────────────

/** Inline HTML for a global-context marker shape (used in legend). */
function _ctxShapeHtml(shape, color) {
  const base = `flex-shrink:0;`;
  switch (shape) {
    case 'bar-ruler':
      return `<div style="${base}width:22px;height:5px;border-radius:2px;background:${color};opacity:0.85;"></div>`;
    case 'bar-war':
      return `<div style="${base}width:22px;height:5px;border-radius:2px;background:${color};opacity:0.85;"></div>`;
    case 'diamond':
      return `<div style="${base}width:9px;height:9px;transform:rotate(45deg);border:2px solid ${color};border-radius:1px;background:transparent;"></div>`;
    case 'star':
      return `<svg width="12" height="12" viewBox="0 0 12 12" style="flex-shrink:0"><polygon points="6,0.5 7.5,4 11.5,4.5 8.5,7 9.5,11 6,9 2.5,11 3.5,7 0.5,4.5 4.5,4" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    case 'triangle':
      return `<div style="${base}width:10px;height:10px;clip-path:polygon(0% 0%,100% 0%,50% 100%);border:2px solid ${color};background:transparent;"></div>`;
    case 'triangle-outline':
      return `<svg width="11" height="11" viewBox="0 0 11 11" style="flex-shrink:0"><polygon points="5.5,0.5 10.5,10.5 0.5,10.5" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    case 'triangle-up-outline':
      return ctxMarkerSVG('fires', color, 10);
    case 'raindrop-outline':
      return ctxMarkerSVG('floods', color, 10);
    case 'hexagon-outline':
      return `<svg width="11" height="11" viewBox="0 0 11 11" style="flex-shrink:0"><polygon points="5.5,0.5 10.2,2.75 10.2,8.25 5.5,10.5 0.8,8.25 0.8,2.75" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    case 'circle':
      return `<div style="${base}width:10px;height:10px;border-radius:50%;background:${color};opacity:0.9;"></div>`;
    case 'square':
      return `<div style="${base}width:9px;height:9px;border-radius:2px;background:${color};opacity:0.9;"></div>`;
    default: return '';
  }
}

export function renderLegend() {
  // Populate the Legend panel (right-side collapsible)
  const globalEl = document.getElementById('legendGlobal');
  const eventsEl = document.getElementById('legendEvents');
  const denomsEl = document.getElementById('legendDenoms');
  if (!eventsEl || !denomsEl) return;

  // ── Global Events section ────────────────────────────────────
  if (globalEl) {
    // Flat items (single shape + color per track — no sub-categories)
    const globalItems = [
      { shape: 'bar-ruler', color: 'rgba(212,162,83,0.45)', label: 'Kings & Rulers',
        desc: 'Named ruler periods shown as horizontal bands above the timeline' },
      { shape: 'bar-war',   color: 'rgba(160,64,64,0.75)',  label: 'Wars & Conflicts',
        desc: 'Armed conflicts and sieges affecting Gdańsk — all shown in the same red' },
      { shape: 'diamond',   color: 'var(--ctx-political-marker)', label: 'Political Events',
        desc: 'Key political milestones: treaties, incorporations, annexations, rebellions' },
      { shape: 'triangle-outline',     color: 'var(--ctx-plague-marker)', label: 'Pandemics & Epidemics',
        desc: 'Plague, cholera and epidemic outbreaks with major demographic impact' },
      { shape: 'triangle-up-outline',  color: 'var(--ctx-fire-marker)',   label: 'Great Fires',
        desc: 'Major fires that caused widespread destruction across Gdańsk' },
      { shape: 'raindrop-outline',     color: 'var(--ctx-flood-marker)',  label: 'Devastating Floods',
        desc: 'Catastrophic Vistula flood events that inundated the city' },
      { shape: 'hexagon-outline',  color: 'var(--ctx-urban-marker)', label: 'Urban Power',
        desc: 'Municipal governance changes: law grants, privileges, council shifts' },
    ];

    // Religious Events: star outline, colour = denomination of the event
    const relItems = [
      { color: 'var(--ctx-religious-marker)', label: 'Religious — General',
        desc: 'Ecumenical councils, broad ecclesiastical shifts' },
      { color: 'var(--catholic)',  label: 'Religious — Catholic',
        desc: 'Events tied to the Catholic Church or Counter-Reformation' },
      { color: 'var(--lutheran)',  label: 'Religious — Lutheran',
        desc: 'Events tied to the Lutheran Reformation or Protestant governance' },
      { color: 'var(--calvinist)', label: 'Religious — Calvinist',
        desc: 'Events tied to the Reformed (Calvinist) congregation in Gdańsk' },
    ];

    globalEl.innerHTML =
      globalItems.map(g =>
        `<div class="legend-item" tabindex="0" aria-label="${g.label}: ${g.desc}">
          <div class="legend-item-shape" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;">${_ctxShapeHtml(g.shape, g.color)}</div>
          <span>${g.label}</span>
          <div class="legend-item-desc">${g.desc}</div>
        </div>`
      ).join('') +
      `<div class="legend-item-micro-title">Religious Events (star = denomination colour)</div>` +
      relItems.map(r =>
        `<div class="legend-item" tabindex="0" aria-label="${r.label}: ${r.desc}">
          <div class="legend-item-shape" style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;">${_ctxShapeHtml('star', r.color)}</div>
          <span>${r.label}</span>
          <div class="legend-item-desc">${r.desc}</div>
        </div>`
      ).join('');
  }

  // ── Church-related event markers ────────────────────────────
  // Shape indicators and tooltip descriptions
  const shapeEntries = Object.entries(eventShapes);
  eventsEl.innerHTML = shapeEntries.map(([type, info]) => {
    const color = eventColors[type] || 'var(--accent)';
    const shapeSvg = eventMarkerSVG(type, color, 12);
    return `<div class="legend-item" tabindex="0" role="button" aria-label="${info.label}: ${info.desc}">
      <div class="legend-item-shape">${shapeSvg}</div>
      <div class="legend-item-icon"><div style="background:${color};width:8px;height:4px;border-radius:2px;opacity:0.7;"></div></div>
      <span>${info.label}</span>
      <div class="legend-item-desc">${info.desc}</div>
    </div>`;
  }).join('');

  // Denomination colours
  const denoms = [
    { key: 'catholic',  label: 'Catholic',
      desc: 'Original confession; dominant until the 1557 Reformation, restored post-1945' },
    { key: 'lutheran',  label: 'Lutheran',
      desc: 'Dominant from 1557 until 1945; most Old Town churches converted at the Reformation' },
    { key: 'calvinist', label: 'Calvinist',
      desc: 'Reformed (Calvinist) minority; two churches permitted by royal decree from 1651' },
    { key: 'armenian',  label: 'Armenian',
      desc: 'Armenian Catholic rite; maintained at Ss. Peter & Paul 1817–1835' },
    { key: 'secular',   label: 'Secular',
      desc: 'No active religious use — museum, concert hall, archive, or ruin' },
  ];
  denomsEl.innerHTML = denoms.map(d =>
    `<div class="legend-item" tabindex="0" aria-label="${d.label}: ${d.desc}">
      <div class="legend-item-swatch" style="background:var(--${d.key})"></div>
      <span>${d.label}</span>
      <div class="legend-item-desc">${d.desc}</div>
    </div>`
  ).join('');
}

export function initLegendPanel() {
  const btn   = document.getElementById('legendToggleBtn');
  const panel = document.getElementById('legendPanel');
  const close = document.getElementById('legendPanelClose');
  if (!btn || !panel) return;

  function toggleLegend() { panel.classList.toggle('collapsed'); }

  // Start collapsed on mobile; open by default on desktop
  // Use 900px to match the app's desktop/mobile breakpoint
  if (window.innerWidth <= 900) panel.classList.add('collapsed');

  btn.addEventListener('click', toggleLegend);
  // Keyboard: Enter/Space on legend toggle
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLegend(); }
  });

  close?.addEventListener('click', () => panel.classList.add('collapsed'));

  // Close when clicking outside — but NOT when interacting with the view-mode
  // toggle or any other timeline controls (those should never close the legend)
  document.addEventListener('click', e => {
    if (panel.classList.contains('collapsed')) return;
    if (panel.contains(e.target)) return;
    if (e.target === btn) return;
    // Keep legend open when user clicks the view-mode pill, timeline controls, or overlays
    if (e.target.closest('#viewModeRow, #viewModeToggle, .pill-btn, .pill-toggle, #controlsBar, #trackToggles, .filter-bar, #churchControls, .onb-overlay, .kb-overlay')) return;
    panel.classList.add('collapsed');
  });

  // Keyboard: Escape closes legend
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.classList.contains('collapsed')) {
      panel.classList.add('collapsed');
      btn.focus();
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
  selAll?.addEventListener('click', e => { e.stopPropagation(); selectAllChurches(); buildChurchBar(); render(); renderMap(); });
  selNone?.addEventListener('click', e => { e.stopPropagation(); deselectAllChurches(); buildChurchBar(); render(); renderMap(); });

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
    { k: 'plagues',    l: 'Pandemics, Floods & Fires' },
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

export function updateViewRangeLabel() {
  // Show/hide ⟲ Full reset button whenever view range differs from global
  const resetBtn = document.getElementById('btnResetRange');
  if (resetBtn) {
    const isNarrowed = viewStart > START_YEAR || viewEnd < END_YEAR;
    resetBtn.style.display = isNarrowed ? '' : 'none';
  }
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
  localStorage.setItem('chromeCollapsed', isCollapsed ? '1' : '0');
}

// ── Mobile tab switching ──────────────────────────────────────
let _currentMobileTab = 'timeline';
export function getCurrentTab() { return _currentMobileTab; }

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
      else { _handleFilterChipClick(act); render(); renderMap(); }
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

// ── Focus on Churches toggle ─────────────────────────────────
let _focusChurches = false;

export function toggleFocusChurches() {
  _focusChurches = !_focusChurches;
  document.body.classList.toggle('focus-churches', _focusChurches);
  const btn = document.getElementById('focusChurchesBtn');
  if (btn) btn.classList.toggle('active', _focusChurches);
  // Also toggle all tracks off/on
  if (_focusChurches) {
    allTracksOff();
  } else {
    allTracksOn();
  }
  buildTrackToggles();
  render();
}

export function initFocusChurches() {
  const btn = document.getElementById('focusChurchesBtn');
  if (!btn) return;
  btn.addEventListener('click', toggleFocusChurches);
  // On mobile first load, auto-collapse overlays for church visibility
  if (window.innerWidth <= 768) {
    _focusChurches = true;
    document.body.classList.add('focus-churches');
    btn.classList.add('active');
    allTracksOff();
  }
}

// ── Mobile Bottom Sheet ──────────────────────────────────────
let _bottomSheetOpen = false;
let _bottomSheetTab  = 'churches';

function _buildBsChurchListHtml(query = '') {
  const q = query.toLowerCase().trim();
  const churchesByDistrict = {};
  district1450Names.forEach(d => { churchesByDistrict[d] = []; });
  churches.forEach(c => {
    const d = district1450ByChurchId[c.id] || 'Unknown';
    if (churchesByDistrict[d]) churchesByDistrict[d].push(c);
  });
  let html = '';
  district1450Names.forEach(district => {
    const dc = churchesByDistrict[district] || [];
    const visible = dc.filter(c => !q || c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q));
    if (q && visible.length === 0) return;
    const allSel = visible.every(c => visibleChurches.has(c.id));
    const noneSel = visible.every(c => !visibleChurches.has(c.id));
    const indet = !allSel && !noneSel;
    // Each district is a single row: name label on the left, items flowing to the right
    html += `<div class="church-district-row">`;
    html += `<div class="church-district-header" data-district="${district}">
      <div class="church-district-checkbox ${allSel ? 'on' : ''} ${indet ? 'indeterminate' : ''}" data-action="selectDistrict:${district}"></div>
      <span class="church-district-label">${district}</span>
    </div>`;
    html += `<div class="church-district-items">`;
    visible.forEach(c => {
      const on = visibleChurches.has(c.id);
      html += `<div class="church-selector-item ${on ? 'on' : ''}" data-action="church:${c.id}">
        <div class="church-selector-cb">${on ? '✓' : ''}</div>
        <span>${c.shortName}</span>
      </div>`;
    });
    html += `</div></div>`;
  });
  return html;
}

export function initBottomSheet() {
  const trigger = document.getElementById('bottomSheetTrigger');
  const overlay = document.getElementById('bottomSheetOverlay');
  const sheet   = document.getElementById('bottomSheet');
  if (!trigger || !overlay || !sheet) return;

  function openSheet() {
    _bottomSheetOpen = true;
    overlay.classList.add('open');
    sheet.classList.add('open');
    _buildBottomSheetContent();
  }
  function closeSheet() {
    _bottomSheetOpen = false;
    overlay.classList.remove('open');
    sheet.classList.remove('open');
  }

  trigger.addEventListener('click', () => {
    if (_bottomSheetOpen) closeSheet(); else openSheet();
    // Fade out the "Sort & Filter" hint label after first click — stays gone for the session
    const lbl = trigger.previousElementSibling;
    if (lbl) lbl.style.opacity = '0';
  });
  overlay.addEventListener('click', closeSheet);

  // Tab switching + action delegation
  sheet.addEventListener('click', e => {
    const tab = e.target.closest('.bottom-sheet-tab');
    if (tab) {
      _bottomSheetTab = tab.dataset.bsTab;
      _buildBottomSheetContent();
    }
    // Handle ANY element with data-action: filter chips, church items,
    // district checkboxes, Select-all/none — all route through the same handler
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      _handleBottomSheetAction(actionEl.dataset.action);
      _buildBottomSheetContent();
      render();
      renderMap();
      buildFilterChips();
      buildChurchBar();
      buildTrackToggles();
    }
  });

  // Search inputs
  sheet.addEventListener('input', e => {
    if (e.target.id === 'bsSearchInput') {
      import('./main.js').then(m => m.searchEvents(e.target.value)).catch(() => {});
    }
    if (e.target.id === 'bsChurchSearch') {
      const list = document.getElementById('bsChurchList');
      if (list) list.innerHTML = _buildBsChurchListHtml(e.target.value);
    }
  });

  // Touch drag to dismiss
  let touchStartY = 0;
  const handle = sheet.querySelector('.bottom-sheet-handle');
  if (handle) {
    handle.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    handle.addEventListener('touchmove', e => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 0) sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    handle.addEventListener('touchend', e => {
      const dy = (e.changedTouches?.[0]?.clientY || 0) - touchStartY;
      sheet.style.transform = '';
      if (dy > 80) closeSheet();
    }, { passive: true });
  }
}

function _handleBottomSheetAction(action) {
  const colonIdx = action.indexOf(':');
  const type   = colonIdx === -1 ? action : action.slice(0, colonIdx);
  const rawVal = colonIdx === -1 ? '' : action.slice(colonIdx + 1);

  switch (type) {
    case 'status':   _exclusiveToggle(statusFilters, rawVal, false); applyFilters(); break;
    case 'origin':   _exclusiveToggle(originFilters, rawVal, false); applyFilters(); break;
    case 'cluster':  _exclusiveToggle(clusterFilters, rawVal, false); applyFilters(); break;
    case 'clearAll': clearAllFilters(); break;
    case 'selectAll':  selectAllChurches(); break;
    case 'deselectAll':deselectAllChurches(); break;
    case 'church':   toggleChurch(rawVal); break;
    case 'selectDistrict': {
      const dc = churches.filter(c => district1450ByChurchId[c.id] === rawVal);
      const allSel = dc.every(c => visibleChurches.has(c.id));
      dc.forEach(c => { if (allSel ? visibleChurches.has(c.id) : !visibleChurches.has(c.id)) toggleChurch(c.id); });
      break;
    }
    case 'track':    toggleTrack(rawVal); break;
    case 'allTracksOn':  allTracksOn(); break;
    case 'allTracksOff': allTracksOff(); break;
    case 'sort':     setSort(rawVal); break;
  }
}

function _buildBottomSheetContent() {
  const sheet = document.getElementById('bottomSheet');
  if (!sheet) return;

  // Update tab states
  sheet.querySelectorAll('.bottom-sheet-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.bsTab === _bottomSheetTab);
  });

  const content = sheet.querySelector('.bottom-sheet-content');
  if (!content) return;

  let html = '';

  if (_bottomSheetTab === 'tracks') {
    html += '<div class="bottom-sheet-section"><div class="bottom-sheet-section-title">Context Tracks</div><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    const allOn = Object.values(trackVisibility).every(Boolean);
    const noneOn = Object.values(trackVisibility).every(v => !v);
    html += `<div class="filter-chip ${allOn ? 'on' : ''}" data-action="allTracksOn"><div class="chip-dot"></div>All</div>`;
    html += `<div class="filter-chip ${noneOn ? 'on' : ''}" data-action="allTracksOff"><div class="chip-dot"></div>None</div>`;
    const tracks = [
      { k: 'econEras', l: 'Periods' }, { k: 'rulers', l: 'Kings/Rulers' },
      { k: 'wars', l: 'Wars' }, { k: 'political', l: 'Political' },
      { k: 'religious', l: 'Religious' }, { k: 'plagues', l: 'Pandemics, Floods & Fires' },
      { k: 'urbanPower', l: 'Urban Power' }, { k: 'population', l: 'Population' },
      { k: 'grain', l: 'Grain Export' },
    ];
    tracks.forEach(t => {
      html += `<div class="filter-chip ${trackVisibility[t.k] ? 'on' : ''}" data-action="track:${t.k}"><div class="chip-dot"></div>${t.l}</div>`;
    });
    html += '</div></div>';
  } else if (_bottomSheetTab === 'churches') {
    html += `<div class="bottom-sheet-section">
      <div class="bottom-sheet-section-title">Churches</div>
      <div class="bs-church-selector">
        <input type="text" id="bsChurchSearch" class="church-selector-search" placeholder="Search churches…" autocomplete="off" style="width:100%;box-sizing:border-box;margin-bottom:6px;">
        <div class="church-selector-actions">
          <span class="church-selector-act" data-action="selectAll">Select all</span>
          <span class="church-selector-act" data-action="deselectAll">Select none</span>
        </div>
        <div class="church-selector-list bs-church-list" id="bsChurchList">${_buildBsChurchListHtml()}</div>
      </div>
    </div>`;

    // Filters section
    html += '<div class="bottom-sheet-section"><div class="bottom-sheet-section-title">Status</div><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    [{ k: 'cathedral', l: 'Cathedral' }, { k: 'basilique', l: 'Basilica' }, { k: 'church', l: 'Church' }]
      .forEach(s => { html += `<div class="filter-chip ${statusFilters.has(s.k) ? 'on' : ''}" data-action="status:${s.k}"><div class="chip-dot"></div>${s.l}</div>`; });
    html += '</div></div>';

    html += '<div class="bottom-sheet-section"><div class="bottom-sheet-section-title">Type</div><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    [{ k: 'parish', l: 'Parish' }, { k: 'monastic', l: 'Monastic' }, { k: 'hospital', l: 'Hospital' }]
      .forEach(o => { html += `<div class="filter-chip ${originFilters.has(o.k) ? 'on' : ''}" data-action="origin:${o.k}"><div class="chip-dot"></div>${o.l}</div>`; });
    html += '</div></div>';

    html += '<div class="bottom-sheet-section"><div class="bottom-sheet-section-title">Size</div><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    [{ k: 'A', l: 'Large' }, { k: 'B', l: 'Medium' }, { k: 'C', l: 'Small' }]
      .forEach(s => { html += `<div class="filter-chip ${clusterFilters.has(s.k) ? 'on' : ''}" data-action="cluster:${s.k}"><div class="chip-dot"></div>${s.l}</div>`; });
    html += '</div></div>';

    const hasAny = statusFilters.size || originFilters.size || clusterFilters.size;
    if (hasAny) {
      html += `<div class="bottom-sheet-section"><div style="display:flex;flex-wrap:wrap;gap:5px;"><div class="filter-chip" data-action="clearAll" style="border-color:var(--ev-destroyed);color:var(--ev-destroyed)"><div class="chip-dot" style="background:var(--ev-destroyed);opacity:1"></div>Clear all</div></div></div>`;
    }
  } else if (_bottomSheetTab === 'sort') {
    html += '<div class="bottom-sheet-section"><div class="bottom-sheet-section-title">Sort By</div><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    const sorts = [
      { k: 'cornerstone', l: 'Cornerstone' }, { k: 'established', l: 'Established' },
      { k: 'height', l: 'Height' }, { k: 'capacity', l: 'Capacity' },
      { k: 'distance', l: 'Dist. St.Mary' }, { k: 'catholicism', l: 'Catholicism' },
    ];
    sorts.forEach(s => {
      html += `<div class="filter-chip ${currentSort === s.k ? 'on' : ''}" data-action="sort:${s.k}"><div class="chip-dot"></div>${s.l}</div>`;
    });
    html += '</div></div>';
  } else if (_bottomSheetTab === 'search') {
    html += `<div class="bottom-sheet-section">
      <div class="bottom-sheet-section-title">Search Events</div>
      <input type="text" id="bsSearchInput" placeholder="Search churches, events..." autocomplete="off"
        style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--border-emphasis);
        background:rgba(255,255,255,0.04);color:var(--text-primary);font-family:var(--font-ui);font-size:var(--fs-base);outline:none;">
    </div>`;
  }

  content.innerHTML = html;
}

// ── Founders & Guilds Panel ──────────────────────────────────

let _patTab = 'founders'; // 'founders' | 'guilds'

export function buildPatronageBar() {
  const bar = document.getElementById('patronageBar');
  if (!bar) return;

  let html = '';

  // Tab switcher
  html += `<div class="pat-tabs">
    <div class="pat-tab ${_patTab === 'founders' ? 'active' : ''}" data-pat-tab="founders">Founders</div>
    <div class="pat-tab ${_patTab === 'guilds' ? 'active' : ''}" data-pat-tab="guilds">Guilds</div>
  </div>`;

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

  // Guilds panel — informational list, church → associated guilds
  html += `<div class="pat-panel ${_patTab !== 'guilds' ? 'hidden' : ''}" id="patGuildsPanel">`;
  html += '<div class="pat-founders-list">';
  churches.forEach(ch => {
    if (!ch.guilds || !ch.guilds.length) return;
    html += `<div class="pat-founder-row">
      <span class="pat-founder-name">${ch.shortName}</span>
      <span class="pat-founder-detail">${ch.guilds.join(', ')}</span>
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
  // No render() call — panel is informational only, doesn't filter the timeline
}

export function initPatronageToggle() {
  const btn = document.getElementById('patronageToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', togglePatronageMode);
}
