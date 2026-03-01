// Generate SVG placeholder base64 URLs for all 16 churches

const churches = [
  { id: 'stmary', name: "St. Mary's Basilica" },
  { id: 'stcatherine', name: "St. Catherine's Church" },
  { id: 'stnicolaus', name: "St. Nicholas' Basilica" },
  { id: 'stpeterpaul', name: 'Ss. Peter & Paul' },
  { id: 'sttrinity', name: 'Holy Trinity (Franciscan)' },
  { id: 'stbrigid', name: "St. Bridget's (Birgittine)" },
  { id: 'stjohn', name: "St. John's Church" },
  { id: 'stbartholomew', name: "St. Bartholomew's" },
  { id: 'stbarbara', name: "St. Barbara's" },
  { id: 'stelizabeth', name: "St. Elizabeth's" },
  { id: 'stcorpus', name: 'Corpus Christi (Carmelite)' },
  { id: 'stjoseph', name: "St. Joseph's (Discalced Carmelite)" },
  { id: 'oliwa', name: 'Oliwa Cathedral' },
  { id: 'immaculate', name: 'Immaculate Conception' },
  { id: 'royalchapel', name: 'Royal Chapel' },
  { id: 'stjames', name: 'St. James' }
];

function generateSVG(churchName, type) {
  const gradientColor1 = type === 'exterior' ? '#333366' : '#444466';
  const gradientColor2 = type === 'exterior' ? '#666699' : '#333355';
  const typeLabel = type === 'exterior' ? 'EXTERIOR' : 'INTERIOR';
  
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${gradientColor1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradientColor2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <text x="200" y="140" font-size="18" fill="#999" text-anchor="middle" dy=".3em">${churchName}</text>
    <text x="200" y="165" font-size="14" fill="#666" text-anchor="middle">${typeLabel} View</text>
    <text x="200" y="200" font-size="12" fill="#555" text-anchor="middle">Wikimedia Commons</text>
  </svg>`;
  
  return Buffer.from(svg).toString('base64');
}

churches.forEach(ch => {
  const extSVG = generateSVG(ch.name, 'exterior');
  const intSVG = generateSVG(ch.name, 'interior');
  console.log(`${ch.id}:`);
  console.log(`  exterior: data:image/svg+xml;base64,${extSVG}`);
  console.log(`  interior: data:image/svg+xml;base64,${intSVG}`);
});
