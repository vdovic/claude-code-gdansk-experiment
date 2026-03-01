# 🚀 START HERE: How to Get Real Images in Your App (3 Steps)

## Current Status
- ✅ SVG placeholder images are displaying
- ✅ All 16 churches configured in the app
- ✅ Download script is ready with all 16 churches
- ⏳ **Next**: Replace SVG placeholders with real church photos

---

## Option 1: FASTEST WAY (2 minutes)
### Automatic Download + Auto-Update

**Requirements**: Node.js installed on your computer

**Step 1: Download Images**
```bash
cd D:\Claude_Code_Gdansk_experiment
node download_images.js
```

This will download real church images from Wikimedia Commons and create a file with embedded images.

**Step 2: Update the App**
Open `src/data/churches.js` and **replace the lines** at the very top:

```javascript
// CHANGE THIS:
// (existing import statements)

// TO THIS:
import { churchImages } from './images.js';
```

Then **find each church** and change its images like this example:

**For St. Mary's Basilica (line ~17):**
```javascript
// REPLACE THIS:
images:{
  exterior:{url:'data:image/svg+xml;base64,PHN2Z...', desc:'...'},
  interior:{url:'data:image/svg+xml;base64,PHN2Z...', desc:'...'}
},

// WITH THIS:
images:{
  exterior:{url:churchImages.stmary.exterior, desc:'Gothic brick basilica with twin spires, risen from 1945 destruction'},
  interior:{url:churchImages.stmary.interior, desc:'Vaulted Gothic nave with astronomical clock, rebuilt post-1945'}
},
```

**Repeat for all 16 churches** - just change the image URLs to:
- `churchImages.stcatherine.exterior` / `.interior`
- `churchImages.stnicolaus.exterior` / `.interior`
- `churchImages.stpeterpaul.exterior` / `.interior`
- `churchImages.sttrinity.exterior` / `.interior`
- `churchImages.stbrigid.exterior` / `.interior`
- `churchImages.stjohn.exterior` / `.interior`
- `churchImages.stbartholomew.exterior` / `.interior`
- `churchImages.stbarbara.exterior` / `.interior`
- `churchImages.stelizabeth.exterior` / `.interior`
- `churchImages.stcorpus.exterior` / `.interior`
- `churchImages.stjoseph.exterior` / `.interior`
- `churchImages.oliwa.exterior` / `.interior`
- `churchImages.immaculate.exterior` / `.interior`
- `churchImages.royalchapel.exterior` / `.interior`
- `churchImages.stjames.exterior` / `.interior`

**Step 3: Refresh Browser**
- Refresh the page
- Click on any church
- Scroll down to see real images!

---

## Option 2: MANUAL WAY (More control)

### Step 1: Create folder structure
```bash
mkdir -p assets/images/churches
```

### Step 2: Download images manually
1. Go to [Wikimedia Commons](https://commons.wikimedia.org)
2. Search for each church name (e.g., "Gdańsk St Mary's Basilica")
3. Download exterior photo → save as `stmary-ext.jpg`
4. Download interior photo → save as `stmary-int.jpg`
5. Repeat for all 16 churches

### Step 3: Update churches.js
For each church, change URLs from:
```javascript
url: 'data:image/svg+xml;...'
```

To local paths:
```javascript
url: 'assets/images/churches/stmary-ext.jpg'
```

### Step 4: Refresh and verify
- Refresh the page
- Click on churches to see images

---

## Troubleshooting

### "node command not found"
→ Install Node.js from https://nodejs.org

### "Error downloading images"
→ Check your internet connection, or try Method 2 (manual)

### "Images still showing as placeholders"
→ Make sure you imported churchImages at the top of churches.js
→ Refresh with Ctrl+Shift+R (hard refresh)

### "Only some churches have images"
→ Make sure you updated all 16 churches in churches.js
→ Check browser console for errors (F12)

---

## What You'll See When It Works

When you open the app and click on a church:
- **Detail drawer slides up** with church information
- **"Church Images" section** appears with 2 columns
- **Real photos** of exterior and interior appear (not gray SVG boxes)
- **Photo captions** below each image
- **"Learn More" section** with 3 source links

---

## Questions?

The complete detailed guide is in `INSTALL_IMAGES_GUIDE.md`

The quick reference is in `QUICK_IMAGE_SETUP.txt`

---

**Status**: Ready to implement! Choose your method above and follow the steps.
