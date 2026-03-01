# 📸 How to Install Real Church Images

There are two methods to get actual images working in your app. Choose the one that works best for you.

---

## **METHOD 1: Automatic Download (Recommended for First-Time)**

### Prerequisites
- Node.js installed on your computer
- Internet connection

### Steps

1. **Navigate to your project folder**
   ```bash
   cd D:\Claude_Code_Gdansk_experiment
   ```

2. **Run the download script**
   ```bash
   node download_images.js
   ```

   This will:
   - Download 2 images for each of the first 6 churches
   - Convert them to base64
   - Create `src/data/images.js` with embedded image data
   - Show download progress and file sizes

3. **Expected output:**
   ```
   Starting image download...

   Processing St. Mary's Basilica...
   Downloading: stmary-ext.jpg
   Downloading: stmary-int.jpg
     ✓ Exterior: 45.2 KB
     ✓ Interior: 38.7 KB

   Processing St. Catherine's Church...
   ...

   ✓ Image data saved to: src/data/images.js
   ```

4. **Update churches.js to use the images**
   - Open `src/data/churches.js`
   - Add at the top after imports:
     ```javascript
     import { churchImages } from './images.js';
     ```
   - Replace each church's image URLs:
     ```javascript
     // BEFORE:
     images: {
       exterior: { url: 'data:image/svg+xml;base64,...', desc: '...' }
     }

     // AFTER:
     images: {
       exterior: { url: churchImages.stmary.exterior, desc: '...' }
     }
     ```

5. **Refresh your browser** - Images should load!

---

## **METHOD 2: Manual Image Upload (For Complete Control)**

If you want to:
- Use specific images you prefer
- Host images locally in your project
- Have full control over image selection

### Steps

1. **Create the images directory**
   ```bash
   mkdir -p assets/images/churches
   ```

