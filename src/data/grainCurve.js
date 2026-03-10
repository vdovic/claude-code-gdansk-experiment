// ═══════════ GRAIN CURVE HELPERS ═══════════
// Interpolation functions for the grain export and ship traffic series.
// Used by: minimap area graph, main-track tooltip, and rendering.
// The underlying data lives in economic.js — this module adds NO synthetic data.

import { grainExport, shipTraffic } from './economic.js';

// ── Linear interpolation with endpoint clamping (no extrapolation) ──────────

function lerp(series, year, key) {
  const n = series.length;
  if (year <= series[0].year)     return series[0][key];
  if (year >= series[n - 1].year) return series[n - 1][key];
  let lo = 0, hi = n - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (series[mid].year <= year) lo = mid;
    else                          hi = mid - 1;
  }
  const t = (year - series[lo].year) / (series[lo + 1].year - series[lo].year);
  return series[lo][key] + t * (series[lo + 1][key] - series[lo][key]);
}

// ── Pre-computed constants ──────────────────────────────────────────────────

export const GRAIN_MAX = Math.max(...grainExport.map(d => d.val));   // 1 000 000 t (year 2000)
export const SHIPS_MAX = Math.max(...shipTraffic.map(d => d.ships)); // 2800 (year 1900)

// ── Public interpolation API ────────────────────────────────────────────────

/** Grain export in metric tonnes at any year (linear interpolation). */
export function getGrainValue(year) {
  return lerp(grainExport, year, 'val');
}

/** Ship traffic (vessels/year) at any year (linear interpolation). */
export function getShipsValue(year) {
  return lerp(shipTraffic, year, 'ships');
}

/**
 * Ships trend arrow for a ±15-year window:
 *   ↑  rising (>+10%)
 *   ↓  falling (>-10%)
 *   →  stable
 */
export function getShipsTrend(year) {
  const now  = getShipsValue(year);
  const prev = getShipsValue(year - 15);
  const ratio = now / Math.max(prev, 1);
  if (ratio > 1.10) return '↑';
  if (ratio < 0.90) return '↓';
  return '→';
}
