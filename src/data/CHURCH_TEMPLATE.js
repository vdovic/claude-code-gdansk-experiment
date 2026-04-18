// ═══════════ CHURCH RECORD TEMPLATE ═══════════
// Copy this file, rename it (e.g. src/data/churches/mynewchurch.js),
// fill in the fields, then add the record to the churches array in churches.js.
//
// REQUIRED fields are marked  ← REQUIRED
// OPTIONAL fields are marked  ← OPTIONAL (omit if unknown; use null for numbers)
//
// Valid enum values for key fields:
//   origin:  'parish' | 'monastic' | 'hospital'
//   status:  'cathedral' | 'basilique' | 'church' | 'chapel'
//   event type: 'founded' | 'cornerstone' | 'expansion' | 'denomination'
//               | 'destroyed' | 'notable' | 'tumult'
//   denomBar type: 'catholic' | 'lutheran' | 'calvinist' | 'armenian'
//                  | 'polish_catholic' | 'secular'

export const CHURCH_TEMPLATE = {

  // ── Identity ──────────────────────────────────────────────────
  id:            'mynewchurch',              // ← REQUIRED  unique camelCase/lowercase string,
                                             //             used as key across clusters.js,
                                             //             districts1450.js, patronage.js, etc.
  name:          'Full Church Name',         // ← REQUIRED  displayed in timeline label + detail panel
  shortName:     'Short Name',              // ← REQUIRED  used in map pin tooltip (≤ 20 chars)

  // ── Physical characteristics ──────────────────────────────────
  height:        30,                         // ← OPTIONAL  tower/nave height in metres (integer)
  capacity:      500,                        // ← OPTIONAL  approximate seating capacity (integer)
  cornerstoneYear: 1400,                     // ← REQUIRED  year of first brick construction

  // ── Geography ────────────────────────────────────────────────
  lat:           54.352,                     // ← REQUIRED  decimal degrees (WGS-84)
  lon:           18.651,                     //             use the click-helper in map.js to get
                                             //             coords that align with the historic map overlay

  // ── Classification ───────────────────────────────────────────
  origin:        'parish',                   // ← REQUIRED  see valid values above
  status:        'church',                   // ← REQUIRED  see valid values above
  order:         null,                       // ← OPTIONAL  e.g. 'Dominican (OP)' | 'Carmelite (OCarm)'
                                             //             null if no religious order

  // ── Guardianship (current / most recent custodian) ───────────
  guardianship: {
    name:        'Diocesan',                 // ← OPTIONAL  current guardian organisation
    since:       null,                       //             year they took over (integer or null)
  },

  // ── Guild / financial patrons ────────────────────────────────
  guilds: [                                  // ← OPTIONAL  array of strings; [] if none
    'Merchants',
    'Goldsmiths',
  ],

  // ── Parish symbol ────────────────────────────────────────────
  symbol: {
    emoji:       '⛪',                        // ← OPTIONAL  Unicode emoji for quick visual ID
    desc:        'Description of the symbol', //            full description for accessibility
    colors:      'Colors used',              //            e.g. 'Gold on blue field'
  },

  // ── Organ ────────────────────────────────────────────────────
  organ: {
    has:         true,                       // ← REQUIRED  boolean
    year:        1850,                       // ← OPTIONAL  year of current/most notable organ (or null)
    desc:        'Organ description.',       // ← OPTIONAL  free text
  },

  // ── Interesting facts (shown in detail panel) ────────────────
  facts: [                                   // ← OPTIONAL  array of strings; [] if none
    'Notable fact 1.',
    'Notable fact 2.',
  ],

  // ── Relics & treasures ──────────────────────────────────────
  relics:        'Key artworks and relics held.',  // ← OPTIONAL  free text or null

  // ── Social history ──────────────────────────────────────────
  parishioners1500: 'Who worshipped here c. 1500.',// ← OPTIONAL  free text or null
  tax1500:          'Estimated parish revenues.',   // ← OPTIONAL  free text or null

  // ── External links ──────────────────────────────────────────
  photoLinks: [                              // ← OPTIONAL  array of {label, url}
    { label: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/...' },
    { label: 'Wikipedia', url: 'https://en.wikipedia.org/...' },
  ],
  sources: [                                 // ← OPTIONAL  array of {title, url}
    { title: 'Wikipedia article', url: 'https://en.wikipedia.org/...' },
  ],

  // ── Timeline events ──────────────────────────────────────────
  // Each event creates a shaped dot on the church's timeline row.
  // type → shape:  founded=circle, cornerstone=diamond, expansion=square,
  //                denomination=hexagon, destroyed=cross, notable=triangle, tumult=triangle-down
  events: [                                  // ← REQUIRED  at minimum one event
    {
      year:   1380,                          // ← REQUIRED  integer year
      type:   'founded',                     // ← REQUIRED  see valid types above
      label:  'Church founded',             // ← REQUIRED  short label (shown on hover)
      detail: 'Longer description shown in the detail panel tooltip.',  // ← REQUIRED
    },
    {
      year:   1400,
      type:   'cornerstone',
      label:  'Cornerstone laid',
      detail: 'Construction of the Gothic nave began.',
    },
    // Add more events as needed…
  ],

  // ── Denomination bars ─────────────────────────────────────────
  // Each bar is a continuous coloured band on the timeline.
  // Bars should not overlap and ideally cover the full lifespan.
  // The LAST bar's end year is used as the church's "end" in similarity calculations.
  denomBars: [                               // ← REQUIRED  at minimum one bar
    { start: 1380, end: 1557, type: 'catholic'  },
    { start: 1557, end: 1945, type: 'lutheran'  },
    { start: 1947, end: 2000, type: 'catholic'  },
    // Valid types: 'catholic' | 'lutheran' | 'calvinist' | 'armenian'
    //              | 'polish_catholic' | 'secular'
  ],
};

// ── After filling in the template ─────────────────────────────
// Files to update when adding a new church (in this order):
//   1. src/data/churches.js        — add the record to the churches array
//   2. src/data/clusters.js        — add the id to a cluster's members array (A/B/C)
//   3. src/data/districts1450.js   — add  id: 'District Name'  entry
//   4. src/data/symbolMeanings.js  — add 2–4 heraldic symbol explanations (REQUIRED)
//   5. src/data/patrons.js         — add patron section: 10 facts + wiki link (REQUIRED)
//   6. src/data/patronage.js       — (optional) add patron saint / founder / guild links
//   7. src/data/confessional.js    — (optional) add confessional / order notes
// distMatrix in state.js auto-recomputes — no manual action needed.
// See docs/adding-a-church.md for the full checklist.
