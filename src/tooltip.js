// ═══════════ TOOLTIP MODULE ═══════════
// Hover tooltip with pin-to-screen support.
// The tooltip element is styled by .tooltip in styles.css (dark ink background).

import { churches }    from './data/churches.js';
import { calamities, politicalEvents, wars, rulers } from './data/context.js';
import { clusterDefs } from './data/clusters.js';
import { typeColors, denomColors, getCluster, getMostSimilar } from './state.js';
import { churchPatrons, getConfirmedGuildsForChurch } from './data/patronage.js';

const TT_MAX_BODY = 280;

let ttEl        = null;
let ttPinned    = false;
let ttContent   = '';

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
  let y = ev.clientY - 10;
  if (x + ttW + 10 > w) x = Math.max(5, ev.clientX - ttW - 14);
  if (y + ttH + 10 > h) y = Math.max(5, h - ttH - 10);
  if (y < 5) y = 5;
  if (x < 5) x = 5;
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
}

function _buildBase(html) {
  return `<button class="tt-close" id="ttClose">✕</button>${html}<div class="tt-pin-hint">click to pin</div>`;
}

function _show(html, ev, extraClass) {
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

export function showTT(ev, kind, idx, sub) {
  if (ttPinned) return;
  let body = '';

  if (kind === 'p') {
    const e   = politicalEvents[idx];
    const col = e.color || 'var(--amber)';
    body = `<div class="tt-year">${Math.floor(e.year)}</div>
      <div class="tt-type" style="background:${col}20;color:${col}">Political</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body">${e.detail.substring(0, TT_MAX_BODY)}${e.detail.length > TT_MAX_BODY ? '…' : ''}</div>`;
  } else if (kind === 'war') {
    const e = wars[idx];
    body = `<div class="tt-year">${e.start}–${e.end}</div>
      <div class="tt-type" style="background:rgba(192,48,48,0.15);color:var(--ev-siege)">War / Conflict</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body">${e.detail.substring(0, TT_MAX_BODY)}${e.detail.length > TT_MAX_BODY ? '…' : ''}</div>`;
  } else if (kind === 'cal') {
    const e = calamities[idx];
    body = `<div class="tt-year">${e.year}</div>
      <div class="tt-type" style="background:rgba(106,64,128,0.15);color:var(--ev-plague)">Plague / Epidemic</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body">${e.detail.substring(0, TT_MAX_BODY)}${e.detail.length > TT_MAX_BODY ? '…' : ''}</div>`;
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
    const ch  = churches[idx];
    const e   = ch.events[sub];
    const col = typeColors[e.type] || 'var(--amber)';
    const typeLabel = e.type === 'cornerstone' ? 'brick cornerstone' : e.type;
    const hasMore   = e.detail.length > TT_MAX_BODY;
    body = `<div class="tt-year">${e.year} · ${ch.name}</div>
      <div class="tt-type" style="background:${col}20;color:${col}">${typeLabel}</div>
      <div class="tt-title">${e.label}</div>
      <div class="tt-body">${e.detail.substring(0, TT_MAX_BODY)}${hasMore ? '… <em style="color:var(--amber-lt)">click</em>' : ''}</div>`;
  }

  _show(body, ev);
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
  _show(html, ev);
}

export function hideTT() {
  if (ttPinned) return;
  const tt = _el();
  tt.classList.remove('visible', 'church-info-tt');
}

export function pinTT(ev) {
  if (ttPinned) { unpinTT(); return; }
  const tt = _el();
  if (!tt.classList.contains('visible')) return;
  ttPinned = true;
  tt.classList.add('pinned');
  tt.classList.remove('tt-pin-hint');
  // Expand truncated body if full text is stored
  const body = tt.querySelector('.tt-body[data-full]');
  if (body) body.innerHTML = body.dataset.full;
}

export function unpinTT() {
  ttPinned = false;
  const tt = _el();
  tt.classList.remove('pinned', 'visible', 'church-info-tt');
}

export function isTTPinned() { return ttPinned; }

// Global click handler: pin on click-over-element, unpin on click-elsewhere
export function setupTooltipClickHandling() {
  document.addEventListener('click', ev => {
    const tt = _el();
    if (tt.contains(ev.target)) return;
    const trigger = ev.target.closest('.evt-dot, .ch-label, .political-marker, .calamity-marker, .war-bar, .ruler-bar');
    if (trigger && tt.classList.contains('visible')) {
      pinTT(ev);
      return;
    }
    if (ttPinned) unpinTT();
  });
}
