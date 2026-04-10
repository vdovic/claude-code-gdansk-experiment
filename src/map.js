// ═══════════ MAP MODULE ═══════════
// Leaflet interactive map with:
//   • Denomination-coloured markers sized by building height
//   • Historic district polygons (from geodata.js)
//   • Year slider: markers update colour to reflect denomination at chosen year
//   • Sidebar: church list, layer toggles, legend
//   • Syncs with timeline filter (visibleChurches)

import { churches }    from './data/churches.js';
import { districtGeo } from './data/geodata.js';
import { denomColors, denomNames, visibleChurches } from './state.js';
import { openCD }      from './detail.js';

const UNIFICATION_YEAR = 1454;
const UNIFIED_COLOR    = '#8a6d20';  // Main Town gold — represents unified Gdańsk governance

// ── Module state ──────────────────────────────────────────────
let leafletMap   = null;
let mapMarkers   = [];         // markers in same order as churches that exist
let mapMarkerMap = new Map();  // ci → marker
let mapExpanded  = false;
export let mapYear = 1500;

let districtLayerGroup  = null;
let districtLabelsGroup = null;
let showDistricts       = true;
let districtPolygons    = [];
let districtLabelMarkers = [];
let districtVisible     = [];
let _unifiedLabel = null;

let showChurches = true;

// ── Historic map overlay ──────────────────────────────────────
let _historicOverlay    = null;
let _historicOpacity    = 0.45;   // default: 45% opaque
let _showHistoricOverlay = true;  // always on — no toggle
// Geographic bounds for the Kubicki historic church map (street plan of medieval Gdańsk).
// The original 508×768 image was affine-warped (10 church anchors, least-squares) to
// remove ~2° rotation so L.imageOverlay can display it axis-aligned.  Max residual ≈ 68 m.
const HISTORIC_MAP_BOUNDS = [[54.34188, 18.64220], [54.36082, 18.66571]];
const HISTORIC_MAP_SRC    = 'assets/images/historic-churches-map-warped.png';

// ── Denomination helpers ──────────────────────────────────────
export function getDenomAtYear(ch, yr) {
  for (let i = ch.denomBars.length - 1; i >= 0; i--) {
    const b = ch.denomBars[i];
    if (yr >= b.start && yr <= b.end) return b.type;
  }
  return null;
}

// ── Map panel toggle ──────────────────────────────────────────
export function toggleMapPanel() {
  mapExpanded = !mapExpanded;
  const container = document.getElementById('mapContainer');
  const btn       = document.getElementById('mapToggleBtn');
  if (mapExpanded) {
    container.classList.remove('collapsed');
    container.classList.add('expanded');
    if (btn) { btn.textContent = '🔍 Hide Map'; btn.classList.add('active'); }

    // Auto-collapse filters to show map better
    const chrome = document.getElementById('mChrome');
    const chromeBtn = document.getElementById('mChromeToggle');
    if (chrome && chromeBtn && !chrome.classList.contains('collapsed')) {
      chrome.classList.add('collapsed');
      chromeBtn.classList.add('collapsed');
      chromeBtn.textContent = '▶';
    }

    setTimeout(() => {
      if (!leafletMap) _initLeafletMap();
      else leafletMap.invalidateSize();
      renderMap();
    }, 120);
  } else {
    container.classList.add('collapsed');
    container.classList.remove('expanded');
    if (btn) { btn.textContent = '🔍 Show Map'; btn.classList.remove('active'); }
  }
}

export function isMapExpanded() { return mapExpanded; }

// Called by mobile tab switch to force-open map screen
export function openMapForMobile() {
  mapExpanded = true;
  // Move #mapLeaflet element into the fullscreen host
  const mapEl = document.getElementById('mapLeaflet');
  const host  = document.getElementById('scrMapHost');
  if (mapEl && host && mapEl.parentElement !== host) {
    host.appendChild(mapEl);
  }
  if (!leafletMap) {
    setTimeout(() => { _initLeafletMap(); renderMap(); _buildFsOverlay(); }, 200);
  } else {
    setTimeout(() => { leafletMap.invalidateSize(); renderMap(); _buildFsOverlay(); }, 150);
  }
}

