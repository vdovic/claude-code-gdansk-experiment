// ═══════════ ECONOMIC DATA ═══════════

// ── Grain Export (metric tonnes, Port of Gdańsk) ─────────────────────────────
// Pre-1900 values converted from archival łaszt figures (1 ship-łaszt ≈ 2 metric tonnes;
// original data expressed in thousands of łaszts → ×2 000 to obtain tonnes).
// Anchor points for the modern era (1900–2000) corrected to port records:
//   1912 = 208 000 t  |  2000 = 1 000 000 t
// Series ends at 2000; post-2000 data removed (cargo mix shifted to containers).
export const grainExport = [
  // ─── Medieval / Early-modern (converted from thousands of łaszts × 2 000) ───
  {year:1350, val:1000},   {year:1380, val:2400},
  {year:1400, val:5000},   {year:1420, val:8000},   {year:1440, val:11000},
  {year:1460, val:16000},  {year:1470, val:21000},  {year:1480, val:28000},
  {year:1491, val:36000},  {year:1500, val:44000},  {year:1510, val:56000},
  {year:1520, val:70000},  {year:1530, val:88000},  {year:1540, val:108000},
  {year:1550, val:132000}, {year:1557, val:150000}, {year:1560, val:160000},
  {year:1570, val:190000}, {year:1580, val:216000}, {year:1590, val:236000},
  {year:1600, val:250000}, {year:1610, val:260000}, {year:1618, val:264000},
  {year:1625, val:250000}, {year:1635, val:220000}, {year:1645, val:190000},
  {year:1651, val:110000}, {year:1655, val:96000},  {year:1660, val:56000},
  {year:1670, val:50000},  {year:1680, val:44000},  {year:1690, val:40000},
  {year:1700, val:36000},  {year:1709, val:16000},  {year:1720, val:30000},
  {year:1730, val:44000},  {year:1740, val:70000},  {year:1754, val:84000},
  {year:1760, val:76000},  {year:1770, val:80000},  {year:1780, val:70000},
  {year:1793, val:56000},  {year:1800, val:60000},  {year:1810, val:40000},
  {year:1820, val:64000},  {year:1830, val:84000},  {year:1840, val:104000},
  {year:1850, val:116000}, {year:1865, val:130000}, {year:1875, val:144000},
  {year:1885, val:136000},
  // ─── Modern era (metric tonnes, port records) ────────────────────────────────
  {year:1900, val:175000}, {year:1912, val:208000},
  {year:1920, val:80000},  {year:1930, val:160000}, {year:1939, val:180000},
  {year:1945, val:5000},   {year:1950, val:50000},  {year:1960, val:200000},
  {year:1970, val:450000}, {year:1980, val:650000}, {year:1990, val:800000},
  {year:2000, val:1000000},
];

// Ensure years are numeric and sorted ascending (defensive — data is authored sorted)
grainExport.forEach(d => { d.year = Number(d.year); });
grainExport.sort((a, b) => a.year - b.year);

// ── Ship traffic (vessels per year entering Gdańsk port) ──
export const shipTraffic = [
  {year:1200, ships:40},   {year:1250, ships:80},   {year:1280, ships:150},
  {year:1308, ships:180},  {year:1330, ships:220},  {year:1350, ships:320},
  {year:1361, ships:400},  {year:1377, ships:550},  {year:1400, ships:700},
  {year:1430, ships:850},  {year:1454, ships:900},  {year:1466, ships:950},
  {year:1480, ships:1050}, {year:1500, ships:1200}, {year:1520, ships:1350},
  {year:1540, ships:1550}, {year:1560, ships:1700}, {year:1580, ships:1850},
  {year:1600, ships:1900}, {year:1618, ships:1950}, {year:1640, ships:1650},
  {year:1655, ships:1400}, {year:1660, ships:900},  {year:1680, ships:750},
  {year:1700, ships:500},  {year:1709, ships:250},  {year:1721, ships:350},
  {year:1740, ships:500},  {year:1760, ships:650},  {year:1772, ships:600},
  {year:1793, ships:450},  {year:1807, ships:350},  {year:1814, ships:400},
  {year:1830, ships:650},  {year:1850, ships:900},  {year:1875, ships:1400},
  {year:1900, ships:2800}, {year:1920, ships:1200}, {year:1930, ships:2200},
  {year:1939, ships:2400}, {year:1945, ships:100},  {year:1950, ships:800},
  {year:1960, ships:2000}, {year:1970, ships:2400}, {year:1980, ships:2500},
  {year:1990, ships:2200}, {year:2000, ships:2600},
];

