// ═══════════ RENDER MODULE ═══════════
// Builds the synchronized-scroll timeline DOM:
//   • era bands + siege bands (static background, inside lanesInner)
//   • year axis (frozen, inside axisInner)
//   • context track rows: rulers, wars, political, plagues, population, grain
//   • church lanes (denom bars + event dots)
//
// The v6 layout uses a frozen label column (tl-labels) + frozen axis row (tl-axis-row)
// with a single horizontally-scrolling area (tl-lanes-scroll) that drives all other
// scroll panels via JS synchronisation in main.js.

import { churches }       from './data/churches.js';
import { calamities, politicalEvents, religiousEvents, wars, rulers, eras, siegeBands, urbanPowerEvents } from './data/context.js';
import { grainExport, shipTraffic, economicEras, populationData } from './data/economic.js';
import { getGrainValue, getShipsValue, getShipsTrend } from './data/grainCurve.js';
import {
  START_YEAR, END_YEAR, viewStart, viewEnd, labelOffset, pixelsPerYear,
  yearToX, getTotalWidth,
  visibleChurches, sortedIndices, trackVisibility,
  typeColors, getCluster,
  patronageMode, getHighlightedChurchIds,
} from './state.js';
import { showTT, showChurchTT, showGenericTT, hideTT, unpinTT, pinTT, isTTPinned, isTTPinnedFor } from './tooltip.js';
import { openCD, openPD, openCalD, openWarD } from './detail.js';
import { getConfessionalPhases } from './data/confessional.js';
import { eventMarkerSVG } from './theme.js';

// ── Sort-value helpers (lightweight duplicates, render-only) ──
const _SM_LAT = 54.3498, _SM_LON = 18.6531;
function _haversineDist(ch) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(ch.lat - _SM_LAT), dLon = toRad(ch.lon - _SM_LON);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(_SM_LAT)) * Math.cos(toRad(ch.lat)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function _cathYears(ch) {
  return ch.denomBars.filter(b => b.type === 'catholic').reduce((s, b) => s + (b.end - b.start), 0);
}

// ── Axis tick renderer (full-range overview with percentage positioning) ──
// The axis always shows START_YEAR–END_YEAR. Year ticks and era bands share
// the same percentage coordinate system as the integrated range handles.
const _AXIS_SPAN = END_YEAR - START_YEAR;   // 805
function _yearPct(y) { return ((y - START_YEAR) / _AXIS_SPAN) * 100; }

export function renderAxis() {
  const inner = document.getElementById('axisInner');
  if (!inner) return;
  let html = '';

  // Era bands (behind tick marks)
  eras.forEach(e => {
    const p1 = _yearPct(Math.max(e.start, START_YEAR));
    const p2 = _yearPct(Math.min(e.end, END_YEAR));
    html += `<div class="era-band" style="left:${p1}%;width:${p2 - p1}%;background:${e.color}"></div>`;
  });

  // Siege hazard overlay
  siegeBands.forEach(s => {
    const p1 = _yearPct(Math.max(s.start, START_YEAR));
    const p2 = _yearPct(Math.min(s.end, END_YEAR));
    html += `<div class="siege-band" style="left:${p1}%;width:${Math.max(p2 - p1, 0.5)}%"></div>`;
  });

  // Year ticks — 100-year major, 25-year minor (fixed, since we always show 805 years)
  const majorTick = 100;
  const minorTick = 50;
  const tickStart = Math.ceil(START_YEAR / minorTick) * minorTick;
  for (let y = tickStart; y <= END_YEAR; y += minorTick) {
    const pct = _yearPct(y);
    const maj = y % majorTick === 0;
    html += `<div class="yr-tick ${maj ? '' : 'minor'}" style="left:${pct}%">`;
    if (maj) html += `<div class="yr-tick-lbl">${y}</div>`;
    html += `<div class="yr-tick-line"></div></div>`;
  }
  inner.innerHTML = html;
}

// ── Context track renderers ───────────────────────────────────

function renderRulers() {
  const inner = document.getElementById('rulersInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  rulers.forEach((r, i) => {
    if (r.end < viewStart || r.start > viewEnd) return;
    const x1 = yearToX(Math.max(r.start, viewStart)) - labelOffset;
    const x2 = yearToX(Math.min(r.end, viewEnd)) - labelOffset;
    const bw  = Math.max(x2 - x1, 2);
    const bg  = r.color || 'rgba(200,134,10,0.12)';
    const shortName = bw > 55 ? r.name : (bw > 28 ? r.name.split(' ')[0] : '');
    html += `<div class="ruler-bar" data-ruler="${i}"
      style="left:${x1}px;width:${bw}px;background:${bg}18;border-color:${bg}40;color:${bg}">
      ${shortName}</div>`;
  });
  inner.innerHTML = html;
  // Attach events
  inner.querySelectorAll('.ruler-bar').forEach(el => {
    const i = +el.dataset.ruler;
    el.addEventListener('mouseenter', ev => showTT(ev, 'ruler', i));
    el.addEventListener('mouseleave', hideTT);
  });
}

