#!/usr/bin/env node

/**
 * Creates a centralized image configuration file
 * This allows easy automated updates without manual copy/pasting
 *
 * Usage: node tools/create_image_config.js
 *
 * This generates:
 * - assets/images/churches/church_images.json (centralized image configuration)
 * - tools/update_churches_from_config.js (script to apply config to churches.js)
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'assets', 'images', 'churches', 'church_images.json');

// CENTRALIZED IMAGE CONFIGURATION
// Update this single object with real image URLs when they become available
// No need to modify churches.js manually - just run the update script
const imageConfig = {
  "stmary": {
    "name": "St. Mary's Basilica",
    "exterior": {
      "url": "assets/images/churches/stmary-exterior.jpg",
      "desc": "Gothic brick basilica with twin spires, risen from 1945 destruction"
    },
    "interior": {
      "url": "assets/images/churches/stmary-interior.jpg",
      "desc": "Vaulted Gothic nave with astronomical clock, rebuilt post-1945"
    }
  },
  "stcatherine": {
    "name": "St. Catherine's Church",
    "exterior": {
      "url": "assets/images/churches/stcatherine-exterior.jpg",
      "desc": "Gothic tower with stepped gables, oldest carillon bells visible"
    },
    "interior": {
      "url": "assets/images/churches/stcatherine-interior.jpg",
      "desc": "Spacious Gothic interior with astronomical ceiling paintings"
    }
  },
  "stnicolaus": {
    "name": "St. Nicholas' Basilica",
    "exterior": {
      "url": "assets/images/churches/stnicolaus-exterior.jpg",
      "desc": "Gothic façade with Renaissance details, only major church to stay Catholic in Reformation"
    },
    "interior": {
      "url": "assets/images/churches/stnicolaus-interior.jpg",
      "desc": "Richest Baroque interior in Gdańsk — Hildebrandt organ, polychrome altarpieces"
    }
  },
  "stpeterpaul": {
    "name": "Ss. Peter & Paul",
    "exterior": {
      "url": "assets/images/churches/stpeterpaul-exterior.jpg",
      "desc": "Fortress-like Gothic exterior with massive western wall, unique among Gdańsk churches"
    },
    "interior": {
      "url": "assets/images/churches/stpeterpaul-interior.jpg",
      "desc": "Austere Gothic interior with baroque pulpit and Armenian khachkar"
    }
  },
  "sttrinity": {
    "name": "Holy Trinity",
    "exterior": {
      "url": "assets/images/churches/sttrinity-exterior.jpg",
      "desc": "Late Gothic brick church with Franciscan stepped gables, now part of National Museum"
    },
    "interior": {
      "url": "assets/images/churches/sttrinity-interior.jpg",
      "desc": "Vast Gothic nave with original medieval timber roof, houses Renaissance altarpieces"
    }
  },
  "stbrigid": {
    "name": "St. Bridget's",
    "exterior": {
      "url": "assets/images/churches/stbrigid-exterior.jpg",
      "desc": "Gothic brick church where Solidarity movement gathered during 1980s strikes"
    },
    "interior": {
      "url": "assets/images/churches/stbrigid-interior.jpg",
      "desc": "Rebuilt interior with world's largest amber altar (2017), Solidarity memorial art"
    }
  },
  "stjohn": {
    "name": "St. John's Church",
    "exterior": {
      "url": "assets/images/churches/stjohn-exterior.jpg",
      "desc": "Late Gothic church with distinctive tower, served multiple denominations"
    },
    "interior": {
      "url": "assets/images/churches/stjohn-interior.jpg",
      "desc": "Impressive Gothic vaulting and baroque furnishings"
    }
  },
  "stbartholomew": {
    "name": "St. Bartholomew's",
    "exterior": {
      "url": "assets/images/churches/stbartholomew-exterior.jpg",
      "desc": "Brick Gothic church with characteristic stepped gable facade"
    },
    "interior": {
      "url": "assets/images/churches/stbartholomew-interior.jpg",
      "desc": "Well-preserved Gothic interior with medieval architecture"
    }
  },
  "stbarbara": {
    "name": "St. Barbara's",
    "exterior": {
      "url": "assets/images/churches/stbarbara-exterior.jpg",
      "desc": "Compact Gothic brick structure with tower"
    },
    "interior": {
      "url": "assets/images/churches/stbarbara-interior.jpg",
      "desc": "Intimate Gothic interior space"
    }
  },
  "stelizabeth": {
    "name": "St. Elizabeth's",
    "exterior": {
      "url": "assets/images/churches/stelizabeth-exterior.jpg",
      "desc": "Gothic brick church with elegant proportions"
    },
    "interior": {
      "url": "assets/images/churches/stelizabeth-interior.jpg",
      "desc": "Spacious Gothic nave with reconstructed furnishings"
    }
  },
  "stcorpus": {
    "name": "Corpus Christi",
    "exterior": {
      "url": "assets/images/churches/stcorpus-exterior.jpg",
      "desc": "Carmelite church with distinctive architectural features"
    },
    "interior": {
      "url": "assets/images/churches/stcorpus-interior.jpg",
      "desc": "Well-maintained Gothic interior with baroque elements"
    }
  },
  "stjoseph": {
    "name": "St. Joseph's",
    "exterior": {
      "url": "assets/images/churches/stjoseph-exterior.jpg",
      "desc": "Baroque-influenced church structure"
    },
    "interior": {
      "url": "assets/images/churches/stjoseph-interior.jpg",
      "desc": "Renovated interior with period furnishings"
    }
  },
  "oliwa": {
    "name": "Oliwa Cathedral",
    "exterior": {
      "url": "assets/images/churches/oliwa-exterior.jpg",
      "desc": "Impressive cathedral with twin towers and baroque elements"
    },
    "interior": {
      "url": "assets/images/churches/oliwa-interior.jpg",
      "desc": "Grand cathedral interior with famous Oliwa organ"
    }
  },
  "immaculate": {
    "name": "Immaculate Conception",
    "exterior": {
      "url": "assets/images/churches/immaculate-exterior.jpg",
      "desc": "Reformati church with distinctive architecture"
    },
    "interior": {
      "url": "assets/images/churches/immaculate-interior.jpg",
      "desc": "Well-preserved religious interior space"
    }
  },
  "royalchapel": {
    "name": "Royal Chapel",
    "exterior": {
      "url": "assets/images/churches/royalchapel-exterior.jpg",
      "desc": "Historic royal chapel structure"
    },
    "interior": {
      "url": "assets/images/churches/royalchapel-interior.jpg",
      "desc": "Ornate royal chapel interior"
    }
  },
  "stjames": {
    "name": "St. James",
    "exterior": {
      "url": "assets/images/churches/stjames-exterior.jpg",
      "desc": "Gothic brick church with characteristic medieval design"
    },
    "interior": {
      "url": "assets/images/churches/stjames-interior.jpg",
      "desc": "Traditional Gothic interior with period details"
    }
  }
};

// Ensure directory exists
const assetsDir = path.dirname(CONFIG_PATH);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write configuration
fs.writeFileSync(CONFIG_PATH, JSON.stringify(imageConfig, null, 2), 'utf8');
console.log(`✅ Created: ${CONFIG_PATH}`);
console.log(`\nThis file contains all image URLs for all 16 churches.`);
console.log(`When real images become available, update the URLs here,`);
console.log(`then run: node tools/update_churches_from_config.js\n`);
