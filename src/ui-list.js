// ═══════════ CHURCH LIST MODULE ═══════════
// Builds and manages the Churches tab: sortable/filterable comparison
// table, search bar, and row-click → detail drawer behaviour.
// Extracted from the inline <script type="module"> block in index.html.

import { churches }               from './data/churches.js';
import { denomColors }            from './state.js';
import { clusterDefs }            from './data/clusters.js';
import { churchPatrons }          from './data/patronage.js';
import { district1450ByChurchId } from './data/districts1450.js';
import { openCD }                 from './detail.js';
import { switchTab }              from './ui.js';
import { isMobileScreen }         from './utils/viewport.js';

// ── Local filter/sort state ──
const lf = {
  status:  new Set(),
  origin:  new Set(),
  organ:   new Set(),
  cluster: new Set(),
  sort:    'cornerstone',
  dir:     1,           // 1 = asc, -1 = desc
};

function _toggle(set, val) { set.has(val) ? set.delete(val) : set.add(val); }
function getCluster(id)    { return clusterDefs.find(cl => cl.members.includes(id)) || null; }

// ── Helper: derive a short Type/Order label ──
function typeLabel(ch) {
  const p = churchPatrons[ch.id];
  if (p?.order) return p.order.replace(/\s*\([^)]*\)/, '');   // strip "(OP)" etc.
  if (ch.origin === 'hospital') return 'Hospital';
  if (ch.origin === 'monastic') return 'Monastic';
  return 'Parish';
}

// ── Helper: founded year (first 'founded' event, else null) ──
function foundedYear(ch) {
  const ev = ch.events.find(e => e.type === 'founded');
  return ev ? ev.year : null;
}

// ── Sort comparators (operate on ch objects) ──
const sorters = {
  founded:     (a, b) => {
    // Fall back to cornerstoneYear so churches without a 'founded' event sort sensibly
    const fa = foundedYear(a) ?? a.cornerstoneYear;
    const fb = foundedYear(b) ?? b.cornerstoneYear;
    return (fa - fb) * lf.dir;
  },
  cornerstone: (a, b) => (a.cornerstoneYear - b.cornerstoneYear) * lf.dir,
  name:        (a, b) => a.name.localeCompare(b.name) * lf.dir,
  district:    (a, b) => {
    const da = district1450ByChurchId[a.id] || 'zzz';
    const db = district1450ByChurchId[b.id] || 'zzz';
    return da.localeCompare(db) * lf.dir;
  },
  founder:     (a, b) => {
    const fa = churchPatrons[a.id]?.founder || 'zzz';
    const fb = churchPatrons[b.id]?.founder || 'zzz';
    return fa.localeCompare(fb) * lf.dir;
  },
  height:      (a, b) => ((b.height || 0) - (a.height || 0)) * lf.dir,
  capacity:    (a, b) => ((b.capacity || 0) - (a.capacity || 0)) * lf.dir,
};

// ── Column definitions ──
// sortKey null → not sortable
const COLS = [
  { key: 'name',        label: 'Church',          sortKey: 'name'        },
  { key: 'founded',     label: 'Founded',          sortKey: 'founded'     },
  { key: 'year',        label: '1st Brick',        sortKey: 'cornerstone' },
  { key: 'district',    label: 'District',         sortKey: 'district'    },
  { key: 'type',        label: 'Origin & Order',   sortKey: null          },
  { key: 'founder',     label: 'Founded By',       sortKey: 'founder'     },
  { key: 'height',      label: 'Height',           sortKey: 'height'      },
  { key: 'capacity',    label: 'Capacity',         sortKey: 'capacity'    },
  { key: 'guilds',      label: 'Guild Patrons',    sortKey: null          },
  { key: 'guardian',    label: 'Guardianship',     sortKey: null          },
];