// Move #mapLeaflet back to the timeline's collapsible map panel
export function returnMapToTimeline() {
  const mapEl  = document.getElementById('mapLeaflet');
  const wrap   = document.querySelector('#mapContainer .map-leaflet-wrap');
  if (mapEl && wrap && mapEl.parentElement !== wrap) {
    wrap.appendChild(mapEl);
    // If the map panel is expanded on the timeline, resize
    if (leafletMap && mapExpanded) {
      setTimeout(() => leafletMap.invalidateSize(), 100);
    }
  }
}

// ── Compact overlay controls (year + opacity) ────────────────
function _buildFsOverlay() {
  const disp   = document.getElementById('mapYearDisplayFs');
  const slider = document.getElementById('mapYearSliderFs');
  if (disp)   disp.textContent = mapYear;
  if (slider) slider.value     = mapYear;

  // Sync opacity slider
  const pct = Math.round(_historicOpacity * 100);
  const opSlider = document.getElementById('fsHistoricOpacity');
  const opVal    = document.getElementById('fsHistoricOpacityVal');
  if (opSlider) opSlider.value = pct;
  if (opVal)    opVal.textContent = pct + '%';

  // Wire manual touch handlers (bypasses Leaflet entirely on mobile)
  _makeTouchSlider(document.getElementById('mapYearSliderFs'),  'horizontal');
  _makeTouchSlider(document.getElementById('fsHistoricOpacity'), 'vertical');
}

// Completely bypass native range input touch behaviour.
// Leaflet's touch system intercepts touches before the browser's range
// handler fires on mobile. Instead we listen to touch events ourselves,
// compute the new value from finger position, update the input, and
// fire a synthetic 'input' event that the existing listeners pick up.
function _makeTouchSlider(el, orientation) {
  if (!el || el._touchWired) return;
  el._touchWired = true;

  const isVert = orientation === 'vertical';

  function valueFromTouch(touch) {
    const rect = el.getBoundingClientRect();
    const min  = parseFloat(el.min);
    const max  = parseFloat(el.max);
    let ratio;
    if (isVert) {
      // Vertical: top = max, bottom = min (standard vertical slider)
      ratio = 1 - (touch.clientY - rect.top) / rect.height;
    } else {
      ratio = (touch.clientX - rect.left) / rect.width;
    }
    ratio = Math.max(0, Math.min(1, ratio));
    return Math.round(min + ratio * (max - min));
  }

  function applyValue(val) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  el.addEventListener('touchstart', e => {
    e.preventDefault();               // stop Leaflet & scroll
    e.stopPropagation();
    applyValue(valueFromTouch(e.touches[0]));
  }, { passive: false, capture: true });

  el.addEventListener('touchmove', e => {
    e.preventDefault();
    e.stopPropagation();
    applyValue(valueFromTouch(e.touches[0]));
  }, { passive: false, capture: true });

  el.addEventListener('touchend', e => {
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false, capture: true });
}

// ── Leaflet init ──────────────────────────────────────────────
function _initLeafletMap() {
  leafletMap = L.map('mapLeaflet', {
    zoomControl:      false,   // we use our own HTML buttons
    attributionControl: true,
  });

  // Wire our HTML zoom + location buttons
  _wireMapButtons();

  // Muted CartoDB "Positron" tile layer — neutral parchment-like base
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(leafletMap);

  // Fit to Sacred map bounds with 20% padding on all sides
  leafletMap.fitBounds(L.latLngBounds(HISTORIC_MAP_BOUNDS).pad(0.2));

  _initDistrictLayers();
  _initHistoricOverlay();
  buildMapLayerToggles();
}

