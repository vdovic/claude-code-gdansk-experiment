// ═══════════ CLUSTER & SIMILARITY DATA ═══════════
// Clusters group churches by architectural/historical profile
// Capacity-based sizing: Large (≥3000), Medium (1000–2999), Small (<1000)

export const clusterDefs = [
  {id:'A', label:'Large',   color:'#2a6a48',
   desc:'Large churches (capacity ≥ 3000): the dominant landmarks of the cityscape.',
   members:['stmary','stcatherine','stnicolaus','stpeterpaul','stjohn','sttrinity','oliwa']},
  {id:'B', label:'Medium',  color:'#5a3a8a',
   desc:'Medium churches (capacity 1000–2999): significant parish and monastic churches serving defined communities.',
   members:['stbrigid','stcorpus','stjoseph','stbartholomew','stbarbara','stelizabeth','stjames']},
  {id:'C', label:'Small',   color:'#a05520',
   desc:'Small churches (capacity < 1000): intimate chapels and minor foundations, often outside the main fortifications.',
   members:['royalchapel','immaculate']},
];

// ── Similarity distance matrix ────────────────────────────────
// Computed at startup from each church's feature vector so that adding
// a new church never requires manually editing this file.
//
// Features used (7, weighted Euclidean):
//   cornerstoneYear  — architectural era / age similarity       weight 0.15
//   height           — building scale                           weight 0.20
//   capacity         — congregation size / civic importance     weight 0.25
//   lat, lon         — geographic proximity                     weight 0.08 each
//   catholicFrac     — share of lifespan spent Catholic         weight 0.12
//   lutheranFrac     — share of lifespan spent Lutheran         weight 0.12
//
// Each feature is min–max normalised to [0,1] across all churches before
// weighting, so no single dimension dominates due to unit differences.
// Distances are in [0, 1] (max possible = sqrt(sum of weights) = 1.0).
// Row/column order matches the churches array order exactly.
export function computeDistMatrix(churches) {
  // ── Feature helpers ──────────────────────────────────────────
  function denomYears(ch, type) {
    return ch.denomBars
      .filter(b => b.type === type)
      .reduce((acc, b) => acc + (b.end - b.start), 0);
  }
  function totalSpan(ch) {
    if (!ch.denomBars.length) return 1;
    const s = Math.min(...ch.denomBars.map(b => b.start));
    const e = Math.max(...ch.denomBars.map(b => b.end));
    return Math.max(1, e - s);
  }

  // ── Raw feature vectors ──────────────────────────────────────
  const raw = churches.map(ch => [
    ch.cornerstoneYear       || 1500,
    ch.height                || 0,
    ch.capacity              || 0,
    ch.lat,
    ch.lon,
    denomYears(ch, 'catholic')  / totalSpan(ch),
    denomYears(ch, 'lutheran')  / totalSpan(ch),
  ]);

  const WEIGHTS = [0.15, 0.20, 0.25, 0.08, 0.08, 0.12, 0.12];
  const F = raw[0].length; // number of features

  // ── Min–max normalise each feature across all churches ───────
  const mins = Array.from({length: F}, (_, k) => Math.min(...raw.map(r => r[k])));
  const maxs = Array.from({length: F}, (_, k) => Math.max(...raw.map(r => r[k])));
  const norm = raw.map(r =>
    r.map((v, k) => (maxs[k] - mins[k]) > 0 ? (v - mins[k]) / (maxs[k] - mins[k]) : 0)
  );

  // ── Weighted Euclidean distance matrix ───────────────────────
  const n = churches.length;
  return Array.from({length: n}, (_, i) =>
    Array.from({length: n}, (_, j) => {
      if (i === j) return 0;
      const d = norm[i].reduce((acc, vi, k) => acc + WEIGHTS[k] * (vi - norm[j][k]) ** 2, 0);
      return +Math.sqrt(d).toFixed(3);
    })
  );
}