// ── Build filter bar (no Sort section — table headers handle sorting) ──
function buildListFilters() {
  const el = document.getElementById('listFilters');
  if (!el) return;

  function chip(label, on, action) {
    return `<span class="lf-chip ${on ? 'on' : ''}" data-action="${action}">${label}</span>`;
  }

  let html = '';

  html += `<span class="lf-label">Status:</span><span class="lf-group">`;
  html += chip('Cathedral', lf.status.has('cathedral'), 'status:cathedral');
  html += chip('Basilica',  lf.status.has('basilique'), 'status:basilique');
  html += chip('Church',    lf.status.has('church'),    'status:church');
  html += `</span><span class="lf-sep"></span>`;

  html += `<span class="lf-label">Type:</span><span class="lf-group">`;
  html += chip('Parish',   lf.origin.has('parish'),   'origin:parish');
  html += chip('Monastic', lf.origin.has('monastic'), 'origin:monastic');
  html += chip('Hospital', lf.origin.has('hospital'), 'origin:hospital');
  html += `</span><span class="lf-sep"></span>`;

  html += `<span class="lf-label">Size:</span><span class="lf-group">`;
  html += chip('Large',  lf.cluster.has('A'), 'cluster:A');
  html += chip('Medium', lf.cluster.has('B'), 'cluster:B');
  html += chip('Small',  lf.cluster.has('C'), 'cluster:C');
  html += `</span><span class="lf-sep"></span>`;

  html += `<span class="lf-label">Organ:</span><span class="lf-group">`;
  html += chip('Has', lf.organ.has('has'),  'organ:has');
  html += chip('No',  lf.organ.has('none'), 'organ:none');
  html += `</span>`;

  const hasAny = lf.status.size || lf.origin.size || lf.organ.size || lf.cluster.size;
  if (hasAny) {
    html += `<span class="lf-sep"></span>`;
    html += `<span class="lf-chip" data-action="clear" style="border-color:var(--ev-destroyed);color:var(--ev-destroyed)">✕ Clear</span>`;
  }

  el.innerHTML = html;
  el.querySelectorAll('.lf-chip').forEach(c => {
    c.addEventListener('click', () => {
      const act = c.dataset.action || '';
      if (act === 'clear') { lf.status.clear(); lf.origin.clear(); lf.organ.clear(); lf.cluster.clear(); }
      else {
        const [type, val] = act.split(':');
        if (type === 'status')  _toggle(lf.status, val);
        if (type === 'origin')  _toggle(lf.origin, val);
        if (type === 'organ')   _toggle(lf.organ, val);
        if (type === 'cluster') _toggle(lf.cluster, val);
      }
      rebuild();
    });
  });
}

