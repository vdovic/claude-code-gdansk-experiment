// ═══════════ DISTRICT 1450 SPATIAL MAPPING ═══════════
// Historical spatial classification of churches in Gdańsk c. 1450.
// This is a static snapshot — not a time-dynamic district evolution system.

export const district1450ByChurchId = {
  // Main Town (Rechtsstadt)
  stmary: 'Main Town',
  stjohn: 'Main Town',
  stnicolaus: 'Main Town',
  royalchapel: 'Main Town',

  // Old Town (Altstadt)
  stcatherine: 'Old Town',
  stbrigid: 'Old Town',
  stelizabeth: 'Old Town',
  stjoseph: 'Old Town',
  stcorpus: 'Old Town',

  // Young Town (Jungen Stadt)
  stbartholomew: 'Young Town',
  stjames: 'Young Town',

  // Old Suburb (Alte Vorstadt)
  stpeterpaul: 'Old Suburb',
  sttrinity: 'Old Suburb',

  // Eastern Suburb (Östliche Vorstadt)
  stbarbara: 'Eastern Suburb',

  // Outside City Proper
  oliwa: 'Outside City',

  // Not Yet Founded in 1450
  immaculate: 'Not Yet Founded (1450)',

  // Western Suburbs (Wrzeszcz / Langfuhr — developed 19th–20th c.)
  sacredheart: 'Wrzeszcz (Langfuhr)',

  // Pomerania Region (outside Gdańsk — broader regional churches)
  pelplin: 'Pomerania Region',
};

// Derive unique district names and sort them logically
export const district1450Names = [
  'Main Town',
  'Old Town',
  'Young Town',
  'Old Suburb',
  'Eastern Suburb',
  'Outside City',
  'Not Yet Founded (1450)',
  'Wrzeszcz (Langfuhr)',
  'Pomerania Region',
];
