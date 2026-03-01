// ═══════════ MAP MODULE ═══════════
// Leaflet interactive map with:
//   • Denomination-coloured markers sized by building height
//   • Historic district polygons (from geodata.js)
//   • Year slider: markers update colour to reflect denomination at chosen year
//   • Sidebar: church list, layer toggles, legend
//   • Syncs with timeline filter (visibleChurches)

import { churches }    from './data/churches.js';
import { districtGeo } from './data/geodata.js';
import { gates }        from './data/gates.js';
import { denomColors, denomNames, visibleChurches } from './state.js';
import { openCD }      from './detail.js';

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

let gatesLayerGroup = null;
let showGates       = true;

let showChurches = true;

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

// Build / refresh the fullscreen overlay controls (year + layers)
function _buildFsOverlay() {
  const disp   = document.getElementById('mapYearDisplayFs');
  const slider = document.getElementById('mapYearSliderFs');
  if (disp)   disp.textContent = mapYear;
  if (slider) slider.value     = mapYear;
  // Build layer toggles into the fs overlay
  _buildFsLayerToggles();
}

function _buildFsLayerToggles() {
  const el = document.getElementById('mapLayerTogglesFs');
  if (!el) return;
  const allOn = showChurches && showGates && showDistricts;
  let html = '';
  html += _fsTgl('All Layers', allOn, 'fsToggleAll');
  html += _fsTgl(`Churches (${churches.length})`, showChurches, 'fsToggleChurches');
  html += _fsTgl(`Gates`, showGates, 'fsToggleGates');
  html += _fsTgl(`Districts`, showDistricts, 'fsToggleDistricts');
  el.innerHTML = html;

  document.getElementById('fsToggleAll')?.addEventListener('click', () => {
    const on = showChurches && showGates && showDistricts;
    showChurches = showGates = showDistricts = !on;
    if (gatesLayerGroup) { if (showGates) gatesLayerGroup.addTo(leafletMap); else leafletMap.removeLayer(gatesLayerGroup); }
    _updateDistrictYearVisibility();
    renderMap(); buildMapLayerToggles(); _buildFsLayerToggles();
  });
  document.getElementById('fsToggleChurches')?.addEventListener('click', () => { toggleChurchesLayer(); _buildFsLayerToggles(); });
  document.getElementById('fsToggleGates')?.addEventListener('click', () => { toggleGatesLayer(); _buildFsLayerToggles(); });
  document.getElementById('fsToggleDistricts')?.addEventListener('click', () => { toggleDistrictLayer(); _buildFsLayerToggles(); });
}

function _fsTgl(label, on, id) {
  const col = on ? 'var(--accent)' : 'var(--text-muted)';
  return `<div id="${id}" style="cursor:pointer;padding:3px 0;color:${col};transition:color 0.15s;">${on ? '✓' : '○'} ${label}</div>`;
}

