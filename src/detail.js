// ═══════════ DETAIL DRAWER MODULE ═══════════
// Renders the bottom-sheet drawer for:
//   • Church profiles (openCD)
//   • Political events (openPD)
//   • Calamities (openCalD)
//   • Wars (openWarD)
//
// Uses the v6 drawer pattern: position:fixed bottom sheet with handle,
// styled in .drawer / .drawer-overlay (dark ink background).

import { churches, shieldSVGs } from './data/churches.js';
import { calamities, politicalEvents, wars } from './data/context.js';
import { typeColors, denomColors, getCluster, getMostSimilar, setSelectedCI } from './state.js';
import { churchPatrons, getConfirmedGuildsForChurch } from './data/patronage.js';
import { churchPatronData } from './data/patrons.js';
import { unpinTT } from './tooltip.js';

// ── Drawer element references ─────────────────────────────────
function _overlay()  { return document.getElementById('drawerOverlay'); }
function _drawer()   { return document.getElementById('drawer'); }
function _body()     { return document.getElementById('drawerBody'); }
function _header()   { return document.getElementById('drawerHeader'); }

// ── Open / close ─────────────────────────────────────────────
function _open() {
  // Auto-dismiss any pinned tooltip when opening the detail drawer
  unpinTT();
  _overlay().classList.add('open');
  _drawer().classList.add('open');
}

export function closePanel() {
  _overlay()?.classList.remove('open');
  _drawer()?.classList.remove('open');
  setSelectedCI(-1);
  document.querySelectorAll('.map-church-item.selected').forEach(el =>
    el.classList.remove('selected'));
}

