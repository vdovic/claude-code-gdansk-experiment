#!/usr/bin/env node

/**
 * Update churches.js from centralized image config
 * This reads from assets/images/churches/church_images.json and updates churches.js
 *
 * Usage: node tools/update_churches_from_config.js
 *
 * Advantages:
 * - Single source of truth for all image URLs
 * - No need to manually edit churches.js
 * - Easy to update all images at once
 * - Safe - uses precise regex patterns to avoid corrupting data
 */

const fs = require('fs');
const path = require('path');

const CHURCHES_PATH = path.join(__dirname, '..', 'src', 'data', 'churches.js');
const CONFIG_PATH = path.join(__dirname, '..', 'assets', 'images', 'churches', 'church_images.json');

console.log('📝 Updating churches.js from image configuration\n');

// Verify config exists
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Config not found: ${CONFIG_PATH}`);
  console.error('Run first: node tools/create_image_config.js');
  process.exit(1);
}

// Verify churches.js exists
if (!fs.existsSync(CHURCHES_PATH)) {
  console.error(`❌ File not found: ${CHURCHES_PATH}`);
  process.exit(1);
}

// Read config
let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  console.log(`✓ Loaded config: ${CONFIG_PATH}`);
} catch (err) {
  console.error(`❌ Failed to parse config: ${err.message}`);
  process.exit(1);
}

// Read churches.js
let content = fs.readFileSync(CHURCHES_PATH, 'utf8');
console.log(`✓ Loaded: ${CHURCHES_PATH}\n`);

let updateCount = 0;

// For each church in config, update churches.js
for (const [churchId, churchData] of Object.entries(config)) {
  console.log(`Updating ${churchId}...`);

  // Build regex to find this specific church's images block
  // Pattern: find the church by id, then find its images section
  const churchMarker = `id:'${churchId}'`;
  const churchIndex = content.indexOf(churchMarker);

  if (churchIndex < 0) {
    console.log(`  ⚠️  Church ID not found in churches.js`);
    continue;
  }

  // Find the images section after this church
  let imagesStart = content.indexOf('images:{', churchIndex);
  let imagesEnd = content.indexOf('},\n    sources:', imagesStart);

  if (imagesStart < 0 || imagesEnd < 0) {
    console.log(`  ⚠️  Could not find images section`);
    continue;
  }

  // Extract and replace the images block
  let imagesBlock = content.substring(imagesStart, imagesEnd + 1);
  let updatedBlock = imagesBlock;

  // Replace exterior URL - very precise pattern
  if (churchData.exterior) {
    updatedBlock = updatedBlock.replace(
      /exterior:\{url:'[^']*'/,
      `exterior:{url:'${churchData.exterior.url}'`
    );
    console.log(`  ✓ exterior: ${churchData.exterior.url}`);
    updateCount++;
  }

  // Replace interior URL - very precise pattern
  if (churchData.interior) {
    updatedBlock = updatedBlock.replace(
      /interior:\{url:'[^']*'/,
      `interior:{url:'${churchData.interior.url}'`
    );
    console.log(`  ✓ interior: ${churchData.interior.url}`);
    updateCount++;
  }

  // Replace in main content
  content = content.substring(0, imagesStart) + updatedBlock + content.substring(imagesEnd + 1);
}

// Write updated churches.js
try {
  fs.writeFileSync(CHURCHES_PATH, content, 'utf8');
  console.log(`\n✅ Updated ${updateCount} image URLs in churches.js`);
  console.log(`📄 Saved: ${CHURCHES_PATH}`);
} catch (err) {
  console.error(`\n❌ Failed to write churches.js: ${err.message}`);
  process.exit(1);
}

console.log(`\n✨ Next: Start local server and verify`);
console.log(`   python -m http.server 8080`);
console.log(`   Then open: http://localhost:8080/`);