function renderWars() {
  const inner = document.getElementById('warsInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  wars.forEach((w, i) => {
    if (w.end < viewStart || w.start > viewEnd) return;
    const x1  = yearToX(Math.max(w.start, viewStart)) - labelOffset;
    const x2  = yearToX(Math.min(w.end, viewEnd))     - labelOffset;
    const barW = Math.max(x2 - x1, 6);
    html += `<div class="war-bar" data-war="${i}"
      style="left:${x1}px;width:${barW}px;background:${w.color || '#a04040'}">
      <span class="war-bar-label">${barW > 45 ? w.label : ''}</span></div>`;
  });
  inner.innerHTML = html;
  inner.querySelectorAll('.war-bar').forEach(el => {
    const i = +el.dataset.war;
    el.addEventListener('mouseenter', ev => showTT(ev, 'war', i));
    el.addEventListener('mouseleave', hideTT);
    el.addEventListener('click', () => openWarD(i));
  });
}

function renderPolitical() {
  const inner = document.getElementById('politicalInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  politicalEvents.forEach((ev, i) => {
    if (ev.year < viewStart || ev.year > viewEnd) return;
    const x   = yearToX(ev.year) - labelOffset;
    const col = ev.color || 'var(--amber)';
    html += `<div class="political-marker" data-pol="${i}" style="left:${x}px">
      <div class="marker-label" style="color:${col}">${Math.floor(ev.year)} · ${ev.label.substring(0, 42)}${ev.label.length > 42 ? '…' : ''}</div>
      <div class="marker-diamond" style="background:${col}"></div>
      <div class="marker-line"></div>
    </div>`;
  });
  inner.innerHTML = html;
  inner.querySelectorAll('.political-marker').forEach(el => {
    const i = +el.dataset.pol;
    el.addEventListener('mouseenter', ev => showTT(ev, 'p', i));
    el.addEventListener('mouseleave', hideTT);
    el.addEventListener('click', () => openPD(i));
  });
}

function renderPlagues() {
  const inner = document.getElementById('plaguesInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  calamities.forEach((c, i) => {
    if (c.year < viewStart || c.year > viewEnd) return;
    const x = yearToX(c.year) - labelOffset;
    html += `<div class="calamity-marker" data-cal="${i}" style="left:${x}px">
      <div class="marker-label" style="color:var(--ev-plague)">${c.year} · ${c.label}</div>
      <div class="calamity-icon"></div>
      <div class="calamity-line"></div>
    </div>`;
  });
  inner.innerHTML = html;
  inner.querySelectorAll('.calamity-marker').forEach(el => {
    const i = +el.dataset.cal;
    el.addEventListener('mouseenter', ev => showTT(ev, 'cal', i));
    el.addEventListener('mouseleave', hideTT);
    el.addEventListener('click', () => openCalD(i));
  });
}

