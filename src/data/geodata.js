// ═══════════ HISTORIC DISTRICT POLYGONS ═══════════
// Corrected from Seutter map (c.1730) cross-referenced with modern OSM coordinates.
// Each entry: { name, shortName, founded, note, color, coords: [[lat,lon]...] }

export const districtGeo = [
  {
    name: 'Zamczysko (Burggebiet / Castle Quarter)',
    shortName: 'Zamczysko',
    founded: 980,
    dissolved: 1454,
    color: '#8a3a3a',
    note: 'The oldest fortified site in Gdańsk — a Slavic hillfort (gród) from the late 10th century, later the seat of Pomeranian dukes. After the Teutonic takeover in 1308, the Knights built a massive Ordensburg castle here as the seat of the Komtur of Gdańsk. The castle was a constant source of tension with the townspeople. In 1454, at the outbreak of the Thirteen Years\' War, the citizens of Gdańsk stormed and razed the castle to its foundations — a powerful act of defiance. The site remained an empty ruin for centuries and was never rebuilt.',
    coords: [
      [54.3540,18.6548],[54.3545,18.6555],[54.3548,18.6565],
      [54.3545,18.6578],[54.3538,18.6588],[54.3530,18.6592],
      [54.3520,18.6590],[54.3512,18.6582],[54.3508,18.6570],
      [54.3510,18.6558],[54.3518,18.6548],[54.3528,18.6543],
      [54.3535,18.6543]
    ]
  },
  {
    name: 'Main Town (Główne Miasto / Die Rechte Statt)',
    shortName: 'Main Town',
    founded: 1224,
    color: '#8a6d20',
    note: 'Chartered by Lübeck law 1224–1263 under Pomeranian dukes; confirmed by Teutonic Knights after 1308 conquest. Gdańsk\'s wealthiest and most powerful quarter — seat of the City Council, Artus Court, and the Great Armoury. Key institutions: St. Mary\'s Basilica, St. John\'s Church, Royal Chapel, Long Market, Green Gate, Neptune Fountain. The Motława waterfront hosted the Crane (Żuraw) — medieval Europe\'s largest port crane.',
    coords: [
      [54.3510,18.6535],[54.3525,18.6540],[54.3545,18.6543],
      [54.3553,18.6545],[54.3548,18.6570],[54.3540,18.6582],
      [54.3525,18.6593],[54.3510,18.6594],[54.3496,18.6589],
      [54.3482,18.6580],[54.3470,18.6565],[54.3462,18.6548],
      [54.3460,18.6530],[54.3462,18.6508],[54.3468,18.6496],
      [54.3480,18.6488],[54.3495,18.6488],[54.3505,18.6520]
    ]
  },
  {
    name: 'Old Town (Stare Miasto / Die Vor Statt)',
    shortName: 'Old Town',
    founded: 1200,
    color: '#2a5a9a',
    note: 'Gdańsk\'s oldest settlement core, predating the Main Town. Grew organically around St. Catherine\'s Church (founded 1227, oldest parish in Gdańsk). Dominant trades: millers (the Great Mill / Wielki Młyn, built c.1350, the largest industrial building in medieval Europe), blacksmiths, coopers, tanners. Monastic centre: Dominican St. Nicholas, Birgittine St. Bridget, hospital St. Elizabeth, Carmelite St. Joseph. Hospital chapel: Corpus Christi (Bożego Ciała).',
    coords: [
      [54.3510,18.6535],[54.3505,18.6520],[54.3495,18.6488],
      [54.3510,18.6470],[54.3515,18.6448],[54.3520,18.6430],
      [54.3535,18.6415],[54.3550,18.6410],[54.3565,18.6418],
      [54.3575,18.6430],[54.3575,18.6460],[54.3575,18.6510],
      [54.3570,18.6510],[54.3568,18.6530],[54.3560,18.6545],
      [54.3545,18.6543],[54.3525,18.6540]
    ]
  },
  {
    name: 'Osiek',
    shortName: 'Osiek',
    founded: 1260,
    color: '#6a7a3a',
    note: 'Small settlement NE of the Old Town, wedged between the town walls and the Motława. Chartered c.1260. Connected the Old Town to the river trade via Angielska Grobla (English Dyke). Primarily inhabited by fishermen, boatmen, raftsmen, and smaller-scale merchants. Prone to flooding.',
    coords: [
      [54.3570,18.6535],[54.3580,18.6525],[54.3585,18.6500],
      [54.3588,18.6530],[54.3585,18.6555],[54.3578,18.6575],
      [54.3565,18.6585],[54.3555,18.6580],[54.3548,18.6570],
      [54.3553,18.6545],[54.3558,18.6545]
    ]
  },
  {
    name: 'Young Town (Młode Miasto / Jungstadt)',
    shortName: 'Young Town',
    founded: 1380,
    dissolved: 1455,
    color: '#6a4a8a',
    note: 'Teutonic-planned settlement chartered c.1380 by Grand Master Winrich von Kniprode as a deliberate rival to the rebellious Main Town. Grid layout with own market square, town hall, and separate Lübeck-law charter. Located NE of the Main Town along the Motława, between today\'s Podwale Przedmiejskie and the river. Parish churches: St. Bartholomew\'s and St. James\'s hospital chapel. Catastrophically destroyed in 1455 during the Thirteen Years\' War — razed by the citizens of Gdańsk and never rebuilt as a separate entity.',
    coords: [
      [54.3555,18.6595],[54.3562,18.6610],[54.3572,18.6620],
      [54.3585,18.6628],[54.3598,18.6630],[54.3610,18.6625],
      [54.3618,18.6612],[54.3620,18.6595],[54.3618,18.6578],
      [54.3610,18.6568],[54.3598,18.6565],[54.3585,18.6568],
      [54.3572,18.6572],[54.3560,18.6580]
    ]
  },
  {
    name: 'Old Suburb (Stare Przedmieście)',
    shortName: 'Old Suburb',
    founded: 1342,
    color: '#2a6a48',
    note: 'Assigned to the Main Town\'s jurisdiction by Teutonic Grand Master Ludolf König c.1342. Developed as an industrial quarter around the Lastadia shipyards. Dominant guilds: ship carpenters, weavers, butchers, rope-makers, sailmakers — the full supply chain for Baltic maritime trade. Churches: Ss. Peter & Paul and Holy Trinity (Franciscan).',
    coords: [
      [54.3462,18.6508],[54.3460,18.6530],[54.3462,18.6548],
      [54.3458,18.6560],[54.3450,18.6568],[54.3442,18.6565],
      [54.3432,18.6555],[54.3425,18.6540],[54.3420,18.6518],
      [54.3418,18.6490],[54.3422,18.6472],[54.3430,18.6460],
      [54.3445,18.6458],[54.3458,18.6465],[54.3466,18.6476],
      [54.3468,18.6496]
    ]
  },
  {
    name: 'New Town (Nowe Miasto)',
    shortName: 'New Town',
    founded: 1380,
    dissolved: 1466,
    color: '#a03030',
    note: 'Planned grid district chartered c.1380 by the Teutonic Knights, contemporaneous with the Young Town — both were part of the Order\'s strategy to create settlements loyal to Teutonic authority. The Birgittine convent of St. Birgitta (founded 1394–1396) served as its principal religious institution. Severely damaged during the Thirteen Years\' War (1454–1466).',
    coords: [
      [54.3468,18.6496],[54.3462,18.6508],[54.3460,18.6530],
      [54.3450,18.6528],[54.3442,18.6520],[54.3435,18.6510],
      [54.3430,18.6492],[54.3432,18.6475],[54.3440,18.6460],
      [54.3452,18.6455],[54.3462,18.6462],[54.3468,18.6475]
    ]
  },
  {
    name: 'Lower Town (Dolne Miasto / Die Niedere Statt)',
    shortName: 'Lower Town',
    founded: 1410,
    color: '#5a3a8a',
    note: 'Low-lying area south and southeast of the Old Suburb along the New Motława canal. Developed from the early 15th century as overflow settlement for workers. Chronic flooding made it the least desirable residential area. Trades: unskilled labourers, porters, raftsmen, washerwomen. The Reformati Franciscans established the Church of the Immaculate Conception here (c.1700).',
    coords: [
      [54.3442,18.6565],[54.3450,18.6568],[54.3448,18.6595],
      [54.3442,18.6618],[54.3432,18.6630],[54.3418,18.6625],
      [54.3408,18.6608],[54.3405,18.6585],[54.3408,18.6565],
      [54.3418,18.6548],[54.3425,18.6540],[54.3432,18.6555]
    ]
  },
  {
    name: 'Granary Island (Wyspa Spichrzów / Der Speicher)',
    shortName: 'Granary Island',
    founded: 1350,
    color: '#8a5a20',
    note: 'Long island between the Motława (west) and New Motława (east), formed by the digging of the New Motława canal in the 14th century. Developed from c.1350 as Gdańsk\'s dedicated grain storage zone — over 300 massive brick granaries. No permanent residents; strictly a commercial zone. Gdańsk exported 70–80% of Poland\'s total seaborne grain in peak years.',
    coords: [
      [54.3505,18.6578],[54.3503,18.6600],
      [54.3495,18.6605],[54.3485,18.6607],
      [54.3475,18.6607],[54.3465,18.6605],
      [54.3455,18.6602],[54.3445,18.6598],
      [54.3435,18.6592],[54.3430,18.6585],
      [54.3432,18.6575],[54.3438,18.6572],
      [54.3448,18.6572],[54.3458,18.6573],
      [54.3468,18.6574],[54.3478,18.6575],
      [54.3488,18.6577],[54.3498,18.6576]
    ]
  },
  {
    name: 'Długie Ogrody (Long Gardens)',
    shortName: 'Długie Ogrody',
    founded: 1500,
    color: '#1a6868',
    note: 'Suburban gardens and orchards east of the Motława, outside the main fortifications. Developed from c.1500 as patrician pleasure gardens and agricultural land. Formally administered from c.1636. St. Barbara\'s parish served this area. The district\'s location outside the fortifications made it extremely vulnerable to siege damage — ravaged during the 1734, 1807, and 1813 sieges.',
    coords: [
      [54.3540,18.6582],[54.3540,18.6650],[54.3520,18.6670],
      [54.3500,18.6665],[54.3480,18.6645],[54.3470,18.6620],
      [54.3470,18.6595],[54.3482,18.6580],[54.3496,18.6589],
      [54.3510,18.6594],[54.3525,18.6593]
    ]
  },
  {
    name: 'Oliwa',
    shortName: 'Oliwa',
    founded: 1186,
    color: '#a05520',
    note: 'Cistercian monastery founded 1186 by Pomeranian Duke Sambor I — the oldest religious foundation in the Gdańsk area. The Cistercians became the wealthiest monastic landowners in Pomerania. Oliwa Cathedral houses the famous Rococo organ (7,876 pipes, built 1763–1788). The Treaty of Oliwa (1660), ending the Second Northern War, was signed in the monastery.',
    coords: [
      [54.4130,18.5540],[54.4130,18.5620],[54.4115,18.5630],
      [54.4095,18.5620],[54.4090,18.5560],[54.4100,18.5535],
      [54.4115,18.5530]
    ]
  }
];