2. **Find and download images**
   - Go to [Wikimedia Commons - Gdańsk Churches](https://commons.wikimedia.org/w/index.php?search=Gda%C5%84sk+church&title=Special:MediaSearch&go=Go)
   - For each church, download:
     - 1 **exterior** photo (front view, 400-600px wide)
     - 1 **interior** photo (nave/main space, 400-600px wide)

3. **Save images to the assets folder**
   ```
   assets/images/churches/
   ├── stmary-ext.jpg           (exterior)
   ├── stmary-int.jpg           (interior)
   ├── stcatherine-ext.jpg
   ├── stcatherine-int.jpg
   ├── stnicolaus-ext.jpg
   ├── stnicolaus-int.jpg
   └── ... (32 total images)
   ```

4. **Update churches.js to use local paths**
   ```javascript
   images: {
     exterior: {
       url: 'assets/images/churches/stmary-ext.jpg',
       desc: 'Gothic brick basilica with twin spires, risen from 1945 destruction'
     },
     interior: {
       url: 'assets/images/churches/stmary-int.jpg',
       desc: 'Vaulted Gothic nave with astronomical clock, rebuilt post-1945'
     }
   }
   ```

5. **Refresh browser** - Local images will load!

---

## **METHOD 3: Quick Image Generator (Placeholder to Real)**

If you want better-looking placeholders while you gather real images:

1. Create `src/utils/generateImages.js`:
   ```javascript
   export function generateChurchImage(churchName, type) {
     const canvas = document.createElement('canvas');
     canvas.width = 400;
     canvas.height = 300;
     const ctx = canvas.getContext('2d');

     // Gradient background
     const gradient = ctx.createLinearGradient(0, 0, 0, 300);
     if (type === 'exterior') {
       gradient.addColorStop(0, '#3a5a8a');
       gradient.addColorStop(1, '#6a8aaa');
     } else {
       gradient.addColorStop(0, '#5a6a7a');
       gradient.addColorStop(1, '#3a4a5a');
     }
     ctx.fillStyle = gradient;
     ctx.fillRect(0, 0, 400, 300);

     // Text
     ctx.fillStyle = '#ccc';
     ctx.font = 'bold 24px Arial';
     ctx.textAlign = 'center';
     ctx.fillText(churchName, 200, 140);

     ctx.fillStyle = '#999';
     ctx.font = '16px Arial';
     ctx.fillText(`${type.toUpperCase()} View`, 200, 170);

     return canvas.toDataURL('image/jpeg', 0.8);
   }
   ```

2. Use in churches.js:
   ```javascript
   import { generateChurchImage } from '../utils/generateImages.js';

   // In each church:
   images: {
     exterior: {
       url: generateChurchImage("St. Mary's Basilica", 'exterior'),
       desc: '...'
     }
   }
   ```

---

## **Complete Church List with Recommended Images**

For reference, here are all 16 churches and good image sources:

| Church | Exterior Source | Interior Source |
|--------|-----------------|-----------------|
| St. Mary's Basilica | Wikimedia: Basilica Mariacka | Wikimedia: St Mary's interior |
| St. Catherine's Church | Wikimedia: St Catherine Gdansk | Wikimedia: Kosciol sw Katarzyny |
| St. Nicholas' Basilica | Wikimedia: St Nicholas Basilica | Wikimedia: St Nikolaja interior |
| Ss. Peter & Paul | Wikimedia: Church Ss Peter Paul | Wikimedia: Interior Ss Peter Paul |
| Holy Trinity Franciscan | Wikimedia: Holy Trinity Church | Wikimedia: Interior Holy Trinity |
| St. Bridget's | Wikimedia: St Bridget Church | Wikimedia: Interior St Bridget |
| St. John's Church | Wikimedia: St Johns Church | Wikimedia: Interior St Johns |
| St. Bartholomew's | Wikimedia: St Bartholomew Church | Wikimedia: Interior St Bartholomew |
| St. Barbara's | Wikimedia: St Barbara Church | Wikimedia: Interior St Barbara |
| St. Elizabeth's | Wikimedia: St Elizabeth Church | Wikimedia: Interior St Elizabeth |
| Corpus Christi | Wikimedia: Corpus Christi Church | Wikimedia: Interior Corpus Christi |
| St. Joseph's | Wikimedia: St Joseph Church | Wikimedia: Interior St Joseph |
| Oliwa Cathedral | Wikimedia: Oliwa Cathedral | Wikimedia: Interior Oliwa |
| Immaculate Conception | Wikimedia: Immaculate Conception | Wikimedia: Interior Immaculate |
| Royal Chapel | Wikimedia: Royal Chapel Gdansk | Wikimedia: Interior Royal Chapel |
| St. James | Wikimedia: St James Church | Wikimedia: Interior St James |

**All available at:** https://commons.wikimedia.org/w/index.php?search=Gda%C5%84sk+church

---

## **Quickest Solution (5 Minutes)**

If you want real images in your app RIGHT NOW:

1. Run this one command:
   ```bash
   cd "D:\Claude_Code_Gdansk_experiment" && node download_images.js
   ```

2. That's it! Images will start downloading and be embedded automatically

3. Refresh your browser

---

## **Troubleshooting**

**Q: Images aren't showing up**
- Check browser console for errors (F12 → Console)
- Make sure you added the image URLs correctly to churches.js
- Refresh the page (Ctrl+R)
- Check file paths are correct

**Q: Download script failed**
- Make sure Node.js is installed: `node --version`
- Check internet connection
- Try a different image URL from Wikimedia Commons
- Some URLs may be broken, you can manually download instead

**Q: Images look blurry**
- Use higher resolution images (600-800px wide)
- Check the JPEG quality setting in the generator
- Try PNG instead of JPEG

**Q: Want to switch to different images**
- Simply replace the URLs in churches.js
- Or delete `src/data/images.js` and run the download script again

---

## **File Structure After Setup**

```
D:\Claude_Code_Gdansk_experiment\
├── assets/
│   └── images/
│       └── churches/
│           ├── stmary-ext.jpg
│           ├── stmary-int.jpg
│           ├── stcatherine-ext.jpg
│           ├── stcatherine-int.jpg
│           └── ... (32 total)
├── src/
│   ├── data/
│   │   ├── churches.js (updated with image URLs)
│   │   ├── images.js (NEW - contains embedded image data)
│   │   └── ...
│   └── ...
└── index.html
```

---

## **Next Steps**

1. **Choose a method** (1, 2, or 3 above)
2. **Execute the steps** for your chosen method
3. **Update churches.js** with the image URLs
4. **Refresh browser** to see images!
5. **Share the screenshot** - I want to see how it looks! 📸

---

## **Questions?**

- **Can I use different image sources?** Yes! Any image URLs will work
- **Do I need all 32 images?** No, start with a few and add more later
- **Can I mix local and external URLs?** Yes, completely!
- **What image sizes work best?** 400-600px wide, any height (aspect ratio 4:3 looks good)

Let me know which method you prefer and I can walk you through it step-by-step! 🎨