function renderPopulation() {
  const inner = document.getElementById('populationInner');
  if (!inner) return;
  const svgW = getTotalWidth() - labelOffset;
  // Set container width so scroll-sync works (must match other tracks)
  inner.style.width = svgW + 'px';
  const pH   = 40;
  const pad  = 5;
  const visData = populationData.filter(d => d.year >= viewStart && d.year <= viewEnd);
  if (!visData.length) { inner.innerHTML = ''; return; }

  // Use upper-bound max so uncertainty band fits within the SVG
  const maxP = Math.max(...visData.map(d => d.pop)) * 1.15;

  // ── Uncertainty band (±12%) ────────────────────────────────
  // Subtle fill around the main line — visually conveys estimation margin.
  let bandD = '';
  if (visData.length >= 2) {
    // Upper edge (left to right)
    visData.forEach((d, i) => {
      const x = yearToX(d.year) - labelOffset;
      const y = Math.max(pad, pH - (d.pop * 1.12 / maxP) * (pH - pad * 2));
      bandD += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    });
    // Lower edge (right to left)
    for (let i = visData.length - 1; i >= 0; i--) {
      const d = visData[i];
      const x = yearToX(d.year) - labelOffset;
      const y = Math.min(pH, pH - (d.pop * 0.88 / maxP) * (pH - pad * 2));
      bandD += ` L${x},${y}`;
    }
    bandD += ' Z';
  }

  // ── Main line + area ───────────────────────────────────────
  let pp = '', pa = '';
  visData.forEach((d, i) => {
    const x = yearToX(d.year) - labelOffset;
    const y = pH - (d.pop / maxP) * (pH - pad * 2);
    if (!i) { pp = `M${x},${y}`; pa = `M${x},${pH} L${x},${y}`; }
    else    { pp += ` L${x},${y}`; pa += ` L${x},${y}`; }
    if (i === visData.length - 1) pa += ` L${x},${pH} Z`;
  });

  let svg = `<svg class="pop-svg" width="${svgW}" height="${pH}" style="position:absolute;top:3px;left:0;">
    <title>Medieval population figures are reconstructed from tax and hearth records and reflect estimated total inhabitants (not only burgher citizens). Margin of error approx. ±10–15%. Shaded band shows uncertainty range.</title>`;

  // Uncertainty band (behind everything)
  if (bandD) svg += `<path d="${bandD}" fill="rgba(42,106,72,0.045)" stroke="none"/>`;

  // Main area fill + line
  svg += `<path d="${pa}" fill="rgba(42,106,72,0.07)"/>`;
  svg += `<path d="${pp}" fill="none" stroke="var(--ev-founded)" stroke-width="1.5" opacity="0.5"/>`;

  // Data points + labels
  visData.forEach(d => {
    const x = yearToX(d.year) - labelOffset;
    const y = pH - (d.pop / maxP) * (pH - pad * 2);
    svg += `<circle cx="${x}" cy="${y}" r="2" fill="var(--ev-founded)" opacity="0.6"/>
      <text x="${x}" y="${y - 5}" class="pop-label" text-anchor="middle">${(d.pop / 1000).toFixed(0)}k</text>`;
  });
  svg += '</svg>';
  inner.innerHTML = svg;
}

