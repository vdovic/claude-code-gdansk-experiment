// ═══════════ THEME MODULE ═══════════
// Single source of truth for denomination colors, event colors,
// event marker shapes, and UI neutral tokens.
// CSS custom properties remain the visual layer; this module
// provides JS-accessible constants for rendering logic.

// ── Denomination colours ──────────────────────────────────────
export const denominationColors = {
  catholic:  '#c0463a',
  lutheran:  '#3a7a9e',
  calvinist: '#5a8a4a',
  armenian:  '#c0842a',
  secular:   '#8a8a90',
};

export const denominationNames = {
  catholic:  'Catholic',
  lutheran:  'Lutheran',
  calvinist: 'Calvinist',
  armenian:  'Armenian Cath.',
  secular:   'Secular',
};

// ── Event-type colours ────────────────────────────────────────
export const eventColors = {
  founded:      'var(--ev-founded)',
  cornerstone:  'var(--ev-cornerstone)',
  expansion:    'var(--ev-expansion)',
  denomination: 'var(--ev-denomination)',
  destroyed:    'var(--ev-destroyed)',
  notable:      'var(--ev-notable)',
  tumult:       'var(--ev-tumult)',
};

// ── Event-type shapes (non-colour encoding for accessibility) ─
// Each event type maps to a shape + SVG generator function.
// Shapes make event types distinguishable without relying on colour.
export const eventShapes = {
  founded:      { shape: 'circle',   label: 'Founded',              desc: 'Church first established or consecrated' },
  cornerstone:  { shape: 'diamond',  label: 'Cornerstone laid',     desc: 'Physical cornerstone or construction start' },
  expansion:    { shape: 'square',   label: 'Expansion / addition', desc: 'Major structural addition or enlargement' },
  denomination: { shape: 'hexagon',       label: 'Denomination change',  desc: 'Change in confessional affiliation' },
  destroyed:    { shape: 'cross',         label: 'Destruction',          desc: 'Significant structural destruction' },
  notable:      { shape: 'triangle',      label: 'Notable event',        desc: 'Important historical event at the church' },
  tumult:       { shape: 'triangle-down', label: 'Tumult / riot',        desc: 'Religious riot or violent attack on the church' },
};

// Generate SVG marker for a given event type and colour.
// Size is 13x13 to match existing dot dimensions.
export function eventMarkerSVG(type, color, size = 13) {
  const s = size;
  const half = s / 2;
  const shape = eventShapes[type]?.shape || 'circle';

  switch (shape) {
    case 'circle':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${half}" cy="${half}" r="${half - 1}" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;

    case 'diamond':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect x="${half - 4.5}" y="${half - 4.5}" width="9" height="9" rx="1.5" fill="${color}" transform="rotate(45 ${half} ${half})" stroke="white" stroke-width="1"/></svg>`;

    case 'square':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect x="1.5" y="1.5" width="${s - 3}" height="${s - 3}" rx="2" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;

    case 'triangle':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${half},1.5 ${s - 1.5},${s - 1.5} 1.5,${s - 1.5}" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;

    case 'triangle-down':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${half},${s - 1.5} ${s - 1.5},1.5 1.5,1.5" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;

    case 'cross': {
      const arm = 2;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">` +
        `<line x1="2.5" y1="2.5" x2="${s - 2.5}" y2="${s - 2.5}" stroke="${color}" stroke-width="${arm}" stroke-linecap="round"/>` +
        `<line x1="${s - 2.5}" y1="2.5" x2="2.5" y2="${s - 2.5}" stroke="${color}" stroke-width="${arm}" stroke-linecap="round"/>` +
        `</svg>`;
    }

    case 'hexagon': {
      const r = half - 1.5;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
      }).join(' ');
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${pts}" fill="${color}" stroke="white" stroke-width="1.2"/></svg>`;
    }

    default:
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${half}" cy="${half}" r="${half - 1}" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
  }
}

// Generate a small inline legend shape swatch (8x8).
export function legendShapeSVG(shape, color, size = 10) {
  return eventMarkerSVG({ circle: 'founded', diamond: 'cornerstone', square: 'expansion', triangle: 'notable', cross: 'destroyed', hexagon: 'denomination' }[shape] || 'founded', color, size);
}

// ── Global context marker shapes (outlined / stroke-only) ───────
// Visually distinct from church event markers (which are filled).
export function ctxMarkerSVG(track, color, size = 11) {
  const s = size;
  const half = s / 2;

  switch (track) {
    case 'political': // outlined diamond
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect x="${half - 3.5}" y="${half - 3.5}" width="7" height="7" rx="1" fill="none" stroke="${color}" stroke-width="2" transform="rotate(45 ${half} ${half})"/></svg>`;

    case 'religious': { // 5-pointed star outline
      const r = half - 1;
      const ri = r * 0.38;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const rad = (i % 2 === 0 ? r : ri);
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        return `${half + rad * Math.cos(angle)},${half + rad * Math.sin(angle)}`;
      }).join(' ');
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    }

    case 'plagues': // outlined inverted triangle
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${half},${s - 1} 1,1 ${s - 1},1" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;

    case 'fires': { // outlined upward triangle (flame shape)
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${half},1 ${s-1},${s-1} 1,${s-1}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    }

    case 'floods': { // outlined teardrop/raindrop
      const cy = half + 1;
      const ry = half - 2;
      const rx2 = half - 2;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">` +
        `<path d="M${half},1.5 C${half+rx2*0.7},${half-ry*0.1} ${half+rx2},${cy-ry*0.3} ${half+rx2},${cy} ` +
        `A${rx2},${ry} 0 0 1 ${half-rx2},${cy} C${half-rx2},${cy-ry*0.3} ${half-rx2*0.7},${half-ry*0.1} ${half},1.5 Z" ` +
        `fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    }

    case 'urbanPower': { // outlined hexagon
      const r = half - 1;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
      }).join(' ');
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
    }

    default:
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${half}" cy="${half}" r="${half - 1}" fill="none" stroke="${color}" stroke-width="1.5"/></svg>`;
  }
}

// ── UI neutral palette (for reference, actual values live in CSS) ──
export const uiNeutrals = {
  bgBase:       'var(--bg-base)',
  bgSurface:    'var(--bg-surface)',
  bgElevated:   'var(--bg-elevated)',
  bgHover:      'var(--bg-hover)',
  textPrimary:  'var(--text-primary)',
  textSecondary:'var(--text-secondary)',
  textMuted:    'var(--text-muted)',
  accent:       'var(--accent)',
  accentHover:  'var(--accent-hover)',
};