// ── Economic / historical periods with confessional tags ──
// Aligned to structural turning points (not round centuries).
// Each has: name, tag (confessional), descriptor (1-line), tooltip (2 sentences),
// plus dark-theme bg + light-theme bg for the Period bar rendering.
export const economicEras = [
  {
    start: 1150, end: 1308, label: 'Pomerelian Port',
    tag: 'Catholic', bg: '#2e4a3a', bgLight: '#c8ddd0',
    desc: 'Early ducal Baltic port within fragmented Piast sphere',
    tooltip: 'Under the Samborides of Pomerelia, Gdańsk functioned as a regional Baltic port linking inland trade routes with maritime exchange. Church institutions were fully integrated into Latin Catholic structures before Teutonic intervention reshaped urban governance.',
  },
  {
    start: 1308, end: 1454, label: 'Teutonic Rule',
    tag: 'Catholic-Order', bg: '#3a3450', bgLight: '#cfc8e0',
    desc: 'Monastic military governance and merchant integration',
    tooltip: 'Following the 1308 seizure, the Teutonic Order established direct rule over Gdańsk, restructuring governance and fortifications while integrating the city into Baltic commercial networks. The period ended with the outbreak of the Thirteen Years\' War and the reintegration into the Polish Crown sphere.',
  },
  {
    start: 1454, end: 1525, label: 'Crown Autonomy',
    tag: 'Catholic', bg: '#5a4020', bgLight: '#e8d8b0',
    desc: 'Polish Crown alliance and rapid grain-export expansion',
    tooltip: 'Following incorporation into the Polish Crown, Gdańsk secured wide privileges and entered a phase of rapid economic growth. Grain exports surged, financing church expansion and reinforcing Catholic institutional continuity amid reformist currents.',
  },
  {
    start: 1525, end: 1557, label: 'Reformation',
    tag: 'Confessional Shift', bg: '#4a3a50', bgLight: '#d8c8e0',
    desc: 'Lutheran ascendancy under negotiated Crown oversight',
    tooltip: 'Urban tumults and the secularization of the Teutonic Order accelerated Lutheran dominance. Catholic monasteries and certain churches persisted, producing a negotiated confessional landscape rather than abrupt rupture.',
  },
  {
    start: 1557, end: 1618, label: 'Baltic Zenith',
    tag: 'Mixed', bg: '#5a4a20', bgLight: '#e8dab0',
    desc: 'Trade peak and structured religious pluralism',
    tooltip: 'The Religious Privilege of 1557 stabilized confessional relations. Grain exports reached structural highs while Lutheran and Catholic institutions coexisted within merchant-led urban autonomy.',
  },
  {
    start: 1618, end: 1772, label: 'Structural Contraction',
    tag: 'Lutheran Dominant', bg: '#4a2838', bgLight: '#d8c0c8',
    desc: 'War disruption, grain shocks, shrinking hinterland leverage',
    tooltip: 'The Thirty Years\' War and successive Swedish conflicts disrupted Baltic trade networks. Combined with the Great Northern War, plague shocks, and shifting Polish internal political balance, Gdańsk\'s commercial position contracted while Protestant civic structures dominated church governance.',
  },
  {
    start: 1772, end: 1918, label: 'Prussian Era',
    tag: 'Protestant State', bg: '#3a4a30', bgLight: '#c8d8b8',
    desc: 'Loss of Polish hinterland and bureaucratic restructuring',
    tooltip: 'Incorporation into Prussia severed traditional grain networks. Administrative centralization reshaped civic and church institutions under Protestant-dominated state structures.',
  },
  {
    start: 1918, end: 1939, label: 'Free City',
    tag: 'Mixed', bg: '#3a4a5a', bgLight: '#c0d0e0',
    desc: 'Semi-autonomous trade node under League oversight',
    tooltip: 'The Free City period restored limited autonomy but detached Gdańsk from its hinterland. Confessional coexistence continued amid rising geopolitical tension.',
  },
  {
    start: 1939, end: 1945, label: 'War & Destruction',
    tag: 'Totalitarian', bg: '#5a2828', bgLight: '#e8c0c0',
    desc: 'Annexation, devastation, demographic rupture',
    tooltip: 'Nazi annexation ended autonomy and wartime destruction ruptured urban continuity. Church structures and communities were radically disrupted.',
  },
  {
    start: 1945, end: 1989, label: 'Socialist Port',
    tag: 'Catholic Resilience', bg: '#4a2a2a', bgLight: '#d8c0c0',
    desc: 'Communist administration and industrial reconstruction',
    tooltip: 'Under communist rule, Gdańsk rebuilt as an industrial port. Catholic institutions became focal points of civic resilience, culminating in Solidarity.',
  },
  {
    start: 1989, end: 2005, label: 'EU Integration',
    tag: 'Plural', bg: '#2a4a5a', bgLight: '#b8d8e8',
    desc: 'Market transition and EU-linked maritime resurgence',
    tooltip: 'Post-1989 reforms and EU accession restored Gdańsk\'s strategic port role. Churches function within a plural civic landscape shaped by layered institutional history.',
  },
];