function _wireMapButtons() {
  // Zoom buttons
  document.getElementById('mapZoomIn')?.addEventListener('click',  () => leafletMap?.zoomIn());
  document.getElementById('mapZoomOut')?.addEventListener('click', () => leafletMap?.zoomOut());

  // Location button
  let locationMarker = null;
  let locationCircle = null;
  const locBtn = document.getElementById('mapLocBtn');
  if (!locBtn) return;

  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    locBtn.classList.add('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        locBtn.classList.remove('locating');
        const latlng = [coords.latitude, coords.longitude];
        if (locationMarker) { locationMarker.remove(); locationCircle.remove(); }
        locationCircle = L.circle(latlng, {
          radius: coords.accuracy, color: '#2a7ae4', weight: 1, fillOpacity: 0.12,
        }).addTo(leafletMap);
        locationMarker = L.circleMarker(latlng, {
          radius: 8, color: '#fff', weight: 2.5,
          fillColor: '#2a7ae4', fillOpacity: 1,
        }).addTo(leafletMap);
        leafletMap.setView(latlng, Math.max(leafletMap.getZoom(), 15));
      },
      () => locBtn.classList.remove('locating'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ── Historic map image overlay ────────────────────────────────
function _initHistoricOverlay() {
  // L.imageOverlay is placed in the overlayPane which participates in
  // Leaflet's zoom animation pipeline, so the image stays synced with
  // tile layers at every zoom level. The `leaflet-zoom-animated` class is
  // auto-added by Leaflet for imageOverlay since v1.0.
  _historicOverlay = L.imageOverlay(HISTORIC_MAP_SRC, HISTORIC_MAP_BOUNDS, {
    opacity: _showHistoricOverlay ? _historicOpacity : 0,
    interactive: false,
    className: 'historic-map-overlay',
    zIndex: 200,
    // Keep the image in sync with map movements/zooms
    bubblingMouseEvents: false,
  });
  _historicOverlay.addTo(leafletMap);
}

export function setHistoricOpacity(val) {
  _historicOpacity = Math.max(0, Math.min(1, val));
  if (_historicOverlay) _historicOverlay.setOpacity(_showHistoricOverlay ? _historicOpacity : 0);
  // Sync opacity display
  const pct = Math.round(_historicOpacity * 100);
  const opVal = document.getElementById('fsHistoricOpacityVal');
  if (opVal) opVal.textContent = pct + '%';
}

// Desktop sidebar still uses this toggle
export function toggleHistoricOverlay() {
  _showHistoricOverlay = !_showHistoricOverlay;
  if (_historicOverlay) _historicOverlay.setOpacity(_showHistoricOverlay ? _historicOpacity : 0);
  buildMapLayerToggles();
}

// ── Marker icon factory ───────────────────────────────────────
function _makeMarkerIcon(color, heightM, origin, status) {
  const s    = Math.max(14, Math.min(28, heightM / 4));
  const half = s / 2;
  let shape;
  if (origin === 'monastic') {
    shape = `<rect x="${half - half * 0.6}" y="${half - half * 0.6}" width="${half * 1.2}" height="${half * 1.2}"
      fill="${color}" stroke="white" stroke-width="2" rx="2" transform="rotate(45,${half},${half})"/>`;
  } else if (origin === 'hospital') {
    shape = `<rect x="${half - half * 0.55}" y="${half - half * 0.55}" width="${half * 1.1}" height="${half * 1.1}"
      fill="${color}" stroke="white" stroke-width="2" rx="3"/>`;
  } else {
    shape = `<circle cx="${half}" cy="${half}" r="${half * 0.55}" fill="${color}" stroke="white" stroke-width="2"/>`;
  }
  const ring = status === 'basilica'
    ? `<circle cx="${half}" cy="${half}" r="${half * 0.8}" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>`
    : '';
  const svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${ring}${shape}</svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [s, s], iconAnchor: [half, half], popupAnchor: [0, -half - 2] });
}

// ── Main map render ───────────────────────────────────────────
export function renderMap() {
  if (!leafletMap) return;

  // Update district visibility for current year
  _updateDistrictYearVisibility();

  // Clear old markers
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers   = [];
  mapMarkerMap = new Map();

  // Skip rendering churches if layer is disabled
  if (!showChurches) {
    renderMapSidebar();
    return;
  }

  churches.forEach((ch, ci) => {
    const founded = ch.events.find(e => e.type === 'founded');
    if (!founded || mapYear < founded.year) return;   // not yet founded

    const vis   = visibleChurches.has(ch.id);
    const denom = getDenomAtYear(ch, mapYear);
    const color = denom ? (denomColors[denom] || '#8a8070') : '#8a8070';
    const icon  = _makeMarkerIcon(color, ch.height, ch.origin, ch.status);

    const marker = L.marker([ch.lat, ch.lon], {
      icon,
      opacity:      vis ? 0.9 : 0.5,
      zIndexOffset: vis ? 100 : 0,
    }).addTo(leafletMap);

    const denomLabel = denom ? (denomNames[denom] || denom) : '—';
    marker.bindTooltip(
      `<b>${ch.shortName}</b><br><span style="font-size:10px;opacity:0.7">${denomLabel} in ${mapYear}</span>`,
      { direction: 'top', offset: [0, -Math.max(7, ch.height / 8)], opacity: 0.95 }
    );

    marker.on('click', () => openCD(ci, 0));

    mapMarkers.push(marker);
    mapMarkerMap.set(ci, marker);
  });

  renderMapSidebar();
}

