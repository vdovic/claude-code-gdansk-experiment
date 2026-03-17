// ═══════════ TOOLTIP MODULE ═══════════
// Hover tooltip with pin-to-screen support.
// The tooltip element is styled by .tooltip in styles.css (dark ink background).

import { churches }    from './data/churches.js';
import { calamities, politicalEvents, wars, rulers } from './data/context.js';
import { clusterDefs } from './data/clusters.js';
import { typeColors, denomColors, getCluster, getMostSimilar } from './state.js';
import { churchPatrons, getConfirmedGuildsForChurch } from './data/patronage.js';

const TT_OPEN_DELAY  = 100;  // ms before hover preview appears (skipped when warm)
const TT_CLOSE_DELAY = 60;   // ms before hover preview hides
const TT_CORRIDOR_MS = 250;  // grace ms when cursor is heading toward the tooltip
const TT_MAX_PREVIEW = 220;  // body chars shown in hover preview
const TT_MAX_BODY    = 280;  // body chars shown in pinned / click-expanded state

let ttEl        = null;
let ttPinned    = false;
let ttPinnedCI  = -1;
let ttPinnedEI  = -1;
let ttContent   = '';
let _openTimer  = null;   // delayed-show timer (warm-up delay)
let _closeTimer = null;   // delayed-hide timer
let _mx = 0, _my = 0;    // current mouse position (corridor detection)
let _pmx = 0, _pmy = 0;  // previous mouse position (one move event ago)
let _warm = false;        // true while a tooltip is visible — skip open delay when scanning

function _el() {
  if (!ttEl) ttEl = document.getElementById('tooltip');
  return ttEl;
}

