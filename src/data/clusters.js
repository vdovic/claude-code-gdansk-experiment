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

// Pre-computed distance matrix (weighted Euclidean, 7 parameters)
// Row/column order matches churches array indices (stbirgitta removed):
// Mary, Cath, Nic, PP, HT, Brid, John, Bart, Barb, Eliz, Corp, Jose, Oliw, Immac, Royal, James
export const distMatrix = [
/* St. Mary's   */[0.000,1.107,1.767,1.468,1.558,1.605,1.139,1.507,1.648,1.770,1.863,1.908,2.241,2.050,1.620,1.600],
/* St. Cath's   */[1.107,0.000,1.241,0.867,1.028,0.927,0.636,0.777,0.922,1.014,1.126,1.206,1.702,1.480,0.940,1.000],
/* St. Nicholas'*/[1.767,1.241,0.000,1.496,1.198,1.093,1.366,1.387,1.416,1.150,1.006,0.891,0.970,0.920,1.500,1.200],
/* Ss. P&P      */[1.468,0.867,1.496,0.000,0.894,1.055,0.722,0.757,0.781,0.793,1.098,1.221,1.888,1.380,0.850,0.900],
/* Holy Trinity */[1.558,1.028,1.198,0.894,0.000,0.452,0.925,1.030,1.083,0.843,0.637,0.836,1.523,1.050,1.100,0.800],
/* St. Bridget's*/[1.605,0.927,1.093,1.055,0.452,0.000,0.949,0.978,1.058,0.741,0.316,0.760,1.380,0.880,1.060,0.900],
/* St. John's   */[1.139,0.636,1.366,0.722,0.925,0.949,0.000,0.468,0.587,0.889,1.072,1.165,1.801,1.510,0.700,0.700],
/* St. Barthol. */[1.507,0.777,1.387,0.757,1.030,0.978,0.468,0.000,0.220,0.723,0.926,1.072,1.781,1.280,0.530,0.500],
/* St. Barbara's*/[1.648,0.922,1.416,0.781,1.083,1.058,0.587,0.220,0.000,0.724,0.971,1.093,1.817,1.310,0.550,0.600],
/* St. Elizab.  */[1.770,1.014,1.150,0.793,0.843,0.741,0.889,0.723,0.724,0.000,0.737,0.898,1.500,0.810,0.780,0.400],
/* Corpus Chr.  */[1.863,1.126,1.006,1.098,0.637,0.316,1.072,0.926,0.971,0.737,0.000,0.818,1.302,0.750,1.080,0.900],
/* St. Joseph's */[1.908,1.206,0.891,1.221,0.836,0.760,1.165,1.072,1.093,0.898,0.818,0.000,1.239,0.680,1.180,0.600],
/* Oliwa        */[2.241,1.702,0.970,1.888,1.523,1.380,1.801,1.781,1.817,1.500,1.302,1.239,0.000,1.150,1.850,1.500],
/* Immac. Conc. */[2.050,1.480,0.920,1.380,1.050,0.880,1.510,1.280,1.310,0.810,0.750,0.680,1.150,0.000,1.350,0.800],
/* Royal Chapel */[1.620,0.940,1.500,0.850,1.100,1.060,0.700,0.530,0.550,0.780,1.080,1.180,1.850,1.350,0.000,0.800],
/* St. James    */[1.600,1.000,1.200,0.900,0.800,0.900,0.700,0.500,0.600,0.400,0.900,0.600,1.500,0.800,0.800,0.000],
];