// ── Church detail ─────────────────────────────────────────────
export function openCD(ci, ei = 0) {
  setSelectedCI(ci);
  const ch  = churches[ci];
  const evt = ch.events[ei] || ch.events[0];
  const cl  = getCluster(ci);
  const sim = getMostSimilar(ci);

  // Header
  _header().innerHTML = `
    <div class="drawer-church-name">${ch.symbol ? ch.symbol.emoji + ' ' : ''}${ch.name}</div>
    <div class="drawer-church-type">${evt.year} · ${_typeLabel(evt.type)} · ${ch.origin} · ${ch.status.replace('_', ' ')}</div>`;

  // Body
  let html = '';

  // Heraldic shield
  const svgArt = shieldSVGs[ch.id];
  if (svgArt) {
    html += `<div class="drawer-shield">${svgArt}</div>`;
  }

  // Photo links
  if (ch.photoLinks && ch.photoLinks.length > 0) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">📷 Photos</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
    ch.photoLinks.forEach(link => {
      html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:14px;
        background:rgba(212,162,83,0.08);border:1px solid rgba(212,162,83,0.2);
        color:var(--accent);text-decoration:none;font-size:10px;font-family:var(--font-ui);
        font-weight:500;transition:background 0.15s,border-color 0.15s;"
        onmouseover="this.style.background='rgba(212,162,83,0.18)';this.style.borderColor='rgba(212,162,83,0.4)'"
        onmouseout="this.style.background='rgba(212,162,83,0.08)';this.style.borderColor='rgba(212,162,83,0.2)'"
        >🔗 ${link.label}</a>`;
    });
    html += `</div></div>`;
  }

  // Symbol description
  if (ch.symbol) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Heraldic Symbol</div>
      <div class="drawer-text">${ch.symbol.desc}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Blazon: ${ch.symbol.colors}</div>
    </div>`;
  }

  // Cluster badge + description
  if (cl) {
    const clMembers = cl.members
      .map(mid => churches.find(c => c.id === mid))
      .filter(c => c && c.shortName !== ch.shortName)
      .map(c => c.shortName);
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Cluster</div>
      <div class="cluster-badge" style="background:${cl.color}15;border:1px solid ${cl.color}40;color:${cl.color};">
        <span style="width:7px;height:7px;border-radius:50%;background:${cl.color};display:inline-block;margin-right:3px;"></span>
        Cluster ${cl.id}: ${cl.label}
      </div>
      <div class="drawer-text" style="margin-top:6px;">${cl.desc}</div>
      ${clMembers.length ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;">Also in cluster: ${clMembers.join(', ')}</div>` : ''}
    </div>`;
  }

  // Patronage (founder, order, confirmed guilds)
  const _pat = churchPatrons[ch.id];
  if (_pat) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">🏛 Patronage & Founders</div>
      <div class="drawer-text"><strong>Founder:</strong> ${_pat.founder}</div>
      ${_pat.order ? `<div class="drawer-text" style="margin-top:3px;"><strong>Religious order:</strong> ${_pat.order}</div>` : ''}`;
    const _cGuilds = getConfirmedGuildsForChurch(ch.id);
    if (_cGuilds.length) {
      html += `<div class="drawer-text" style="margin-top:4px;"><strong>Confirmed guilds:</strong></div>`;
      _cGuilds.forEach(g => {
        const targets = g.targetsConfirmed.filter(t => t.churchId === ch.id);
        const note = targets.length ? targets[0].note : '';
        html += `<div style="margin:3px 0 3px 8px;font-size:11px;color:var(--text-secondary);">
          • <span style="color:var(--accent);font-weight:500;">${g.name}</span>
          ${note ? `<div style="font-size:10px;color:var(--text-muted);margin:1px 0 0 10px;">${note}</div>` : ''}
        </div>`;
      });
    }
    if (_pat.notes) {
      html += `<div class="drawer-text" style="margin-top:4px;font-size:10px;color:var(--text-muted);font-style:italic;">${_pat.notes}</div>`;
    }
    html += `</div>`;
  }

  // Event detail
  html += `<div class="drawer-section">
    <div class="drawer-section-title">${evt.year} · ${_typeLabel(evt.type)}</div>
    <div class="drawer-text"><strong>${evt.label}</strong></div>
    <div class="drawer-text" style="margin-top:4px;">${evt.detail}</div>
  </div>`;

  // Stats
  html += `<div class="drawer-section">
    <div class="drawer-section-title">Profile</div>
    <div class="drawer-text">
      Height: ${ch.height}m · Capacity: ~${ch.capacity.toLocaleString()}<br>
      Cornerstone: ${ch.cornerstoneYear} · Origin: ${ch.origin}<br>
      Position: ${ch.lat.toFixed(4)}°N, ${ch.lon.toFixed(4)}°E${ch.guilds && ch.guilds.length ? `<br>Guilds & patrons: ${ch.guilds.join(', ')}` : ''}
    </div>
  </div>`;

  // Denomination history
  html += `<div class="drawer-section">
    <div class="drawer-section-title">Denomination History</div>`;
  ch.denomBars.forEach(b => {
    const col = denomColors[b.type] || '#888';
    html += `<div class="drawer-denom-row">
      <div class="drawer-denom-sw" style="background:${col}"></div>
      <div class="drawer-denom-txt">${b.start}–${b.end}: ${b.type.charAt(0).toUpperCase() + b.type.slice(1)}</div>
    </div>`;
  });
  html += '</div>';

  // Facts
  if (ch.facts?.length) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Key Facts</div>`;
    ch.facts.forEach(f => { html += `<div class="drawer-fact">${f}</div>`; });
    html += '</div>';
  }

  // Relics
  if (ch.relics) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Relics & Treasures</div>
      <div class="drawer-text">${ch.relics}</div>
    </div>`;
  }

  // Organ
  if (ch.organ) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Organ${ch.organ.has && ch.organ.year ? ' · ' + ch.organ.year : ch.organ.has ? '' : ' · None'}</div>
      <div class="drawer-text">${ch.organ.desc}</div>
    </div>`;
  }

  // Parishioners ~1500
  if (ch.parishioners1500) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Typical Parishioners ~1500</div>
      <div class="drawer-text">${ch.parishioners1500}</div>
    </div>`;
  }

  // Tax ~1500
  if (ch.tax1500) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Tax / Revenue ~1500</div>
      <div class="drawer-text">${ch.tax1500}</div>
    </div>`;
  }

  // Sources and references
  if (ch.sources && ch.sources.length > 0) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Learn More</div>`;
    ch.sources.forEach(src => {
      html += `<div style="margin-bottom:6px;">
        <a href="${src.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;font-size:11px;font-weight:500;">
          📖 ${src.title}
        </a>
      </div>`;
    });
    html += `</div>`;
  }

  // Meet the Patron
  const pd = churchPatronData[ch.id];
  if (pd) {
    html += `<div class="drawer-section patron-section">
      <div class="drawer-section-title">Meet the Patron</div>
      <div class="patron-header">
        <div class="patron-name">${pd.patron}</div>
        <div class="patron-title">${pd.patronTitle}</div>
      </div>
      <ol class="patron-facts">`;
    pd.facts.forEach(f => {
      html += `<li class="patron-fact">${f}</li>`;
    });
    html += `</ol>
      <a class="patron-read-more" href="${pd.wikiUrl}" target="_blank" rel="noopener noreferrer">
        📖 ${pd.readMoreLabel}
      </a>
    </div>`;
  }

  // Most similar churches
  html += `<div class="drawer-section">
    <div class="drawer-section-title">Most Similar Churches</div>`;
  sim.forEach((s, rank) => {
    const sCh  = churches[s.idx];
    const sCl  = getCluster(s.idx);
    const pct  = Math.round((1 - s.dist / 2.5) * 100);
    const sameCluster = cl && sCl && cl.id === sCl.id;
    const pctBg = pct > 80
      ? 'rgba(42,106,72,0.15);color:var(--ev-founded)'
      : pct > 60
        ? 'rgba(200,134,10,0.15);color:var(--amber)'
        : 'rgba(160,80,32,0.15);color:var(--ev-cornerstone)';
    html += `<div class="similar-card" data-open-ci="${s.idx}">
      <div class="similar-rank">#${rank + 1}</div>
      <div class="similar-dot" style="background:${sCl ? sCl.color : '#888'}"></div>
      <div class="similar-info">
        <div class="similar-name">${sCh.shortName}</div>
        <div class="similar-meta">${sCh.height}m · ${sCh.cornerstoneYear} · ${sCh.origin}${sameCluster ? ' · same cluster' : sCl ? ' · Cluster ' + sCl.id : ''}</div>
      </div>
      <div class="similar-score" style="background:${pctBg}">${pct}%</div>
    </div>`;
  });
  html += `<div style="font-size:9px;color:var(--text-muted);margin-top:4px;">
    Weighted distance across 7 parameters. Top 5 of 16 shown.</div>
  </div>`;

  // All events
  html += `<div class="drawer-section">
    <div class="drawer-section-title">All Events</div>
    <div class="drawer-events-list">`;
  ch.events.forEach((e, eIdx) => {
    const col = typeColors[e.type] || 'var(--amber)';
    html += `<div class="evt-row" data-scroll-year="${e.year}" data-open-ci="${ci}" data-open-ei="${eIdx}">
      <div class="evt-row-year">${e.year}</div>
      <div class="evt-row-dot" style="background:${col}"></div>
      <div class="evt-row-label">${e.label}</div>
    </div>`;
  });
  html += '</div></div>';

  _body().innerHTML = html;

  // Bind similar-card clicks
  _body().querySelectorAll('.similar-card').forEach(el => {
    const targetCI = +el.dataset.openCi;
    el.addEventListener('click', () => openCD(targetCI, 0));
  });

  // Bind event-row clicks (scroll to year + re-open at that event)
  _body().querySelectorAll('.evt-row').forEach(el => {
    const yr    = +el.dataset.scrollYear;
    const tCI   = +el.dataset.openCi;
    const tEI   = +el.dataset.openEi;
    el.addEventListener('click', () => {
      window._scrollToYear?.(yr);
      openCD(tCI, tEI);
    });
  });

  _open();

  // Scroll timeline to the event year
  window._scrollToYear?.(evt.year);

  // Highlight map sidebar item
  document.querySelectorAll('.map-church-item').forEach((el, i) => {
    el.classList.toggle('selected', i === ci);
  });
}