// ── Leaflet init ──────────────────────────────────────────────
function _initLeafletMap() {
  leafletMap = L.map('mapLeaflet', {
    center:           [54.362, 18.640],
    zoom:             13,
    zoomControl:      true,
    attributionControl: true,
  });

  // Muted CartoDB "Positron" tile layer — neutral parchment-like base
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(leafletMap);

  _initDistrictLayers();
  _initGatesLayer();
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

// ── Gates layer ───────────────────────────────────────────────
function _makeGateIcon(surviving) {
  // Diamond shape for gates; gold for surviving, grey for demolished
  const color   = surviving ? '#c8860a' : '#7a6a5a';
  const outline = surviving ? '#fff8e0' : '#d0c8c0';
  const size = 16;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${size/2},1 ${size-1},${size/2} ${size/2},${size-1} 1,${size/2}"
      fill="${color}" stroke="${outline}" stroke-width="1.5"/>
    <line x1="${size/2}" y1="4" x2="${size/2}" y2="${size-4}" stroke="${outline}" stroke-width="1" opacity="0.6"/>
    <line x1="4" y1="${size/2}" x2="${size-4}" y2="${size/2}" stroke="${outline}" stroke-width="1" opacity="0.6"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

function _initGatesLayer() {
  gatesLayerGroup = L.layerGroup();

  gates.forEach(g => {
    const icon   = _makeGateIcon(g.surviving);
    const marker = L.marker([g.lat, g.lon], { icon });

    const statusLabel = g.surviving
      ? '<span style="color:#c8860a;font-weight:600">Surviving</span>'
      : '<span style="color:#9a8a7a">Demolished</span>';
    const builtStr = g.builtC ? `Built c. ${g.builtC}` : '';

    marker.bindPopup(
      `<div style="font-family:'Inter',-apple-system,system-ui,sans-serif;min-width:200px;max-width:260px">
        <div style="font-size:13px;font-weight:700;color:#3a2a0a;margin-bottom:3px">${g.name}</div>
        <div style="font-size:10px;color:#7a6a4a;margin-bottom:2px;font-style:italic">${g.polishName} · ${g.germanName}</div>
        <div style="font-size:10px;color:#6a5a3a;margin-bottom:6px">${builtStr} · ${statusLabel}</div>
        <div style="font-size:10px;color:#5a4a30;line-height:1.5;max-height:100px;overflow-y:auto">${g.note.substring(0, 280)}…</div>
      </div>`,
      { maxWidth: 270 }
    );

    marker.bindTooltip(
      `<b>${g.polishName}</b><br><span style="font-size:10px;opacity:0.7">${g.surviving ? 'Surviving' : 'Demolished'} · c.${g.builtC}</span>`,
      { direction: 'top', offset: [0, -10], opacity: 0.95 }
    );

    gatesLayerGroup.addLayer(marker);
  });

  if (showGates) gatesLayerGroup.addTo(leafletMap);
}

export function toggleGatesLayer() {
  showGates = !showGates;
  if (!gatesLayerGroup) return;
  if (showGates) gatesLayerGroup.addTo(leafletMap);
  else leafletMap.removeLayer(gatesLayerGroup);
  buildMapLayerToggles();
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

  _updateDistrictYearVisibility();
  districtLayerGroup.addTo(leafletMap);
  districtLabelsGroup.addTo(leafletMap);
}

// Show/hide each district polygon based on mapYear vs. founded/dissolved dates
function _updateDistrictYearVisibility() {
  if (!districtLayerGroup) return;
  districtGeo.forEach((d, i) => {
    const exists = mapYear >= d.founded && (!d.dissolved || mapYear <= d.dissolved);
    const on = exists && showDistricts && districtVisible[i];
    if (on) {
      districtLayerGroup.addLayer(districtPolygons[i]);
      districtLabelsGroup.addLayer(districtLabelMarkers[i]);
    } else {
      districtLayerGroup.removeLayer(districtPolygons[i]);
      districtLabelsGroup.removeLayer(districtLabelMarkers[i]);
    }
  });
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

  // All layers enabled?
  const allOn = showChurches && showGates && showDistricts;

  // Master toggle
  let html = `<div class="map-layer-toggle ${allOn ? 'on' : ''}" id="masterToggleAll" style="font-weight:700;border-bottom:1px solid var(--border-color);padding-bottom:8px;margin-bottom:8px;">
    <div class="map-layer-cb">${allOn ? '✓' : ''}</div>
    <div class="map-layer-name">All Layers</div>
  </div>`;

  // Churches toggle
  const churchCount = churches.length;
  html += `<div class="map-layer-toggle ${showChurches ? 'on' : ''}" id="churchesToggleAll">
    <div class="map-layer-swatch" style="background:#d4a574;border-radius:50%"></div>
    <div class="map-layer-name">Churches & Chapels
      <span style="font-size:8px;color:var(--text-muted);">(${churchCount} structures)</span>
    </div>
  </div>`;

  // Gates toggle
  const survivingCount  = gates.filter(g => g.surviving).length;
  const demolishedCount = gates.length - survivingCount;
  html += `<div class="map-layer-toggle ${showGates ? 'on' : ''}" id="gatesToggleAll">
    <div class="map-layer-swatch" style="background:#c8860a;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)"></div>
    <div class="map-layer-name">City Gates c.1500
      <span style="font-size:8px;color:var(--text-muted);">(${survivingCount} surviving · ${demolishedCount} demolished)</span>
    </div>
  </div>`;

  // Districts toggle
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
  el.innerHTML = html;

  // Master toggle: toggles all three layers together
  document.getElementById('masterToggleAll')?.addEventListener('click', () => {
    const allCurrentlyOn = showChurches && showGates && showDistricts;
    if (allCurrentlyOn) {
      // Turn all off
      showChurches = false;
      showGates = false;
      showDistricts = false;
    } else {
      // Turn all on
      showChurches = true;
      showGates = true;
      showDistricts = true;
    }
    if (gatesLayerGroup) {
      if (showGates) gatesLayerGroup.addTo(leafletMap);
      else leafletMap.removeLayer(gatesLayerGroup);
    }
    _updateDistrictYearVisibility();
    renderMap();
    buildMapLayerToggles();
  });

  document.getElementById('churchesToggleAll')?.addEventListener('click', toggleChurchesLayer);
  document.getElementById('gatesToggleAll')?.addEventListener('click', toggleGatesLayer);
  document.getElementById('districtToggleAll')?.addEventListener('click', toggleDistrictLayer);
  el.querySelectorAll('.district-toggle-single').forEach(el2 => {
    el2.addEventListener('click', () => toggleSingleDistrict(+el2.dataset.idx));
  });
}