function _positionAt(ev) {
  const tt  = _el();
  const w   = window.innerWidth;
  const h   = window.innerHeight;
  const ttW = Math.min(tt.offsetWidth || 360, 380);
  const ttH = tt.offsetHeight || 200;
  let x = ev.clientX + 14;
  let y = ev.clientY + 24;  // below cursor so same-row marks to the right aren't obscured
  if (x + ttW + 10 > w) x = Math.max(5, ev.clientX - ttW - 14);
  if (y + ttH + 10 > h) y = Math.max(5, ev.clientY - ttH - 10);  // flip above if no room below
  if (y < 5) y = 5;
  if (x < 5) x = 5;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

function _buildBase(html) {
  return `<button class="tt-close" id="ttClose">✕</button>${html}<div class="tt-pin-hint">click to pin</div>`;
}

/** Returns true if the mouse velocity vector is pointing toward the tooltip's bounds. */
function _headingTowardTT() {
  const tt = _el();
  if (!tt || !tt.classList.contains('visible')) return false;
  const r  = tt.getBoundingClientRect();
  const dx = _mx - _pmx, dy = _my - _pmy;
  if (dx === 0 && dy === 0) return false;
  for (let s = 1; s <= 8; s++) {
    const px = _mx + dx * s, py = _my + dy * s;
    if (px >= r.left - 8 && px <= r.right + 8 &&
        py >= r.top  - 8 && py <= r.bottom + 8) return true;
  }
  return false;
}

/** Schedule a show — bypasses the open delay when the user is already warm (scanning marks). */
function _scheduleShow(html, ev, extraClass, immediate) {
  clearTimeout(_openTimer);
  if (immediate || _warm) {
    _show(html, ev, extraClass);
  } else {
    _openTimer = setTimeout(() => _show(html, ev, extraClass), TT_OPEN_DELAY);
  }
}

function _show(html, ev, extraClass) {
  clearTimeout(_openTimer);
  clearTimeout(_closeTimer);
  _warm = true;
  const tt = _el();
  ttContent = html;
  tt.innerHTML = _buildBase(html);
  tt.className = 'tooltip visible' + (extraClass ? ' ' + extraClass : '');
  if (ttPinned) return; // keep pinned position

  // Measure first, then position precisely for large tooltips
  tt.style.left = '0px';
  tt.style.top  = '0px';
  _positionAt(ev);

  document.getElementById('ttClose')?.addEventListener('click', unpinTT);
}

export function showTT(ev, kind, idx, sub, opts = {}) {
  if (ttPinned) return;
  let body = '';

  if (kind === 'p') {
    const e   = politicalEvents[idx];
    const col = e.color || 'var(--amber)';
    const hasMore = e.detail.length > TT_MAX_PREVIEW;
    const esc = hasMore ? e.detail.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    body = `<div class="tt-year">${Math.floor(e.year)}</div>
      <div class="tt-type" style="background:${col}20;color:${col}">Political</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body"${hasMore ? ` data-full="${esc}"` : ''}>${e.detail.substring(0, TT_MAX_PREVIEW)}${hasMore ? '…' : ''}</div>`;
  } else if (kind === 'war') {
    const e = wars[idx];
    const hasMore = e.detail.length > TT_MAX_PREVIEW;
    const esc = hasMore ? e.detail.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    body = `<div class="tt-year">${e.start}–${e.end}</div>
      <div class="tt-type" style="background:rgba(192,48,48,0.15);color:var(--ev-siege)">War / Conflict</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body"${hasMore ? ` data-full="${esc}"` : ''}>${e.detail.substring(0, TT_MAX_PREVIEW)}${hasMore ? '…' : ''}</div>`;
  } else if (kind === 'cal') {
    const e = calamities[idx];
    const hasMore = e.detail.length > TT_MAX_PREVIEW;
    const esc = hasMore ? e.detail.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    body = `<div class="tt-year">${e.year}</div>
      <div class="tt-type" style="background:rgba(106,64,128,0.15);color:var(--ev-plague)">Plague / Epidemic</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body"${hasMore ? ` data-full="${esc}"` : ''}>${e.detail.substring(0, TT_MAX_PREVIEW)}${hasMore ? '…' : ''}</div>`;
  } else if (kind === 'ruler') {
    const r   = rulers[idx];
    const col = r.color || 'var(--amber)';
    const RULER_MAX = 400;
    const hasMore = r.note && r.note.length > RULER_MAX;
    const escaped = r.note ? r.note.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    body = `<div class="tt-year">${r.start}–${r.end}</div>
      <div class="tt-type" style="background:${col}20;color:${col}">Ruler / Authority</div>
      <div class="tt-title">${r.name}</div>
      ${r.note ? `<div class="tt-body"${hasMore ? ` data-full="${escaped}"` : ''}>${r.note.substring(0, RULER_MAX)}${hasMore ? '… <em style="color:var(--amber-lt)">click to pin</em>' : ''}</div>` : ''}`;
  } else {
    // Church event (kind === 'c')
    const ch      = churches[idx];
    const e       = ch.events[sub];
    const col     = typeColors[e.type] || 'var(--amber)';
    const typeLabel = e.type === 'cornerstone' ? 'brick cornerstone' : e.type;
    const maxLen  = opts.immediate ? TT_MAX_BODY : TT_MAX_PREVIEW;
    const hasMore = e.detail.length > maxLen;
    const escaped = hasMore ? e.detail.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : '';
    body = `<div class="tt-year">${e.year} · ${ch.name}</div>
      <div class="tt-type" style="background:${col}20;color:${col}">${typeLabel}</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body"${hasMore ? ` data-full="${escaped}"` : ''}>${e.detail.substring(0, maxLen)}${hasMore ? '… <em style="color:var(--amber-lt)">click</em>' : ''}</div>`;
  }

  _scheduleShow(body, ev, undefined, opts.immediate);
}

export function showChurchTT(ev, ci) {
  if (ttPinned) return;
  const ch  = churches[ci];
  const cl  = getCluster(ci);
  const sim = getMostSimilar(ci);

  let body = '';

  // Symbol + name header
  if (ch.symbol) {
    body += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="font-size:18px;line-height:1;">${ch.symbol.emoji}</span>
      <div>
        <div class="tt-title" style="font-size:12px;margin-bottom:0;">${ch.name}</div>
        <div style="font-size:8px;color:var(--text-muted);margin-top:1px;">${ch.symbol.desc}</div>
      </div>
    </div>`;
  } else {
    body += `<div class="tt-title" style="font-size:12px;margin-bottom:4px;">${ch.name}</div>`;
  }

  body += `<div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;">
    ${ch.height}m · ~${ch.capacity.toLocaleString()} · ${ch.cornerstoneYear}${ch.order ? ' · ' + ch.order : ''}
  </div>`;

  // Cluster badge
  if (cl) {
    body += `<div style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:6px;
        background:${cl.color}18;border:1px solid ${cl.color}40;margin-bottom:5px;">
      <span style="width:6px;height:6px;border-radius:50%;background:${cl.color};display:inline-block;"></span>
      <span style="font-size:9px;color:${cl.color};font-weight:600;">Cluster ${cl.id}</span>
      <span style="font-size:8px;color:${cl.color};opacity:0.7;">${cl.label}</span>
    </div>`;
  }

  // Patronage info (founder, order, guilds)
  const _patron = churchPatrons[ch.id];
  if (_patron) {
    body += `<div class="cit-section"><div class="cit-label">Patronage</div>`;
    body += `<div style="font-size:9px;color:var(--text-secondary);margin-bottom:2px;">Founded by: ${_patron.founder}</div>`;
    if (_patron.order) {
      body += `<div style="font-size:9px;color:var(--accent-muted);font-style:italic;margin-bottom:2px;">${_patron.order}</div>`;
    }
    const _guilds = getConfirmedGuildsForChurch(ch.id);
    if (_guilds.length) {
      const shown = _guilds.slice(0, 2);
      const more = _guilds.length > 2 ? ` +${_guilds.length - 2} more` : '';
      body += `<div style="font-size:9px;color:var(--text-muted);">Guilds: ${shown.map(g => g.name).join(', ')}${more}</div>`;
    }
    body += `</div>`;
  }

  // Most similar
  body += `<div class="cit-section"><div class="cit-label">Most Similar Churches</div>`;
  sim.forEach(s => {
    const sCh  = churches[s.idx];
    const sCl  = getCluster(s.idx);
    const pct  = Math.round((1 - s.dist / 2.5) * 100);
    const pctColor = pct > 80
      ? 'background:rgba(42,106,72,0.15);color:var(--ev-founded)'
      : pct > 60
        ? 'background:rgba(200,134,10,0.15);color:var(--amber)'
        : 'background:rgba(160,80,32,0.15);color:var(--ev-cornerstone)';
    body += `<div style="display:flex;align-items:center;gap:5px;margin:2px 0;font-size:10px;">
      <span style="width:6px;height:6px;border-radius:50%;background:${sCl ? sCl.color : '#888'};flex-shrink:0;display:inline-block;"></span>
      <span style="color:var(--gold);">${sCh.shortName}</span>
      <span style="font-size:8px;color:var(--text-muted);">d=${s.dist.toFixed(2)}</span>
      <span style="font-size:8px;padding:1px 4px;border-radius:3px;${pctColor}">${pct}%</span>
    </div>`;
  });
  body += `</div>`;

  // Facts
  if (ch.facts) {
    body += `<div class="cit-section"><div class="cit-label">Top Facts</div>`;
    ch.facts.slice(0, 3).forEach(f => { body += `<div class="cit-fact">${f}</div>`; });
    body += `</div>`;
  }

  _show(body, ev, 'church-info-tt');
}

export function showClusterTT(ev, clusterId) {
  if (ttPinned) return;
  const cl = clusterDefs.find(c => c.id === clusterId);
  if (!cl) return;
  const members = cl.members.map(mid => {
    const ch = churches.find(c => c.id === mid);
    return ch ? ch.shortName : '';
  });
  const body = `<div class="tt-type" style="background:${cl.color}18;color:${cl.color}">Cluster ${cl.id}</div>
    <div class="tt-title">${cl.label}</div>
    <div class="tt-body">${cl.desc}</div>
    <div style="margin-top:6px;font-size:9px;color:var(--text-muted);">Members (${members.length}): ${members.join(', ')}</div>`;
  _show(body, ev);
}

/** Generic tooltip — accepts pre-built HTML, used by grain, religious, and urban power tracks. */
export function showGenericTT(ev, html) {
  if (ttPinned) return;
  _scheduleShow(html, ev);
}

/** Show AND immediately pin a tooltip — for mobile tap interactions where
 *  there is no hover phase. Unpins any existing pinned tooltip first. */
export function showPinnedGenericTT(ev, html) {
  if (ttPinned) unpinTT();
  _show(html, ev);          // renders and positions immediately
  ttPinned = true;
  const tt = _el();
  tt.classList.add('pinned');
  tt.classList.remove('tt-pin-hint');
}

/** Same as showPinnedGenericTT but uses the structured showTT content builder.
 *  Use for ruler-bar, war-bar etc. on tap (no hover phase on mobile). */
export function showPinnedTT(ev, kind, idx, sub) {
  if (ttPinned) unpinTT();
  showTT(ev, kind, idx, sub, { immediate: true });
  ttPinned = true;
  const tt = _el();
  tt.classList.add('pinned');
  tt.classList.remove('tt-pin-hint');
}

export function hideTT() {
  if (ttPinned) return;
  clearTimeout(_openTimer);   // cancel any pending show
  clearTimeout(_closeTimer);
  const delay = _headingTowardTT() ? TT_CORRIDOR_MS : TT_CLOSE_DELAY;
  _closeTimer = setTimeout(() => {
    if (ttPinned) return;
    _warm = false;
    const tt = _el();
    tt.classList.remove('visible', 'church-info-tt');
  }, delay);
}

export function pinTT(ev, ci = -1, ei = -1) {
  if (ttPinned) { unpinTT(); return; }
  const tt = _el();
  if (!tt.classList.contains('visible')) return;
  ttPinned   = true;
  ttPinnedCI = ci;
  ttPinnedEI = ei;
  tt.classList.add('pinned');
  tt.classList.remove('tt-pin-hint');
  // Expand truncated body if full text is stored
  const body = tt.querySelector('.tt-body[data-full]');
  if (body) body.innerHTML = body.dataset.full;
}

export function unpinTT() {
  ttPinned   = false;
  ttPinnedCI = -1;
  ttPinnedEI = -1;
  _warm = false;
  // Cancel any pending show/hide timers — prevents the tooltip from
  // re-appearing after a detail drawer opens (mobile race condition).
  clearTimeout(_openTimer);
  clearTimeout(_closeTimer);
  const tt = _el();
  tt.classList.remove('pinned', 'visible', 'church-info-tt');
}

export function isTTPinned() { return ttPinned; }
export function isTTPinnedFor(ci, ei) { return ttPinned && ttPinnedCI === ci && ttPinnedEI === ei; }

// Global click/hover handler setup — call once after DOM is ready.
// NOTE: .evt-dot clicks are handled locally in render.js (with stopPropagation)
//       .ch-label no longer shows a hover tooltip (detail drawer on click only)
export function setupTooltipClickHandling() {
  const tt = _el();

  // Track mouse position for corridor detection in hideTT()
  document.addEventListener('mousemove', e => {
    _pmx = _mx; _pmy = _my;
    _mx = e.clientX; _my = e.clientY;
  });

  // Esc closes a pinned tooltip
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ttPinned) unpinTT();
  });

  // Allow mouse to travel from a trigger element into the tooltip without
  // triggering the delayed hide — clear the timers on enter, restart on leave.
  if (tt) {
    tt.addEventListener('mouseenter', () => {
      clearTimeout(_openTimer);
      clearTimeout(_closeTimer);
    });
    tt.addEventListener('mouseleave', () => {
      if (!ttPinned) {
        clearTimeout(_closeTimer);
        _closeTimer = setTimeout(() => {
          if (!ttPinned) {
            _warm = false;
            tt.classList.remove('visible', 'church-info-tt');
          }
        }, TT_CLOSE_DELAY);
      }
    });
  }

  // Context-track items (rulers, wars, political, calamity) pin on click.
  // evt-dot is handled locally in render.js; ch-label tooltip removed.
  document.addEventListener('click', ev => {
    const tt = _el();
    if (tt.contains(ev.target)) return;
    // econ-era blocks handle their own pin via showPinnedGenericTT — don't unpin here
    if (ev.target.closest('.econ-era-block') || ev.target.closest('.econ-era-m-card')) return;
    const trigger = ev.target.closest('.political-marker, .calamity-marker, .war-bar, .ruler-bar');
    if (trigger && tt.classList.contains('visible')) {
      pinTT(ev);
      return;
    }
    if (ttPinned) unpinTT();
  });
}