// ── Economic eras (historically-aligned blocks) ──────────────
function renderEconEras() {
  const inner = document.getElementById('econErasInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  let html = '';
  economicEras.forEach((era, idx) => {
    if (era.end < viewStart || era.start > viewEnd) return;
    const x1 = yearToX(Math.max(era.start, viewStart)) - labelOffset;
    const x2 = yearToX(Math.min(era.end, viewEnd))     - labelOffset;
    const w  = x2 - x1;
    const bg = isLight ? era.bgLight : era.bg;
    const ttText = era.tooltip || era.desc;
    const tag = era.tag ? `<span class="econ-era-tag">${era.tag}</span>` : '';
    html += `<div class="econ-era-block" data-idx="${idx}"
      style="left:${x1}px;width:${w}px;background:${bg};" title="${era.label} (${era.start}–${era.end}): ${ttText}">
      <div class="econ-era-label">${era.label} ${tag}</div>
      <div class="econ-era-desc">${era.desc}</div>
    </div>`;
  });
  inner.innerHTML = html;
}

// ── Catmull-Rom → cubic Bézier SVG path builder ─────────────
// Produces a smooth curve through all data points (no overshoot
// beyond the convex hull of adjacent segments).
function _smoothLine(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  if (n === 2) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} L${pts[1].x.toFixed(1)},${pts[1].y.toFixed(1)}`;

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Smooth closed area: baseline → smooth top edge → baseline. */
function _smoothArea(pts, baseY) {
  const n = pts.length;
  if (n < 2) return '';
  const first = pts[0], last = pts[n - 1];
  let d = `M${first.x.toFixed(1)},${baseY} L${first.x.toFixed(1)},${first.y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  d += ` L${last.x.toFixed(1)},${baseY} Z`;
  return d;
}

// ── Grain Export track (sole visible economic line) ──────────
// Ships data is NOT rendered as a line — only accessible via tooltip.
function renderGrain() {
  const inner = document.getElementById('grainInner');
  if (!inner) return;
  const svgW = getTotalWidth() - labelOffset;
  const gH   = 46;
  const pad  = 6;
  // Set container width so scroll-sync works (must match other tracks)
  inner.style.width = svgW + 'px';

  const visGrain = grainExport.filter(d => d.year >= viewStart && d.year <= viewEnd);
  if (!visGrain.length) { inner.innerHTML = ''; return; }

  const maxG = Math.max(...visGrain.map(d => d.val));

  // Build smooth point array — uses the same yearToX as every other track
  const pts = visGrain.map(d => ({
    x: yearToX(d.year) - labelOffset,
    y: gH - (d.val / maxG) * (gH - pad * 2),
  }));

  const areaD = _smoothArea(pts, gH);
  const lineD = _smoothLine(pts);

  // Clip to the actual data plotting region (0 … dataW)
  const dataW = (viewEnd - viewStart) * pixelsPerYear;
  let svg = `<svg class="grain-svg" width="${svgW}" height="${gH}" style="position:absolute;top:3px;left:0;">`;
  svg += `<defs><clipPath id="grainClip"><rect x="0" y="0" width="${dataW}" height="${gH}"/></clipPath></defs>`;
  svg += `<g clip-path="url(#grainClip)">`;

  // Subtle area fill + smooth stroke
  svg += `<path d="${areaD}" fill="rgba(200,134,10,0.12)"/>`;
  svg += `<path d="${lineD}" fill="none" stroke="var(--amber)" stroke-width="1.5" opacity="0.55"/>`;

  // Anchor dots
  visGrain.forEach(d => {
    const x = yearToX(d.year) - labelOffset;
    const y = gH - (d.val / maxG) * (gH - pad * 2);
    svg += `<circle cx="${x}" cy="${y}" r="1.5" fill="var(--amber)" opacity="0.5"/>`;
  });

  // Peak / trough labels
  if (visGrain.length > 3) {
    const gPeak   = visGrain.reduce((a, b) => b.val > a.val ? b : a);
    const gTrough = visGrain.reduce((a, b) => b.val < a.val ? b : a);
    const px = yearToX(gPeak.year) - labelOffset;
    const py = gH - (gPeak.val / maxG) * (gH - pad * 2);
    svg += `<text x="${px}" y="${py - 3}" class="econ-label" fill="var(--amber)" text-anchor="middle">${Math.round(gPeak.val / 1000)}k t</text>`;
    if (gTrough.val < gPeak.val * 0.2) {
      const tx = yearToX(gTrough.year) - labelOffset;
      const ty = gH - (gTrough.val / maxG) * (gH - pad * 2);
      svg += `<text x="${tx}" y="${ty - 3}" class="econ-label" fill="var(--amber)" text-anchor="middle">${Math.round(gTrough.val / 1000)}k t</text>`;
    }
  }

  // Sparse structural-year markers when zoomed in (PPY > 12)
  if (pixelsPerYear > 12) {
    const keyYears = [1454, 1525, 1618, 1772];
    keyYears.forEach(yr => {
      if (yr < viewStart || yr > viewEnd) return;
      const kx = yearToX(yr) - labelOffset;
      const kv = getGrainValue(yr);
      const ky = gH - (kv / maxG) * (gH - pad * 2);
      svg += `<line x1="${kx}" y1="${ky + 3}" x2="${kx}" y2="${gH}" stroke="var(--amber)" stroke-width="0.5" opacity="0.25" stroke-dasharray="2,2"/>`;
      svg += `<text x="${kx}" y="${gH - 1}" class="econ-label" fill="var(--amber)" text-anchor="middle" opacity="0.55" style="font-size:7px">${yr}</text>`;
    });
  }

  svg += `</g>`; // close clip group

  // Legend (outside clip so it's always visible at right edge)
  svg += `<text x="${svgW - 4}" y="8" class="econ-label" fill="var(--amber)" text-anchor="end" opacity="0.6">Grain export (kt)</text>`;

  // Transparent hit-area for tooltip (covers entire SVG)
  svg += `<rect width="${svgW}" height="${gH}" fill="transparent" class="grain-hit"/>`;

  svg += '</svg>';
  inner.innerHTML = svg;
}

// ── Grain track tooltip (persistent listener, wired once) ────
let _grainTipReady = false;
export function initGrainTooltip() {
  if (_grainTipReady) return;
  const inner = document.getElementById('grainInner');
  if (!inner) return;
  _grainTipReady = true;

  inner.addEventListener('mousemove', ev => {
    const svg = inner.querySelector('.grain-svg');
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const xInSvg = ev.clientX - svgRect.left;
    if (pixelsPerYear <= 0) return;

    // Use the same inverse mapping as the main timeline axis:
    //   x = (year - viewStart) * ppy  →  year = viewStart + x / ppy
    const year = viewStart + xInSvg / pixelsPerYear;
    if (year < viewStart || year > viewEnd) { hideTT(); return; }

    const grain = getGrainValue(year);
    const ships = getShipsValue(year);
    const trend = getShipsTrend(year);

    const html =
      `<div class="tt-year">${Math.round(year)}</div>` +
      `<div class="tt-type" style="background:rgba(200,134,10,0.15);color:var(--amber)">Grain Export</div>` +
      `<div style="font-size:11px;margin:4px 0 2px;">` +
        `<div style="margin:2px 0;"><strong>Grain export:</strong> ${Math.round(grain / 1000)}k t</div>` +
        `<div style="margin:2px 0;"><strong>Ships per year:</strong> ~${Math.round(ships)}</div>` +
        `<div style="margin:2px 0;"><strong>Ships trend:</strong> ${trend}</div>` +
      `</div>`;
    showGenericTT(ev, html);
  });

  inner.addEventListener('mouseleave', () => hideTT());
}

// ── Religious events track (diamond markers, same pattern as political) ──
function renderReligious() {
  const inner = document.getElementById('religiousInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  religiousEvents.forEach((ev, i) => {
    if (ev.year < viewStart || ev.year > viewEnd) return;
    const x   = yearToX(ev.year) - labelOffset;
    const col = ev.color || '#5a3a6e';
    html += `<div class="political-marker religious-marker" data-rel="${i}" style="left:${x}px">
      <div class="marker-label" style="color:${col}">${Math.floor(ev.year)} · ${ev.label.substring(0, 42)}${ev.label.length > 42 ? '…' : ''}</div>
      <div class="marker-diamond" style="background:${col}"></div>
      <div class="marker-line"></div>
    </div>`;
  });
  inner.innerHTML = html;
  inner.querySelectorAll('.religious-marker').forEach(el => {
    const i  = +el.dataset.rel;
    const ev = religiousEvents[i];
    el.addEventListener('mouseenter', me => {
      const body =
        `<div class="tt-year">${Math.floor(ev.year)}</div>` +
        `<div class="tt-type" style="background:rgba(90,58,110,0.15);color:#5a3a6e">✝ Religious</div>` +
        `<div class="tt-title">${ev.label}</div>` +
        `<div class="tt-body">${ev.detail}</div>`;
      showGenericTT(me, body);
    });
    el.addEventListener('mouseleave', () => hideTT());
  });
}