export function renderMapSidebar() {
  const list = document.getElementById('mapChurchList');
  if (!list) return;
  let html = '';
  churches.forEach((ch, ci) => {
    const vis     = visibleChurches.has(ch.id);
    const denom   = getDenomAtYear(ch, mapYear);
    const founded = ch.events.find(e => e.type === 'founded');
    const exists  = founded && mapYear >= founded.year;
    const color   = denom ? (denomColors[denom] || '#8a8070') : '#8a8070';
    html += `<div class="map-church-item ${vis ? '' : 'hidden'}" data-ci="${ci}">
      <div class="map-church-dot" style="background:${exists ? color : 'transparent'};border-color:${exists ? color : '#5a4a2a'}"></div>
      <div>
        <div class="map-church-name">${ch.shortName}</div>
        <div class="map-church-meta">${exists ? (denom ? denomNames[denom] : '—') : 'Not yet founded'} · ${ch.height}m</div>
      </div>
    </div>`;
  });
  list.innerHTML = html;

  list.querySelectorAll('.map-church-item').forEach(el => {
    const ci = +el.dataset.ci;
    el.addEventListener('click',       () => flyToChurch(ci));
    el.addEventListener('mouseenter',  () => pulseMarker(ci));
    el.addEventListener('mouseleave',  () => unpulseMarker(ci));
  });
}

export function setMapYear(yr) {
  mapYear = yr;
  const disp   = document.getElementById('mapYearDisplay');
  const slider = document.getElementById('mapYearSlider');
  const dispFs   = document.getElementById('mapYearDisplayFs');
  const sliderFs = document.getElementById('mapYearSliderFs');
  if (disp)     disp.textContent = yr;
  if (slider)   slider.value = yr;
  if (dispFs)   dispFs.textContent = yr;
  if (sliderFs) sliderFs.value = yr;
  renderMap();
}

export function flyToChurch(ci) {
  const ch = churches[ci];
  if (leafletMap) leafletMap.flyTo([ch.lat, ch.lon], 16, { duration: 0.8 });
  openCD(ci, 0);
}

export function pulseMarker(ci) {
  const m = mapMarkerMap.get(ci);
  if (!m) return;
  m.setZIndexOffset(1000);
  const el = m.getElement();
  if (el) el.style.filter = 'brightness(1.3) drop-shadow(0 0 6px rgba(200,134,10,0.5))';
}

export function unpulseMarker(ci) {
  const m   = mapMarkerMap.get(ci);
  const vis = visibleChurches.has(churches[ci].id);
  if (!m) return;
  m.setZIndexOffset(vis ? 100 : 0);
  const el = m.getElement();
  if (el) el.style.filter = '';
}


export function toggleChurchesLayer() {
  showChurches = !showChurches;
  renderMap();
  buildMapLayerToggles();
}

// ── District layers ───────────────────────────────────────────
function _getCentroid(coords) {
  let latSum = 0, lonSum = 0;
  coords.forEach(c => { latSum += c[0]; lonSum += c[1]; });
  return [latSum / coords.length, lonSum / coords.length];
}