// ── Political event detail ────────────────────────────────────
export function openPD(idx) {
  const evt = politicalEvents[idx];
  const nearby = politicalEvents
    .filter(e => Math.abs(e.year - evt.year) < 30)
    .sort((a, b) => a.year - b.year);

  _header().innerHTML = `
    <div class="drawer-church-name">${evt.label}</div>
    <div class="drawer-church-type">${Math.floor(evt.year)} · Political Event</div>`;

  let html = `<div class="drawer-section">
    <div class="drawer-section-title">Detail</div>
    <div class="drawer-text">${evt.detail}</div>
  </div>
  <div class="drawer-section">
    <div class="drawer-section-title">Nearby Political Events</div>
    <div class="drawer-events-list">`;
  nearby.forEach(e => {
    const col   = e.color || 'var(--amber)';
    const active = e === evt ? '' : 'opacity:0.45;';
    html += `<div class="evt-row" style="${active}" data-scroll-year="${Math.floor(e.year)}">
      <div class="evt-row-year" style="color:${col}">${Math.floor(e.year)}</div>
      <div class="evt-row-dot" style="background:${col}"></div>
      <div class="evt-row-label">${e.label}</div>
    </div>`;
  });
  html += '</div></div>';
  _body().innerHTML = html;
  _body().querySelectorAll('.evt-row').forEach(el => {
    const yr = +el.dataset.scrollYear;
    el.addEventListener('click', () => window._scrollToYear?.(yr));
  });
  _open();
}