export const populationData = [
  {year:1200, pop:2000},   {year:1300, pop:6000},   {year:1350, pop:10000},
  {year:1400, pop:15000},  {year:1450, pop:20000},  {year:1500, pop:30000},
  {year:1550, pop:40000},  {year:1580, pop:50000},  {year:1620, pop:70000},
  {year:1650, pop:65000},  {year:1700, pop:50000},  {year:1740, pop:46000},
  {year:1770, pop:50000},  {year:1800, pop:48000},  {year:1850, pop:64000},
  {year:1880, pop:108000}, {year:1900, pop:140000}, {year:1920, pop:170000},
  {year:1939, pop:250000}, {year:1945, pop:118000}, {year:1960, pop:290000},
  {year:1980, pop:460000}, {year:2000, pop:462000},
];

// Timeline district bars (for the context tracks)
export const districts = [
  {name:'Zamczysko',      start:980,  end:1454, color:'rgba(138,58,58,0.07)',  textColor:'#8a3a3a'},
  {name:'Oliwa',          start:1186, end:2000, color:'rgba(160,85,32,0.06)',  textColor:'#a05520'},
  {name:'Old Town',       start:1200, end:2000, color:'rgba(42,90,154,0.07)',  textColor:'#2a5a9a'},
  {name:'Main Town',      start:1224, end:2000, color:'rgba(138,109,32,0.07)', textColor:'#8a6d20'},
  {name:'Osiek',          start:1260, end:2000, color:'rgba(106,122,58,0.06)', textColor:'#6a7a3a'},
  {name:'Old Suburb',     start:1342, end:2000, color:'rgba(42,106,72,0.07)',  textColor:'#2a6a48'},
  {name:'Young Town',     start:1380, end:1455, color:'rgba(106,74,138,0.07)', textColor:'#6a4a8a'},
  {name:'New Town',       start:1380, end:1466, color:'rgba(160,48,48,0.05)',  textColor:'#a03030'},
  {name:'Lower Town',     start:1410, end:2000, color:'rgba(90,58,138,0.05)',  textColor:'#5a3a8a'},
  {name:'Długie Ogrody',  start:1500, end:2000, color:'rgba(26,104,104,0.05)', textColor:'#1a6868'},
];