function _initDistrictLayers() {
  districtLayerGroup   = L.layerGroup();
  districtLabelsGroup  = L.layerGroup();
  districtPolygons     = [];
  districtLabelMarkers = [];
  districtVisible      = [];

  districtGeo.forEach(d => {
    const poly = L.polygon(d.coords, {
      color: d.color, weight: 1.5, opacity: 0.6,
      fillColor: d.color, fillOpacity: 0.08, dashArray: '4,3',
    });
    const dissolved = d.dissolved ? ` · Dissolved: ${d.dissolved}` : '';
    poly.bindPopup(
      `<div class="mp-name" style="color:${d.color}">${d.name}</div>
       <div class="mp-meta">Founded: ~${d.founded}${dissolved}</div>
       <div style="font-size:10px;color:var(--ink-lt);margin-top:3px;max-height:120px;overflow-y:auto;">${d.note.substring(0, 300)}…</div>`,
      { maxWidth: 260 }
    );
    districtPolygons.push(poly);

    // Label at centroid
    const centroid = _getCentroid(d.coords);
    const label = L.marker(centroid, {
      icon: L.divIcon({
        className: '',
        html: `<div style="font-family:'Inter',-apple-system,system-ui,sans-serif;font-size:10px;color:${d.color};
          text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;
          text-shadow:1px 1px 2px rgba(247,242,232,0.9),-1px -1px 2px rgba(247,242,232,0.9);
          opacity:0.75;pointer-events:none;transform:translate(-50%,-50%)">${d.shortName}</div>`,
        iconSize: [0, 0], iconAnchor: [0, 0],
      }),
      interactive: false,
    });
    districtLabelMarkers.push(label);
    districtVisible.push(true);
  });

  _unifiedLabel = L.marker([54.352, 18.652], {
    icon: L.divIcon({
      className: '',
      html: `<div style="font-family:'Cinzel',Georgia,serif;font-size:11px;font-weight:600;color:${UNIFIED_COLOR};text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;text-shadow:1px 1px 3px rgba(247,242,232,0.95),-1px -1px 3px rgba(247,242,232,0.95);pointer-events:none;transform:translate(-50%,-50%);opacity:0.9;background:rgba(247,242,232,0.65);padding:2px 7px;border-radius:3px;border:1px solid rgba(138,109,32,0.3);">✦ Unified Gdańsk</div>`,
      iconSize: [0, 0], iconAnchor: [0, 0],
    }),
    interactive: false,
  });

  _updateDistrictYearVisibility();
  districtLayerGroup.addTo(leafletMap);
  districtLabelsGroup.addTo(leafletMap);
}

// Show/hide each district polygon based on mapYear vs. founded/dissolved dates.
// After 1454 (unification) district borders are hidden entirely — the city became
// one legal entity under the Main Town council.
function _updateDistrictYearVisibility() {
  if (!districtLayerGroup) return;
  const unified = mapYear >= UNIFICATION_YEAR;

  districtGeo.forEach((d, i) => {
    const exists = mapYear >= d.founded && (!d.dissolved || mapYear <= d.dissolved);
    // After unification, hide all district polygons regardless of showDistricts flag
    const on = exists && showDistricts && districtVisible[i] && !unified;
    if (on) {
      districtLayerGroup.addLayer(districtPolygons[i]);
      districtLabelsGroup.addLayer(districtLabelMarkers[i]);
      districtPolygons[i].setStyle({
        color: d.color, weight: 1.5, opacity: 0.6,
        fillColor: d.color, fillOpacity: 0.08, dashArray: '4,3',
      });
    } else {
      districtLayerGroup.removeLayer(districtPolygons[i]);
      districtLabelsGroup.removeLayer(districtLabelMarkers[i]);
    }
  });

  // No unified label either — the sacred topography overlay speaks for itself
  if (_unifiedLabel) {
    districtLabelsGroup.removeLayer(_unifiedLabel);
  }
}

export function toggleDistrictLayer() {
  showDistricts = !showDistricts;
  _updateDistrictYearVisibility();
  buildMapLayerToggles();
}

export function toggleSingleDistrict(idx) {
  if (!districtPolygons[idx]) return;
  districtVisible[idx] = !districtVisible[idx];
  _updateDistrictYearVisibility();
  buildMapLayerToggles();
}