// ── Calamity detail ───────────────────────────────────────────
export function openCalD(idx) {
  const evt    = calamities[idx];
  const nearby = calamities
    .filter(e => Math.abs(e.year - evt.year) < 60)
    .sort((a, b) => a.year - b.year);

  _header().innerHTML = `
    <div class="drawer-church-name">${evt.label}</div>
    <div class="drawer-church-type">${evt.year} · Plague / Epidemic</div>`;

  let html = `<div class="drawer-section">
    <div class="drawer-section-title">Detail</div>
    <div class="drawer-text">${evt.detail}</div>
  </div>
  <div class="drawer-section">
    <div class="drawer-section-title">Other Epidemics</div>
    <div class="drawer-events-list">`;
  nearby.forEach(e => {
    const active = e === evt ? '' : 'opacity:0.45;';
    html += `<div class="evt-row" style="${active}">
      <div class="evt-row-year" style="color:var(--ev-plague)">${e.year}</div>
      <div class="evt-row-dot" style="background:var(--ev-plague)"></div>
      <div class="evt-row-label">${e.label}</div>
    </div>`;
  });
  html += '</div></div>';
  _body().innerHTML = html;
  _open();
}

// ── War detail ───────────────────────────────────────────────
export function openWarD(idx) {
  const evt    = wars[idx];
  const dur    = evt.end - evt.start;
  const nearby = wars
    .filter(e => Math.abs(e.start - evt.start) < 50)
    .sort((a, b) => a.start - b.start);

  _header().innerHTML = `
    <div class="drawer-church-name">${evt.label}</div>
    <div class="drawer-church-type">${evt.start}–${evt.end} · ${dur} year${dur !== 1 ? 's' : ''}</div>`;

  let html = `<div class="drawer-section">
    <div class="drawer-section-title">Detail</div>
    <div class="drawer-text">${evt.detail}</div>
  </div>
  <div class="drawer-section">
    <div class="drawer-section-title">Nearby Conflicts</div>
    <div class="drawer-events-list">`;
  nearby.forEach(e => {
    const active = e === evt ? '' : 'opacity:0.45;';
    html += `<div class="evt-row" style="${active}">
      <div class="evt-row-year" style="color:var(--ev-siege)">${e.start}–${e.end}</div>
      <div class="evt-row-dot" style="background:var(--ev-siege)"></div>
      <div class="evt-row-label">${e.label}</div>
    </div>`;
  });
  html += '</div></div>';
  _body().innerHTML = html;
  _open();
}

// ── Helpers ───────────────────────────────────────────────────
function _typeLabel(type) {
  const map = {
    founded: 'Founded', cornerstone: 'Brick Cornerstone', expansion: 'Expansion',
    denomination: 'Denomination Change', destroyed: 'Destroyed', notable: 'Notable',
  };
  return map[type] || type;
}
