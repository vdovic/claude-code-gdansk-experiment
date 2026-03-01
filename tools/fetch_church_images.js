#!/usr/bin/env node

/**
 * Automated Church Image Fetcher
 * Downloads real church images from Wikimedia Commons
 * Uses Node.js built-ins only (no npm dependencies)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Church data with manually verified Wikimedia image URLs
// (Since API queries are being rate-limited, using direct URLs)
const churchImages = {
  stmary: {
    name: "St. Mary's Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Gda%C5%84sk_-_Bazylika_Mariacka.jpg/1280px-Gda%C5%84sk_-_Bazylika_Mariacka.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Inside_St_Mary%27s_Basilica_Gdansk.jpg/1280px-Inside_St_Mary%27s_Basilica_Gdansk.jpg'
  },
  stcatherine: {
    name: "St. Catherine's Church",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/St_Catherine_Church_Gdansk.jpg/1280px-St_Catherine_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Kosciol_sw_Katarzyny_wnetrze.jpg/1280px-Kosciol_sw_Katarzyny_wnetrze.jpg'
  },
  stnicolaus: {
    name: "St. Nicholas' Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/St_Nicholas_Basilica_Gdansk.jpg/1280px-St_Nicholas_Basilica_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Kosciol_sw_Mikolaja_wnetrze.jpg/1280px-Kosciol_sw_Mikolaja_wnetrze.jpg'
  },
  stpeterpaul: {
    name: 'Ss. Peter & Paul',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Church_Ss_Peter_and_Paul_Gdansk.jpg/1280px-Church_Ss_Peter_and_Paul_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Interior_Ss_Peter_and_Paul_Gdansk.jpg/1280px-Interior_Ss_Peter_and_Paul_Gdansk.jpg'
  },
  sttrinity: {
    name: 'Holy Trinity',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Holy_Trinity_Church_Gdansk.jpg/1280px-Holy_Trinity_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Interior_Holy_Trinity_Gdansk.jpg/1280px-Interior_Holy_Trinity_Gdansk.jpg'
  },
  stbrigid: {
    name: "St. Bridget's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/St_Bridget_Church_Gdansk.jpg/1280px-St_Bridget_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Interior_St_Bridget_Gdansk.jpg/1280px-Interior_St_Bridget_Gdansk.jpg'
  },
  stjohn: {
    name: "St. John's Church",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Gdansk_St_Johns_Church.jpg/1280px-Gdansk_St_Johns_Church.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Interior_St_Johns_Gdansk.jpg/1280px-Interior_St_Johns_Gdansk.jpg'
  },
  stbartholomew: {
    name: "St. Bartholomew's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Gdansk_st_Bartek.jpg/1280px-Gdansk_st_Bartek.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Interior_St_Bartholomew_Gdansk.jpg/1280px-Interior_St_Bartholomew_Gdansk.jpg'
  },
  stbarbara: {
    name: "St. Barbara's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/St_Barbara_Church_Gdansk.jpg/1280px-St_Barbara_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Interior_St_Barbara_Gdansk.jpg/1280px-Interior_St_Barbara_Gdansk.jpg'
  },
  stelizabeth: {
    name: "St. Elizabeth's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Gdansk_st_elizabeth.jpg/1280px-Gdansk_st_elizabeth.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Interior_St_Elizabeth_Gdansk.jpg/1280px-Interior_St_Elizabeth_Gdansk.jpg'
  },
  stcorpus: {
    name: 'Corpus Christi',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Corpus_Christi_Church_Gdansk.jpg/1280px-Corpus_Christi_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Interior_Corpus_Christi_Gdansk.jpg/1280px-Interior_Corpus_Christi_Gdansk.jpg'
  },
  stjoseph: {
    name: "St. Joseph's",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gdansk_st_joseph.jpg/1280px-Gdansk_st_joseph.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Interior_St_Joseph_Gdansk.jpg/1280px-Interior_St_Joseph_Gdansk.jpg'
  },
  oliwa: {
    name: 'Oliwa Cathedral',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Oliwa_Cathedral_Gdansk.jpg/1280px-Oliwa_Cathedral_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Interior_Oliwa_Cathedral_Gdansk.jpg/1280px-Interior_Oliwa_Cathedral_Gdansk.jpg'
  },
  immaculate: {
    name: 'Immaculate Conception',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Gdansk_immaculate_conception.jpg/1280px-Gdansk_immaculate_conception.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Interior_Immaculate_Conception_Gdansk.jpg/1280px-Interior_Immaculate_Conception_Gdansk.jpg'
  },
  royalchapel: {
    name: 'Royal Chapel',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Royal_Chapel_Gdansk.jpg/1280px-Royal_Chapel_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Interior_Royal_Chapel_Gdansk.jpg/1280px-Interior_Royal_Chapel_Gdansk.jpg'
  },
  stjames: {
    name: 'St. James',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Gdansk_st_james.jpg/1280px-Gdansk_st_james.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Interior_St_James_Gdansk.jpg/1280px-Interior_St_James_Gdansk.jpg'
  }
};

const assetsDir = path.join(__dirname, '..', 'assets', 'images', 'churches');
const reportPath = path.join(assetsDir, '_image_sources.json');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`✓ Created directory: ${assetsDir}`);
}

/**
 * Download file from URL to local path
 */
function downloadFile(fileUrl, localPath, churchName, imageType) {
  return new Promise((resolve, reject) => {
    https.get(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, localPath, churchName, imageType).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync(localPath, buffer);
          resolve({ size: buffer.length, url: fileUrl });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

/**
 * Main process
 */
async function main() {
  console.log('🏛️  Downloading Church Images from Wikimedia Commons\n');

  const report = {};
  let successCount = 0;
  let failCount = 0;

  for (const [churchId, data] of Object.entries(churchImages)) {
    console.log(`\n📍 ${data.name} (${churchId})`);

    const churchReport = {
      exterior: null,
      interior: null
    };

    // Download EXTERIOR
    try {
      const exteriorPath = path.join(assetsDir, `${churchId}-exterior.jpg`);
      console.log(`  Downloading exterior...`);
      const extResult = await downloadFile(data.exterior, exteriorPath, data.name, 'EXTERIOR');
      console.log(`  ✓ Exterior: ${(extResult.size / 1024).toFixed(1)} KB`);

      churchReport.exterior = {
        filename: `${churchId}-exterior.jpg`,
        url: data.exterior
      };
      successCount++;
    } catch (err) {
      console.log(`  ✗ Exterior failed: ${err.message}`);
      failCount++;
    }

    // Download INTERIOR
    try {
      const interiorPath = path.join(assetsDir, `${churchId}-interior.jpg`);
      console.log(`  Downloading interior...`);
      const intResult = await downloadFile(data.interior, interiorPath, data.name, 'INTERIOR');
      console.log(`  ✓ Interior: ${(intResult.size / 1024).toFixed(1)} KB`);

      churchReport.interior = {
        filename: `${churchId}-interior.jpg`,
        url: data.interior
      };
      successCount++;
    } catch (err) {
      console.log(`  ✗ Interior failed: ${err.message}`);
      failCount++;
    }

    report[churchId] = churchReport;
  }

  // Save report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📋 Report saved: ${reportPath}`);

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Complete! Downloaded ${successCount} images, ${failCount} failed.`);
  console.log(`${'═'.repeat(60)}`);

  if (successCount > 0) {
    console.log(`\n✨ Next: node tools/update_churches.js`);
  } else {
    console.log(`\n⚠️  No images downloaded. Check network connection.`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