export function buildMapLayerToggles() {
  const el = document.getElementById('mapLayerToggles');
  if (!el) return;

  const unified = mapYear >= UNIFICATION_YEAR;
  const allOn   = showChurches && showDistricts;

  // ── Standard layers section ──────────────────────────────────
  let html = `<div class="map-layer-toggle ${allOn ? 'on' : ''}" id="masterToggleAll" style="font-weight:700;border-bottom:1px solid var(--border-color);padding-bottom:8px;margin-bottom:8px;">
    <div class="map-layer-cb">${allOn ? '✓' : ''}</div>
    <div class="map-layer-name">All Layers</div>
  </div>`;

  html += `<div class="map-layer-toggle ${showChurches ? 'on' : ''}" id="churchesToggleAll">
    <div class="map-layer-swatch" style="background:#d4a574;border-radius:50%"></div>
    <div class="map-layer-name">Churches & Chapels
      <span style="font-size:8px;color:var(--text-muted);">(${churches.length})</span>
    </div>
  </div>`;

  // Districts: only show toggle when before unification
  if (!unified) {
    html += `<div class="map-layer-toggle ${showDistricts ? 'on' : ''}" id="districtToggleAll">
      <div class="map-layer-cb">${showDistricts ? '✓' : ''}</div>
      <div class="map-layer-name">Historic Districts</div>
    </div>`;
    if (showDistricts) {
      districtGeo.forEach((d, i) => {
        const on = districtVisible[i] !== false;
        const existsNow = mapYear >= d.founded && (!d.dissolved || mapYear <= d.dissolved);
        const dateStr = d.dissolved ? `${d.founded}–${d.dissolved}` : `${d.founded}–`;
        html += `<div class="map-layer-toggle ${on && existsNow ? 'on' : ''} district-toggle-single" data-idx="${i}"
          style="padding-left:18px;${existsNow ? '' : 'opacity:0.4'}">
          <div class="map-layer-swatch" style="background:${d.color};${(on && existsNow) ? '' : 'opacity:0.25'}"></div>
          <div class="map-layer-name" style="${(on && existsNow) ? '' : 'opacity:0.4'}">${d.shortName} <span style="font-size:8px;color:var(--text-muted);">(${dateStr})</span></div>
        </div>`;
      });
    }
  } else {
    html += `<div style="margin-top:4px;padding:3px 6px;background:rgba(138,109,32,0.10);border-radius:4px;font-size:9px;color:${UNIFIED_COLOR};border:1px solid rgba(138,109,32,0.2);">✦ Districts merged under unified charter, ${UNIFICATION_YEAR}</div>`;
  }

  el.innerHTML = html;

  // ── Sacred Topography block — injected into its own dedicated host ────
  _buildSacredTopoBlock();

  // Event listeners
  document.getElementById('masterToggleAll')?.addEventListener('click', () => {
    const allCurrentlyOn = showChurches && showDistricts;
    showChurches = showDistricts = !allCurrentlyOn;
    _updateDistrictYearVisibility();
    renderMap();
    buildMapLayerToggles();
  });
  document.getElementById('churchesToggleAll')?.addEventListener('click', toggleChurchesLayer);
  document.getElementById('districtToggleAll')?.addEventListener('click', toggleDistrictLayer);
  el.querySelectorAll('.district-toggle-single').forEach(el2 => {
    el2.addEventListener('click', () => toggleSingleDistrict(+el2.dataset.idx));
  });
}

// Builds the prominent Sacred Topography control block (desktop sidebar)
function _buildSacredTopoBlock() {
  const host = document.getElementById('sacredTopoBlock');
  if (!host) return;
  const pct = Math.round(_historicOpacity * 100);
  const on  = _showHistoricOverlay;
  host.innerHTML = `
    <div class="sacred-topo-toggle ${on ? 'on' : ''}" id="sacredTopoToggle">
      <div class="sacred-topo-icon">${on ? '◉' : '○'}</div>
      <div class="sacred-topo-label">Sacred Topography of Gdańsk, c. 1500</div>
    </div>
    <div class="sacred-topo-opacity ${on ? '' : 'disabled'}">
      <div class="sacred-topo-opacity-row">
        <span class="sacred-topo-opacity-label">Overlay opacity</span>
        <span class="sacred-topo-opacity-val" id="sacredTopoOpacityVal">${pct}%</span>
      </div>
      <input type="range" id="sacredTopoSlider" min="0" max="100" value="${pct}"
        class="sacred-topo-slider" ${on ? '' : 'disabled'}>
    </div>`;

  document.getElementById('sacredTopoToggle')?.addEventListener('click', () => {
    toggleHistoricOverlay();
    _buildSacredTopoBlock();   // toggleHistoricOverlay calls buildMapLayerToggles which calls this
  });
  document.getElementById('sacredTopoSlider')?.addEventListener('input', e => {
    setHistoricOpacity(e.target.value / 100);
    const v = document.getElementById('sacredTopoOpacityVal');
    if (v) v.textContent = e.target.value + '%';
  });
}
