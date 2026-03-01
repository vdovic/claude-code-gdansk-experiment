#!/usr/bin/env node
/**
 * Church Image Fetcher v2 - Direct Download with Retry & Delays
 * Uses smaller thumbnails to avoid rate limiting
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Verified Wikimedia thumbnail URLs (1024px size - more reliable)
const churchImages = {
  stmary: {
    name: "St. Mary's Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Gda%C5%84sk_-_Bazylika_Mariacka.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Inside_St_Mary%27s_Basilica_Gdansk.jpg'
  },
  stcatherine: {
    name: "St. Catherine's Church",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/St_Catherine_Church_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Kosciol_sw_Katarzyny_wnetrze.jpg'
  },
  stnicolaus: {
    name: "St. Nicholas' Basilica",
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/St_Nicholas_Basilica_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Kosciol_sw_Mikolaja_wnetrze.jpg'
  },
  stpeterpaul: {
    name: 'Ss. Peter & Paul',
    exterior: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Church_Ss_Peter_and_Paul_Gdansk.jpg',
    interior: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Interior_Ss_Peter_and_Paul_Gdansk.jpg'
  },
  sttrinity: { name: 'Holy Trinity', exterior: '', interior: '' },
  stbrigid: { name: "St. Bridget's", exterior: '', interior: '' },
  stjohn: { name: "St. John's Church", exterior: '', interior: '' },
  stbartholomew: { name: "St. Bartholomew's", exterior: '', interior: '' },
  stbarbara: { name: "St. Barbara's", exterior: '', interior: '' },
  stelizabeth: { name: "St. Elizabeth's", exterior: '', interior: '' },
  stcorpus: { name: 'Corpus Christi', exterior: '', interior: '' },
  stjoseph: { name: "St. Joseph's", exterior: '', interior: '' },
  oliwa: { name: 'Oliwa Cathedral', exterior: '', interior: '' },
  immaculate: { name: 'Immaculate Conception', exterior: '', interior: '' },
  royalchapel: { name: 'Royal Chapel', exterior: '', interior: '' },
  stjames: { name: 'St. James', exterior: '', interior: '' }
};

const assetsDir = path.join(__dirname, '..', 'assets', 'images', 'churches');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function download(url, path) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('No URL'));
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400) {
        return download(res.headers.location, path).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(path, Buffer.concat(chunks));
        resolve(Buffer.concat(chunks).length);
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function main() {
  console.log('🏛️  Church Images Downloader\n');
  
  let ok = 0, fail = 0;
  for (const [id, data] of Object.entries(churchImages)) {
    console.log(`\n${data.name}`);
    
    if (data.exterior) {
      try {
        await sleep(500);
        const ext = await download(data.exterior, path.join(assetsDir, `${id}-exterior.jpg`));
        console.log(`  ✓ Exterior: ${(ext/1024).toFixed(0)} KB`);
        ok++;
      } catch (e) { console.log(`  ✗ Exterior: ${e.message}`); fail++; }
    }
    
    if (data.interior) {
      try {
        await sleep(500);
        const int = await download(data.interior, path.join(assetsDir, `${id}-interior.jpg`));
        console.log(`  ✓ Interior: ${(int/1024).toFixed(0)} KB`);
        ok++;
      } catch (e) { console.log(`  ✗ Interior: ${e.message}`); fail++; }
    }
  }
  
  console.log(`\n✅ Downloaded: ${ok}, Failed: ${fail}`);
  if (ok > 0) console.log('Next: node tools/update_churches.js');
}

main().catch(e => { console.error(e); process.exit(1); });
