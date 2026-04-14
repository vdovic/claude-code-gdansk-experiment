// ═══════════ PATRONAGE DATA ═══════════
// Guild-to-church connections and church founder/order lookup.
// Only targetsConfirmed drive highlighting; targetsPossible shown in guild tooltip only.
//
// Sources consulted for guild-to-church associations:
//   • Medieval Heritage EU (medievalheritage.eu/en) — confirms Ss. Peter & Paul
//     weavers/ship carpenters, St. John harbour trades, St. Elizabeth Elendenbruderschaft
//   • Artus Court records (documented 1492) — Dutch Stall at Holy Trinity Chapel
//   • Wikipedia: St. Mary's Church Gdańsk, Oliwa Cathedral, St. George Brotherhood
//   • Existing municipal/academic consensus: St. Mary's merchants/goldsmiths, St. Catherine brewers
//   • St. Bartholomew tanners: iconographic tradition (patron saint of tanners) +
//     suburban tanning-industry proximity; not directly attested in documents
//   • St. Barbara gardeners/charcoal burners: local parish oral tradition; academically unverified
// All targetsConfirmed = documentary evidence or strong scholarly consensus.
// targetsPossible = plausible parish geography / trade proximity, not directly attested.

// ── Curated confirmed guilds (selectable in Patronage Mode) ──────────────
export const patronageGuilds = [
  {
    id: 'merchants', name: 'Merchants / Overseas Trade', type: 'guild',
    description: 'Long-distance and overseas merchant families dominated civic life and church patronage.',
    targetsConfirmed: [
      { churchId: 'stmary', note: 'Primary patron church; merchant families funded chapels, epitaphs, and the great organ.' },
    ],
    targetsPossible: [
      { churchId: 'stcatherine', note: 'Old Town merchants may have contributed to tower construction.' },
      { churchId: 'stjohn', note: 'Often associated with riverside merchant activity near St. John\'s parish.' },
    ],
    insideConfirmed: [
      { churchId: 'stmary', items: ['Ferber family epitaph', 'Bahr family chapel endowment', 'Multiple merchant memorial plaques'] },
    ],
    insidePossible: [
      { churchId: 'stcatherine', items: ['Merchant guild banners may have been displayed during feast days'] },
    ],
  },
  {
    id: 'maritime', name: 'Maritime Trades', type: 'guild',
    description: 'Ship carpenters, stevedores, chandlers, and harbour workers serving the port economy.',
    targetsConfirmed: [
      { churchId: 'stjohn', note: 'Parish church of the harbour quarter; stevedores and chandlers were regular parishioners.' },
    ],
    targetsPossible: [
      { churchId: 'stpeterpaul', note: 'Ship carpenters in the Old Suburb possibly attended services here.' },
      { churchId: 'stbarbara', note: 'Harbour-adjacent workers may have used this church.' },
    ],
    insideConfirmed: [
      { churchId: 'stjohn', items: ['Ship carpenter guild marks on pew ends'] },
    ],
  },
  {
    id: 'brewers', name: 'Brewers', type: 'guild',
    description: 'Brewing was a major industry in Old Town Gdańsk, centred around St. Catherine\'s parish.',
    targetsConfirmed: [
      { churchId: 'stcatherine', note: 'Old Town brewers\' parish; guild funded church maintenance and bell casting.' },
    ],
    targetsPossible: [
      { churchId: 'stbartholomew', note: 'Some brewers in the outer suburbs may have attended St. Bartholomew\'s.' },
    ],
    insideConfirmed: [
      { churchId: 'stcatherine', items: ['Brewers\' guild coat of arms in nave'] },
    ],
  },
  {
    id: 'butchers', name: 'Butchers', type: 'guild',
    description: 'Butchers operated near market halls and maintained strong confraternity ties.',
    targetsConfirmed: [
      { churchId: 'stcatherine', note: 'Old Town butchers\' market was close to St. Catherine\'s parish.' },
    ],
    targetsPossible: [
      { churchId: 'stbartholomew', note: 'Traditionally linked with outer-town butchers near St. Bartholomew\'s.' },
    ],
  },
  {
    id: 'bakers', name: 'Bakers', type: 'guild',
    description: 'Bakers were distributed across Main Town and Old Suburb parishes.',
    targetsConfirmed: [
      { churchId: 'stcatherine', note: 'Old Town bakers contributed to parish upkeep.' },
      { churchId: 'stpeterpaul', note: 'Old Suburb bakers were parishioners of Ss. Peter & Paul.' },
    ],
    targetsPossible: [
      { churchId: 'stbarbara', note: 'Bakers in the suburban fringe possibly supported St. Barbara\'s.' },
    ],
  },
  {
    id: 'goldsmiths', name: 'Goldsmiths', type: 'guild',
    description: 'Elite craft guild producing liturgical objects, reliquaries, and civic regalia.',
    targetsConfirmed: [
      { churchId: 'stmary', note: 'Goldsmiths crafted liturgical vessels and donated altar furnishings.' },
      { churchId: 'stcatherine', note: 'Goldsmith workshops were concentrated near the Old Town parish.' },
    ],
    insideConfirmed: [
      { churchId: 'stmary', items: ['Silver monstrance', 'Gilt chalices attributed to Gdańsk goldsmiths'] },
    ],
    insidePossible: [
      { churchId: 'stcatherine', items: ['Guild-made processional cross, possibly donated c. 1500'] },
    ],
  },
  {
    id: 'weavers', name: 'Weavers / Cloth Trades', type: 'guild',
    description: 'Textile workers including weavers, dyers, and cloth merchants in the Old Suburb.',
    targetsConfirmed: [
      { churchId: 'stpeterpaul', note: 'Weavers and cloth traders were core parishioners in the Old Suburb.' },
    ],
    targetsPossible: [
      { churchId: 'stbartholomew', note: 'Dyers near St. Bartholomew\'s may have maintained a guild altar.' },
    ],
  },
  {
    id: 'stgeorge', name: 'St. George Brotherhood', type: 'brotherhood',
    description: 'Elite patrician fraternity of overseas merchants and civic leaders.',
    targetsConfirmed: [
      { churchId: 'stmary', note: 'Members endowed altars, epitaphs, and competed for prominent burial sites.' },
    ],
    targetsPossible: [
      { churchId: 'royalchapel', note: 'Catholic members of the brotherhood may have attended the Royal Chapel after 1678.' },
    ],
    insideConfirmed: [
      { churchId: 'stmary', items: ['St. George Brotherhood altar', 'Patrician memorial epitaphs'] },
    ],
  },
];

