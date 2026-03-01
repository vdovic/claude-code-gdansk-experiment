#!/usr/bin/env node

/**
 * Update churches.js with downloaded images
 * Replaces SVG data URIs with local image file paths
 */

const fs = require('fs');
const path = require('path');

const churchesPath = path.join(__dirname, '..', 'src', 'data', 'churches.js');
const reportPath = path.join(__dirname, '..', 'assets', 'images', 'churches', '_image_sources.json');

console.log('📝 Updating churches.js with downloaded images\n');

// Read report
let report = {};
if (fs.existsSync(reportPath)) {
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`✓ Read report: ${reportPath}\n`);
  } catch (err) {
    console.error(`✗ Could not read report: ${err.message}`);
    process.exit(1);
  }
}

// Read churches.js
let content = fs.readFileSync(churchesPath, 'utf8');
let updateCount = 0;

// Process each church
for (const [churchId, data] of Object.entries(report)) {
  if (!data.exterior && !data.interior) {
    console.log(`⏭️  ${churchId}: No images found, skipping`);
    continue;
  }

  // Build a unique identifier in the file to find this church's image section
  // We'll look for: id:'churchId', ... images:{...

  // Create a marker pattern to find this specific church (case-insensitive patterns)
  const churchMarker = `id:'${churchId}'`;
  const churchIndex = content.indexOf(churchMarker);

  if (churchIndex < 0) {
    console.log(`⚠️  ${churchId}: Could not find in churches.js`);
    continue;
  }

  // Find the images section after this church ID
  let imagesStart = content.indexOf('images:{', churchIndex);
  let imagesEnd = content.indexOf('},\n    sources:', imagesStart);

  if (imagesStart < 0 || imagesEnd < 0) {
    console.log(`⚠️  ${churchId}: Could not find images section`);
    continue;
  }

  // Extract the images block
  let imagesBlock = content.substring(imagesStart, imagesEnd + 1);
  let updatedBlock = imagesBlock;

  // Replace exterior URL
  if (data.exterior && data.exterior.filename) {
    const oldExterior = /exterior:\{url:'[^']*'/;
    updatedBlock = updatedBlock.replace(oldExterior, `exterior:{url:'assets/images/churches/${data.exterior.filename}'`);
    console.log(`✓ ${churchId}: exterior → ${data.exterior.filename}`);
    updateCount++;
  }

  // Replace interior URL
  if (data.interior && data.interior.filename) {
    const oldInterior = /interior:\{url:'[^']*'/;
    updatedBlock = updatedBlock.replace(oldInterior, `interior:{url:'assets/images/churches/${data.interior.filename}'`);
    console.log(`✓ ${churchId}: interior → ${data.interior.filename}`);
    updateCount++;
  }

  // Replace in main content
  content = content.substring(0, imagesStart) + updatedBlock + content.substring(imagesEnd + 1);
}

// Write updated churches.js
fs.writeFileSync(churchesPath, content, 'utf8');

console.log(`\n✅ Updated ${updateCount} image paths`);
console.log(`📄 Saved: ${churchesPath}`);
console.log(`\n✨ Next steps:`);
console.log(`   1. cd "${path.dirname(churchesPath)}"`);
console.log(`   2. Start local server: py -m http.server 8080`);
console.log(`   3. Open: http://localhost:8080/`);
console.log(`   4. Click churches and verify images load`);