// ── Urban Power track (sparse markers with church connection tooltips) ──
function renderUrbanPower() {
  const inner = document.getElementById('urbanPowerInner');
  if (!inner) return;
  inner.style.width = (getTotalWidth() - labelOffset) + 'px';
  let html = '';
  let prevX = -Infinity;
  urbanPowerEvents.forEach((ev, i) => {
    if (ev.year < viewStart || ev.year > viewEnd) return;
    const x = yearToX(ev.year) - labelOffset;
    // If previous visible marker is < 40px away, nudge label up to avoid overlap
    const tight = (x - prevX) < 40;
    const labelExtra = tight ? 'bottom:calc(100% + 10px);font-size:8px' : '';
    prevX = x;
    html += `<div class="political-marker urban-marker" data-urb="${i}" style="left:${x}px">
      <div class="marker-label" style="color:#6a5a20${labelExtra ? ';' + labelExtra : ''}">${ev.year} · ${ev.label.substring(0, 38)}${ev.label.length > 38 ? '…' : ''}</div>
      <div class="marker-diamond" style="background:#8a7a30"></div>
      <div class="marker-line"></div>
    </div>`;
  });
  inner.innerHTML = html;
  inner.querySelectorAll('.urban-marker').forEach(el => {
    const i  = +el.dataset.urb;
    const ev = urbanPowerEvents[i];
    el.addEventListener('mouseenter', me => {
      const body =
        `<div class="tt-year">${ev.year}</div>` +
        `<div class="tt-type" style="background:rgba(138,122,48,0.15);color:#6a5a20">🏛 Urban Power</div>` +
        `<div class="tt-title">${ev.label}</div>` +
        `<div class="tt-body">${ev.detail}</div>`;
      showGenericTT(me, body);
    });
    el.addEventListener('mouseleave', () => hideTT());
  });
}