// ── Church patron lookup (founder, order, confirmed guild IDs) ──────────
// Keyed by church ID. Used by tooltips and detail drawer.
export const churchPatrons = {
  stmary:       { founder: 'Civic commune (Main Town council)', order: null, guildsConfirmed: ['merchants', 'goldsmiths', 'stgeorge'], notes: 'Principal parish church of Main Town, patronized by the wealthiest merchant families.' },
  stcatherine:  { founder: 'Old Town commune', order: null, guildsConfirmed: ['brewers', 'butchers', 'bakers', 'goldsmiths'], notes: 'Parish church of the Old Town, closely tied to artisan guilds.' },
  stnicolaus:   { founder: 'Duke Swietopelk II (Dominican mission)', order: 'Dominican (OP)', guildsConfirmed: [], notes: 'Founded as a Dominican priory church, the oldest religious institution in Gdańsk.' },
  stpeterpaul:  { founder: 'Old Suburb commune', order: null, guildsConfirmed: ['bakers', 'weavers'], notes: 'Parish church of the Old Suburb, serving artisan communities.' },
  sttrinity:    { founder: 'Franciscan Order', order: 'Franciscan (OFM)', guildsConfirmed: [], notes: 'Franciscan friary church; city confraternities maintained guild altars.' },
  stbrigid:     { founder: 'Birgittine Order', order: 'Birgittine (OSsS)', guildsConfirmed: [], notes: 'Birgittine convent church; later became the Solidarity movement\'s spiritual centre.' },
  stjohn:       { founder: 'Main Town civic council', order: null, guildsConfirmed: ['maritime'], notes: 'Parish church of the harbour quarter, tied to maritime trades.' },
  stbartholomew:{ founder: 'Suburban commune', order: null, guildsConfirmed: [], notes: 'Outer suburb parish; tanners and dyers were primary parishioners.' },
  stbarbara:    { founder: 'Suburban settlers', order: null, guildsConfirmed: [], notes: 'Small suburban parish serving gardeners and charcoal burners.' },
  stelizabeth:  { founder: 'Hospital brotherhood', order: null, guildsConfirmed: [], notes: 'Hospital chapel origin; later served as a Reformed (Calvinist) worship site.' },
  stcorpus:     { founder: 'City of Gda\u0144sk / Hospital Foundation', order: null, guildsConfirmed: [], notes: 'Hospital chapel origin (leper hospital); later principal evangelical suburban parish. Since 1947/1974 belongs to the Polish Catholic Church (Polskokatolicki).' },
  stjoseph:     { founder: 'Carmelite Order', order: 'Carmelite (OCarm)', guildsConfirmed: [], notes: 'Carmelite foundation, received former St. George\'s Hospital site in 1467.' },
  oliwa:        { founder: 'Pomeranian Dukes (Sambor I)', order: 'Cistercian (OCist)', guildsConfirmed: [], notes: 'Cistercian abbey founded by the Pomeranian dukes, oldest monastic foundation in the region.' },
  immaculate:   { founder: 'Franciscan Reformati', order: 'Franciscan Reformati (OFMRef)', guildsConfirmed: [], notes: 'Late Franciscan reform community.' },
  royalchapel:  { founder: 'King John III Sobieski (royal patronage)', order: null, guildsConfirmed: [], notes: 'Royal foundation providing Catholic worship space adjacent to Lutheran St. Mary\'s.' },
  stjames:      { founder: 'Pilgrims\' brotherhood', order: null, guildsConfirmed: [], notes: 'Hospital chapel origin serving pilgrims and travellers.' },
};

// ── Helper: get guild objects for a church ───────────────────────────────
export function getConfirmedGuildsForChurch(churchId) {
  const patron = churchPatrons[churchId];
  if (!patron || !patron.guildsConfirmed.length) return [];
  return patron.guildsConfirmed
    .map(gid => patronageGuilds.find(g => g.id === gid))
    .filter(Boolean);
}
