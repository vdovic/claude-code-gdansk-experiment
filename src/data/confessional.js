// ═══════════ CONFESSIONAL REALIGNMENT DATA ═══════════
// Taxonomy and overlay segments for the 1525–1557 period.
// Applied only to churches directly affected by the 1525 Danzig Tumult.
//
// This is NOT a replacement for denomination bars — it is a supplementary
// overlay that conveys the nuanced, contested confessional reality between
// the tumults (1525) and the formal Protestant settlement (1557).

// ── Allowed confessional statuses (taxonomy) ─────────────────
export const CONFESSIONAL_STATUSES = {
  catholic:                'Catholic',
  lutheran_dominant:       'Lutheran-dominant',
  mixed:                   'Mixed / contested',
  confessional_realignment:'Confessional Realignment',
  seized:                  'Seized',
  order_expelled:          'Order expelled',
  monastic_life_suspended: 'Monastic life suspended',
  restored_catholic:       'Restored Catholic',
  secularized:             'Secularized',
  destroyed_structurally:  'Structurally destroyed',
};

// ── Churches directly affected by the 1525 tumults ───────────
export const affectedBy1525 = [
  'stnicolaus',  // Dominican — attacked but survived; unique continuous Catholic presence
  'sttrinity',   // Franciscan — friars expelled; church intact, later Academic Gymnasium
  'stbrigid',    // Birgittine — convent disrupted; nuns eventually departed
  'stcorpus',    // Carmelite — monks violently expelled; church structure survived
  'stjoseph',    // Carmelite — disrupted, Carmelites eventually returned
];

// ── Confessional overlay phases per church ────────────────────
// Each church gets an array of phase objects rendered as overlay bands.
// `micro` sub-phases appear in the tooltip only (no extra visual markers).
export const confessionalPhases = {

  stnicolaus: [
    {
      start: 1525,
      end: 1557,
      status: 'confessional_realignment',
      label: 'Confessional Realignment',
      tooltipTitle: 'Confessional Realignment (1525\u20131557)',
      tooltipBody: [
        'Dominican community attacked in 1525 tumults but maintained presence.',
        'Only major Gda\u0144sk church to remain Catholic continuously throughout the Reformation.',
      ],
      micro: [
        {
          start: 1525,
          end: 1526,
          status: 'monastic_life_suspended',
          label: 'Tumults & Royal Response',
          tooltipBody: [
            '1525: mob attack on Dominican friary; community survived through civic ties.',
            '1526: royal intervention restored order; Dominican worship continued unbroken.',
          ],
        },
      ],
    },
  ],

  sttrinity: [
    {
      start: 1525,
      end: 1557,
      status: 'confessional_realignment',
      label: 'Confessional Realignment',
      tooltipTitle: 'Confessional Realignment (1525\u20131557)',
      tooltipBody: [
        'Franciscans expelled in 1525; church structure remained intact.',
        'Monastery repurposed as Academic Gymnasium (1556); church formally Lutheran from 1557.',
      ],
      micro: [
        {
          start: 1525,
          end: 1526,
          status: 'order_expelled',
          label: 'Tumults & Expulsion',
          tooltipBody: [
            '1525: Protestant mobs expelled Franciscan friars from the monastery.',
            '1526: Royal intervention stabilised civic order; building remained in civic hands.',
          ],
        },
      ],
    },
  ],

  stbrigid: [
    {
      start: 1525,
      end: 1587,
      status: 'confessional_realignment',
      label: 'Confessional Realignment',
      tooltipTitle: 'Confessional Realignment (1525\u20131587)',
      tooltipBody: [
        'Birgittine convent disrupted during 1525 tumults; King Sigismund I intervened.',
        'Nuns gradually departed; church became Lutheran parish by 1587.',
      ],
      micro: [
        {
          start: 1525,
          end: 1526,
          status: 'monastic_life_suspended',
          label: 'Tumults & Royal Intervention',
          tooltipBody: [
            '1525: convent attacked during religious unrest; property damaged.',
            '1526: King Sigismund I intervened to restore order; monastic life disrupted but not immediately ended.',
          ],
        },
      ],
    },
  ],

  stcorpus: [
    {
      start: 1525,
      end: 1557,
      status: 'confessional_realignment',
      label: 'Confessional Realignment',
      tooltipTitle: 'Confessional Realignment (1525\u20131557)',
      tooltipBody: [
        'Carmelite monks violently expelled in 1525; church building survived.',
        'Former monastery church transitioned to Lutheran parish use by 1557.',
      ],
      micro: [
        {
          start: 1525,
          end: 1526,
          status: 'order_expelled',
          label: 'Tumults & Expulsion',
          tooltipBody: [
            '1525: Carmelite monks violently expelled during Danzig Tumult.',
            '1526: Royal intervention; church remained in civic custody.',
          ],
        },
      ],
    },
  ],

  stjoseph: [
    {
      start: 1525,
      end: 1557,
      status: 'confessional_realignment',
      label: 'Confessional Realignment',
      tooltipTitle: 'Confessional Realignment (1525\u20131557)',
      tooltipBody: [
        'Carmelite community disrupted in 1525 tumults; monks eventually returned.',
        'Church maintained Catholic identity throughout; one of few never to change denomination.',
      ],
      micro: [
        {
          start: 1525,
          end: 1526,
          status: 'monastic_life_suspended',
          label: 'Tumults & Disruption',
          tooltipBody: [
            '1525: Carmelite monastery disrupted during religious unrest.',
            '1526: Royal intervention; Carmelites eventually resumed monastic life.',
          ],
        },
      ],
    },
  ],
};

// ── Helper: get confessional phases for a church ─────────────
export function getConfessionalPhases(churchId) {
  return confessionalPhases[churchId] || [];
}

// ── Helper: check if a church is in the affected set ─────────
export function isAffectedBy1525(churchId) {
  return affectedBy1525.includes(churchId);
}