// ── Context row visibility ────────────────────────────────────
function setCtxRowVisible(id, visible) {
  const row = document.getElementById(id + 'Row');
  if (row) row.style.display = visible ? '' : 'none';
}

// ── Church lanes renderer ─────────────────────────────────────
function renderLanes() {
  const labelsEl  = document.getElementById('tlLabels');
  const lanesEl   = document.getElementById('lanesInner');
  if (!labelsEl || !lanesEl) return;

  const tw = getTotalWidth() - labelOffset;
  const visibleCount = sortedIndices.filter(ci => visibleChurches.has(churches[ci].id)).length;
  lanesEl.style.width  = tw + 'px';
  lanesEl.style.height = (visibleCount * 54) + 'px';

  const metaFn = {
    cornerstone:   c => c.cornerstoneYear || '\u2014',
    established:   c => {
      const ev = c.events.find(e => e.type === 'founded');
      return ev ? ev.year : '\u2014';
    },
    height:        c => c.height ? c.height + 'm' : '\u2014',
    capacity:      c => c.capacity ? c.capacity.toLocaleString() : '\u2014',
    distance:      c => {
      const d = _haversineDist(c);
      return d !== null ? d.toFixed(2) + 'km' : '\u2014';
    },
    catholicism:   c => {
      const yrs = _cathYears(c);
      return yrs > 0 ? yrs + 'yr' : '\u2014';
    },
  };

  // Build grid lines once (not per lane)
  let gridHtml = '';
  const gridStart = Math.ceil(viewStart / 10) * 10;
  for (let y = gridStart; y <= viewEnd; y += 10) {
    const x   = yearToX(y) - labelOffset;
    const maj = y % 50 === 0;
    gridHtml += `<div class="grid-vl ${maj ? 'maj' : 'min'}" style="left:${x}px"></div>`;
  }

  // Patronage highlight set (null = mode off or no guild selected)
  const patHi = patronageMode ? getHighlightedChurchIds() : null;

  let labHtml  = '';
  let laneHtml = `<div class="lanes-grid">${gridHtml}</div>`;

  sortedIndices.forEach((ci) => {
    const ch  = churches[ci];
    const vis = visibleChurches.has(ch.id);
    // Skip hidden churches entirely — don't emit DOM nodes for them
    if (!vis) return;

    const cl  = getCluster(ci);
    const fn  = metaFn[_currentSortKey];
    const mv  = fn ? fn(ch) : '';
    const clDotHtml = cl
      ? `<span class="lane-cluster-dot" style="background:${cl.color}" title="Cluster ${cl.id}: ${cl.label}"></span>`
      : '';
    const symHtml = ch.symbol
      ? `<span style="font-size:9px;margin-right:1px;" title="${ch.symbol.desc}">${ch.symbol.emoji}</span>`
      : '';

    // Patronage dim/highlight CSS class
    const patClass = patHi ? (patHi.has(ch.id) ? ' pat-hi' : ' pat-dim') : '';

    // Label column — name left, sort value right
    labHtml += `<div class="ch-label${patClass}" data-ci="${ci}">
      <div class="ch-lbl-left">${clDotHtml}${symHtml}<div class="ch-lbl-text">${ch.shortName}</div></div>
      ${mv ? `<span class="ch-lbl-val">${mv}</span>` : ''}
    </div>`;

    // Lane content
    let denomHtml = '';
    ch.denomBars.forEach(b => {
      if (b.end < viewStart || b.start > viewEnd) return;
      const x1 = yearToX(Math.max(b.start, viewStart)) - labelOffset;
      const x2 = yearToX(Math.min(b.end, viewEnd)) - labelOffset;
      denomHtml += `<div class="denom-bar ${b.type}" data-denom="${b.type}"
        style="left:${x1}px;width:${Math.max(x2 - x1, 2)}px"
        title="${b.type} ${b.start}–${b.end}"></div>`;
    });

    // Confessional overlay bands (above denom bars, below event dots)
    let confHtml = '';
    const confPhases = getConfessionalPhases(ch.id);
    confPhases.forEach((phase, pi) => {
      if (phase.end < viewStart || phase.start > viewEnd) return;
      const cx1 = yearToX(Math.max(phase.start, viewStart)) - labelOffset;
      const cx2 = yearToX(Math.min(phase.end, viewEnd)) - labelOffset;
      confHtml += `<div class="confessional-overlay" data-ci="${ci}" data-phase="${pi}"
        style="left:${cx1}px;width:${Math.max(cx2 - cx1, 4)}px"
        title="${phase.tooltipTitle}"></div>`;
    });

    let evtHtml = '';
    ch.events.forEach((ev, ei) => {
      if (ev.year < viewStart || ev.year > viewEnd) return;
      const x = yearToX(ev.year) - labelOffset;
      const col = typeColors[ev.type] || 'var(--amber)';
      const dotSvg = eventMarkerSVG(ev.type, col, 13);
      evtHtml += `<div class="evt-dot" data-ci="${ci}" data-ei="${ei}" data-type="${ev.type}"
        style="left:${x}px" tabindex="0" role="button"
        aria-label="${ev.year} ${ev.type}: ${ev.label}">${dotSvg}</div>`;
    });

    laneHtml += `<div class="ch-lane${patClass}" data-ci="${ci}">${denomHtml}${confHtml}${evtHtml}</div>`;
  });

  labelsEl.innerHTML  = labHtml;
  lanesEl.innerHTML   = laneHtml;

  // Attach event listeners to labels.
  // Church metadata is shown only in the detail drawer (explicit click).
  // Hover tooltip removed from labels — avoids conflating marker-level
  // hover state with full church metadata.
  labelsEl.querySelectorAll('.ch-label').forEach(el => {
    const ci = +el.dataset.ci;
    el.addEventListener('click', () => openCD(ci, 0));
  });

  // Attach event listeners to event dots (mouse + keyboard + touch)
  let _lastPtrType = 'mouse';
  lanesEl.querySelectorAll('.evt-dot').forEach(el => {
    const ci = +el.dataset.ci;
    const ei = +el.dataset.ei;
    el.addEventListener('mouseenter', ev => showTT(ev, 'c', ci, ei));
    el.addEventListener('mouseleave', hideTT);
    el.addEventListener('pointerdown', e => { _lastPtrType = e.pointerType; });
    el.addEventListener('click', e => {
      if (_lastPtrType === 'touch') {
        // Touch: first tap pins the event tooltip; second tap on the same marker opens detail
        if (isTTPinnedFor(ci, ei)) {
          openCD(ci, ei);
        } else {
          const r = el.getBoundingClientRect();
          const fakeEv = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
          unpinTT();                        // dismiss any previously pinned tooltip
          showTT(fakeEv, 'c', ci, ei, { immediate: true });
          pinTT(fakeEv, ci, ei);
        }
        e.stopPropagation();              // prevent global pin-handler from fighting us
      } else {
        // Desktop: first click pins tooltip (same UX as touch first tap);
        // second click on the SAME already-pinned marker opens the detail drawer.
        if (isTTPinnedFor(ci, ei)) {
          openCD(ci, ei);
        } else {
          if (isTTPinned()) unpinTT();    // release any existing pin first
          showTT(e, 'c', ci, ei, { immediate: true });  // show tooltip without open-delay
          pinTT(e, ci, ei);               // sticky-pin it
        }
        e.stopPropagation();              // prevent global handler from unpinning on same click
      }
    });
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openCD(ci, ei); }
    });
  });

  // Confessional overlay bands — visual only, no tooltips (removed per UX request)
}