// ── Build comparison table ──
function buildChurchTable() {
  const el = document.getElementById('listScroll');
  if (!el) return;
  const q = (document.getElementById('listSearchInput')?.value || '').toLowerCase().trim();

  // Filter
  const filtered = churches
    .map((ch, ci) => ({ ch, ci }))
    .filter(({ ch }) => {
      if (q && !ch.name.toLowerCase().includes(q) && !ch.shortName.toLowerCase().includes(q)) return false;
      if (lf.status.size && !lf.status.has(ch.status))  return false;
      if (lf.origin.size && !lf.origin.has(ch.origin))  return false;
      if (lf.organ.size) {
        const has = ch.organ && ch.organ.has;
        if (!((lf.organ.has('has') && has) || (lf.organ.has('none') && !has))) return false;
      }
      if (lf.cluster.size) {
        const cl = getCluster(ch.id);
        if (!cl || !lf.cluster.has(cl.id)) return false;
      }
      return true;
    });

  // Sort
  const sortFn = sorters[lf.sort] || sorters.cornerstone;
  filtered.sort((a, b) => sortFn(a.ch, b.ch));

  if (filtered.length === 0) {
    el.innerHTML = `<div style="padding:40px 20px;text-align:center;color:var(--text-muted);font-family:var(--font-ui);font-size:13px;">No churches match the current filters.</div>`;
    return;
  }

  // Table headers with sort indicators
  let thHtml = COLS.map(col => {
    if (!col.sortKey) return `<th class="ct-th">${col.label}</th>`;
    const active = lf.sort === col.sortKey;
    const arrow  = active ? (lf.dir === 1 ? ' ↑' : ' ↓') : '';
    return `<th class="ct-th ct-sortable${active ? ' ct-sort-active' : ''}" data-sortkey="${col.sortKey}">${col.label}${arrow}</th>`;
  }).join('');

  // Table rows
  let rowsHtml = filtered.map(({ ch, ci }) => {
    const latestDenom  = ch.denomBars[ch.denomBars.length - 1];
    const col          = latestDenom ? (denomColors[latestDenom.type] || '#888') : '#888';
    const symHtml      = ch.symbol
      ? `<span class="ct-sym" title="${ch.symbol.desc}">${ch.symbol.emoji}</span>`
      : `<span class="ct-dot" style="background:${col}"></span>`;
    const patron       = churchPatrons[ch.id] || {};
    const founderTxt   = patron.founder
      ? patron.founder.replace(/\s*\([^)]*\)/, '')   // strip long parenthetical
      : '—';
    const fy           = foundedYear(ch);
    const foundedTxt   = fy ? fy : '—';
    const districtTxt  = district1450ByChurchId[ch.id] || '—';
    const typeTxt      = typeLabel(ch);
    const heightTxt    = ch.height   ? ch.height + ' m'   : '—';
    const capacityTxt  = ch.capacity ? ch.capacity.toLocaleString() : '—';
    const guilds       = ch.guilds && ch.guilds.length ? ch.guilds.join(', ') : '—';
    const g            = ch.guardianship;
    const guardianTxt  = g
      ? g.name + (g.since ? ` · ${g.since}` : '')
      : '—';

    return `<tr class="ct-row" data-ci="${ci}">
      <td class="ct-td ct-name" title="${ch.name}"><div class="ct-name-inner">${symHtml}<span class="ct-name-text">${ch.shortName}</span></div></td>
      <td class="ct-td ct-year">${foundedTxt}</td>
      <td class="ct-td ct-year">${ch.cornerstoneYear}</td>
      <td class="ct-td ct-district" title="${districtTxt}">${districtTxt}</td>
      <td class="ct-td ct-type" title="${typeTxt}">${typeTxt}</td>
      <td class="ct-td ct-founder" title="${founderTxt}">${founderTxt}</td>
      <td class="ct-td ct-num">${heightTxt}</td>
      <td class="ct-td ct-num">${capacityTxt}</td>
      <td class="ct-td ct-guilds" title="${guilds}"><div class="ct-clip">${guilds}</div></td>
      <td class="ct-td ct-guardian" title="${guardianTxt}"><div class="ct-clip ct-guardian-txt">${guardianTxt}</div></td>
    </tr>`;
  }).join('');

  // Column widths (px) must match COLS order exactly — used with table-layout:fixed
  const colWidths = [132, 52, 60, 108, 88, 148, 50, 64, 232, 196];
  const colgroupHtml = `<colgroup>${colWidths.map(w => `<col style="width:${w}px">`).join('')}</colgroup>`;

  el.innerHTML = `<table class="church-table">${colgroupHtml}
    <thead><tr>${thHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>`;

  // Sort-header clicks
  el.querySelectorAll('.ct-sortable').forEach(th => {
    th.addEventListener('click', () => {
      const sk = th.dataset.sortkey;
      if (lf.sort === sk) { lf.dir = -lf.dir; }
      else               { lf.sort = sk; lf.dir = 1; }
      buildChurchTable();
    });
  });

  // Row click → open detail drawer.
  // On mobile we stay on the Churches tab — the drawer slides up on top.
  // On desktop we switch to the Timeline first so the church bar is visible.
  el.querySelectorAll('.ct-row').forEach(row => {
    row.addEventListener('click', () => {
      const ci = +row.dataset.ci;
      const mobile = document.body.dataset.viewport === 'mobile' || isMobileScreen();
      if (mobile) {
        openCD(ci, 0);          // drawer on top of Churches tab — no tab switch
      } else {
        switchTab('timeline');  // desktop: reveal church bar first
        setTimeout(() => openCD(ci, 0), 200);
      }
    });
  });
}

function rebuild() { buildListFilters(); buildChurchTable(); }

document.addEventListener('DOMContentLoaded', () => {
  rebuild();

  // ── Search bar (collapsible) ──
  const toggle   = document.getElementById('listSearchToggle');
  const collapse = document.getElementById('listSearchCollapsible');
  const input    = document.getElementById('listSearchInput');
  const clearBtn = document.getElementById('listSearchClear');

  function openSearch() {
    collapse.classList.add('open');
    toggle?.classList.add('active');
    input?.focus();
  }
  function closeSearch() {
    collapse.classList.remove('open');
    toggle?.classList.remove('active');
    if (input) { input.value = ''; buildChurchTable(); }
    clearBtn?.classList.remove('visible');
  }

  toggle?.addEventListener('click', () => {
    collapse.classList.contains('open') ? closeSearch() : openSearch();
  });
  clearBtn?.addEventListener('click', closeSearch);
  input?.addEventListener('input', () => {
    buildChurchTable();
    clearBtn?.classList.toggle('visible', (input.value.length > 0));
  });
  // Close search on Escape
  input?.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
});
