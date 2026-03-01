#!/usr/bin/env node

/**
 * Download Church Images from Wikimedia Commons
 * Converts them to base64 and embeds them in the app
 *
 * Usage: node download_images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Church image URLs from Wikimedia Commons
const churches = [
  {
    id: 'stmary',
    name: "St. Mary's Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Gda%C5%84sk_-_Bazylika_Mariacka.jpg/400px-Gda%C5%84sk_-_Bazylika_Mariacka.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Inside_St_Mary%27s_Basilica_Gdansk.jpg/400px-Inside_St_Mary%27s_Basilica_Gdansk.jpg'
  },
  {
    id: 'stcatherine',
    name: "St. Catherine's Church",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/St_Catherine_Church_Gdansk.jpg/400px-St_Catherine_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Kosciol_sw_Katarzyny_wnetrze.jpg/400px-Kosciol_sw_Katarzyny_wnetrze.jpg'
  },
  {
    id: 'stnicolaus',
    name: "St. Nicholas' Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/St_Nicholas_Basilica_Gdansk.jpg/400px-St_Nicholas_Basilica_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Kosciol_sw_Mikolaja_wnetrze.jpg/400px-Kosciol_sw_Mikolaja_wnetrze.jpg'
  },
  {
    id: 'stpeterpaul',
    name: 'Ss. Peter & Paul',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Church_Ss_Peter_and_Paul_Gdansk.jpg/400px-Church_Ss_Peter_and_Paul_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Interior_Ss_Peter_and_Paul_Gdansk.jpg/400px-Interior_Ss_Peter_and_Paul_Gdansk.jpg'
  },
  {
    id: 'sttrinity',
    name: 'Holy Trinity (Franciscan)',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Holy_Trinity_Church_Gdansk.jpg/400px-Holy_Trinity_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Interior_Holy_Trinity_Gdansk.jpg/400px-Interior_Holy_Trinity_Gdansk.jpg'
  },
  {
    id: 'stbrigid',
    name: "St. Bridget's (Birgittine)",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/St_Bridget_Church_Gdansk.jpg/400px-St_Bridget_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Interior_St_Bridget_Gdansk.jpg/400px-Interior_St_Bridget_Gdansk.jpg'
  },
  {
    id: 'stjohn',
    name: "St. John's Church",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/St_Johns_Church_Gdansk.jpg/400px-St_Johns_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Interior_St_Johns_Gdansk.jpg/400px-Interior_St_Johns_Gdansk.jpg'
  },
  {
    id: 'stbartholomew',
    name: "St. Bartholomew's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/St_Bartholomew_Church_Gdansk.jpg/400px-St_Bartholomew_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Interior_St_Bartholomew_Gdansk.jpg/400px-Interior_St_Bartholomew_Gdansk.jpg'
  },
  {
    id: 'stbarbara',
    name: "St. Barbara's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/St_Barbara_Church_Gdansk.jpg/400px-St_Barbara_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Interior_St_Barbara_Gdansk.jpg/400px-Interior_St_Barbara_Gdansk.jpg'
  },
  {
    id: 'stelizabeth',
    name: "St. Elizabeth's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/St_Elizabeth_Church_Gdansk.jpg/400px-St_Elizabeth_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Interior_St_Elizabeth_Gdansk.jpg/400px-Interior_St_Elizabeth_Gdansk.jpg'
  },
  {
    id: 'stcorpus',
    name: 'Corpus Christi (Carmelite)',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Corpus_Christi_Church_Gdansk.jpg/400px-Corpus_Christi_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Interior_Corpus_Christi_Gdansk.jpg/400px-Interior_Corpus_Christi_Gdansk.jpg'
  },
  {
    id: 'stjoseph',
    name: "St. Joseph's (Discalced Carmelite)",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/St_Joseph_Church_Gdansk.jpg/400px-St_Joseph_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Interior_St_Joseph_Gdansk.jpg/400px-Interior_St_Joseph_Gdansk.jpg'
  },
  {
    id: 'oliwa',
    name: 'Oliwa Cathedral',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Oliwa_Cathedral_Gdansk.jpg/400px-Oliwa_Cathedral_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Interior_Oliwa_Cathedral_Gdansk.jpg/400px-Interior_Oliwa_Cathedral_Gdansk.jpg'
  },
  {
    id: 'immaculate',
    name: 'Immaculate Conception (Reformati)',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Immaculate_Conception_Church_Gdansk.jpg/400px-Immaculate_Conception_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Interior_Immaculate_Conception_Gdansk.jpg/400px-Interior_Immaculate_Conception_Gdansk.jpg'
  },
  {
    id: 'royalchapel',
    name: 'Royal Chapel',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Royal_Chapel_Gdansk.jpg/400px-Royal_Chapel_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Interior_Royal_Chapel_Gdansk.jpg/400px-Interior_Royal_Chapel_Gdansk.jpg'
  },
  {
    id: 'stjames',
    name: 'St. James',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/St_James_Church_Gdansk.jpg/400px-St_James_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Interior_St_James_Gdansk.jpg/400px-Interior_St_James_Gdansk.jpg'
  }
];

const assetsDir = path.join(__dirname, 'assets', 'images', 'churches');

// Create directories if they don't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Download image and convert to base64
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(assetsDir, filename);

    console.log(`Downloading: ${filename}`);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        resolve({ filename, dataUrl, size: buffer.length });
      });
    }).on('error', reject);
  });
}

// Main function
async function main() {
  console.log('Starting image download...\n');

  const imageData = {};

  for (const church of churches) {
    console.log(`Processing ${church.name}...`);

    try {
      const extImg = await downloadImage(church.exterior, `${church.id}-ext.jpg`);
      const intImg = await downloadImage(church.interior, `${church.id}-int.jpg`);

      imageData[church.id] = {
        exterior: extImg.dataUrl,
        interior: intImg.dataUrl
      };

      console.log(`  ✓ Exterior: ${(extImg.size / 1024).toFixed(1)} KB`);
      console.log(`  ✓ Interior: ${(intImg.size / 1024).toFixed(1)} KB\n`);
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }

  // Generate JavaScript file with embedded images
  const output = `// Auto-generated image data - DO NOT EDIT
// Generated by: node download_images.js

export const churchImages = ${JSON.stringify(imageData, null, 2)};
`;

  const outputFile = path.join(__dirname, 'src', 'data', 'images.js');
  fs.writeFileSync(outputFile, output);

  console.log(`\n✓ Image data saved to: src/data/images.js`);
  console.log(`\nNext steps:`);
  console.log(`1. Update src/data/churches.js to import and use the image data`);
  console.log(`2. Replace image URLs with: url: churchImages[churchId].exterior`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