// Track current sort key (needed inside renderLanes without import cycle)
let _currentSortKey = 'cornerstone';
export function setRenderSortKey(k) { _currentSortKey = k; }

// ── Main render entry point ───────────────────────────────────
export function render() {
  renderAxis();
  renderContextTracks();
  renderLanes();
  // renderMap() and renderMinimap() are called by main.js after render()
}

export function renderContextTracks() {
  setCtxRowVisible('rulers',     trackVisibility.rulers);
  setCtxRowVisible('wars',       trackVisibility.wars);
  setCtxRowVisible('political',  trackVisibility.political);
  setCtxRowVisible('religious',  trackVisibility.religious);
  setCtxRowVisible('plagues',    trackVisibility.plagues);
  setCtxRowVisible('population', trackVisibility.population);
  setCtxRowVisible('econEras',   trackVisibility.econEras);
  setCtxRowVisible('urbanPower', trackVisibility.urbanPower);
  setCtxRowVisible('grain',      trackVisibility.grain);
  if (trackVisibility.rulers)     renderRulers();
  if (trackVisibility.wars)       renderWars();
  if (trackVisibility.political)  renderPolitical();
  if (trackVisibility.religious)  renderReligious();
  if (trackVisibility.plagues)    renderPlagues();
  if (trackVisibility.population) renderPopulation();
  if (trackVisibility.econEras)   renderEconEras();
  if (trackVisibility.urbanPower) renderUrbanPower();
  if (trackVisibility.grain)      renderGrain();
}

// Global hook so the non-module theme-switcher script can trigger re-render
window._reRenderEconEras = () => { if (trackVisibility.econEras) renderEconEras(); };
