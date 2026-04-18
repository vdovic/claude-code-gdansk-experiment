# Adding a New Church

Step-by-step checklist for adding a church to the Gdańsk app.
Follow the steps in order — each step references the previous one.

---

## Quick reference: files to touch

| Step | File | What to add |
|------|------|-------------|
| 1 | `src/data/churches.js` | Full church record |
| 2 | `src/data/clusters.js` | Church ID in a cluster |
| 3 | `src/data/districts1450.js` | District classification |
| 4 | `src/data/symbolMeanings.js` | 2–4 heraldic symbol explanations |
| 5 | `src/data/patrons.js` | Patron saint section (10 facts + wiki link) |
| 6 | `src/data/patronage.js` | Founder / order / guild links *(optional)* |
| 7 | `src/data/confessional.js` | Confessional / order notes *(optional)* |

`distMatrix` in `state.js` **auto-recomputes** — no manual action needed.

---

## Step 1 — Add the church record

File: **`src/data/churches.js`**

1. Copy `src/data/CHURCH_TEMPLATE.js` and read the comments to understand each field.
2. Give the church a unique `id` in camelCase/lowercase (e.g. `'stnicolaus'`, `'royalchapel'`).
3. Fill in **all REQUIRED fields**. Leave OPTIONAL fields as `null` or `[]` if unknown.
4. Add the object to the `churches` array — order is not important for correctness,
   but chronological by `cornerstoneYear` is the convention.

**Key rules for `denomBars`:**
- Bars must not overlap in year ranges.
- Bars should cover the church's active lifespan continuously if possible.
- Leave gaps only if the church was genuinely unused/destroyed in between.
- Valid `type` values: `'catholic'` `'lutheran'` `'calvinist'` `'armenian'` `'polish_catholic'` `'secular'`

**Key rules for `events`:**
- Every church needs at least one `'founded'` or `'cornerstone'` event.
- `year` must be an integer.
- `label` should be ≤ 60 characters (shown on marker hover).
- `detail` can be longer — it appears in the detail panel.

**Map coordinates:**
- `lat`/`lon` are in decimal degrees (WGS-84).
- To get coordinates that align with the historic map overlay, open the app,
  enable the historic map, and use the click-coordinate helper:
  in `src/map.js`, uncomment the `leafletMap.on('click', ...)` block,
  click the building on the map, note the coordinates shown in the corner box,
  then comment the helper out again.

---

## Step 2 — Add to a cluster

File: **`src/data/clusters.js`**

Add the new church's `id` to the appropriate cluster's `members` array:

```js
{ id: 'A', label: 'Large',  members: ['stmary', ..., 'your-new-id'] }  // capacity ≥ 3000
{ id: 'B', label: 'Medium', members: ['stbrigid', ..., 'your-new-id'] } // 1000–2999
{ id: 'C', label: 'Small',  members: ['royalchapel', ..., 'your-new-id'] } // < 1000
```

Choose the cluster based on `capacity`. The `distMatrix` is computed
automatically at startup from `churches.js` — you do **not** need to edit it.

---

## Step 3 — Add district classification

File: **`src/data/districts1450.js`**

Add one entry to the `district1450ByChurchId` object:

```js
export const district1450ByChurchId = {
  // ... existing entries ...
  'your-new-id': 'Main City',   // or whichever district applies
};
```

Valid district names used in the app (check the existing entries for the full list):
- `'Main City'` — Rechtstadt / Główne Miasto
- `'Old City'` — Altstadt / Stare Miasto
- `'Old Suburb'` — Vorstadt / Stare Przedmieście
- `'Lower City'` — Niederstadt / Dolne Miasto
- `'New City'` — Neustadt / Nowe Miasto
- `'Oliwa'` — Olive / Oliwa
- `'Beyond the walls'` — outside the main fortifications

---

## Step 4 (required) — Add heraldic symbol meanings

File: **`src/data/symbolMeanings.js`**

Add an entry keyed by the church's `id`. Each entry lists 2–4 symbols visible on
the heraldic shield (or associated with the patron), with a 1–2 sentence explanation.
This populates the "ⓘ symbol meanings" tooltip in the detail drawer.

```js
export const churchSymbolMeanings = {
  // ... existing entries ...
  'your-new-id': {
    symbols: [
      {
        symbol: 'Name of symbol',        // shown as the symbol label
        explanation: 'What it means and why it is associated with this church.',
      },
      {
        symbol: 'Second symbol',
        explanation: 'Explanation.',
      },
    ],
  },
};
```

---

## Step 5 (required) — Add patron saint section

File: **`src/data/patrons.js`**

Add an entry keyed by the church's `id`. This populates the "Meet the Patron"
section at the bottom of the detail drawer. Write 10 engaging, accurate facts.

```js
export const churchPatronData = {
  // ... existing entries ...
  'your-new-id': {
    patron:       'Saint Nicholas of Myra',         // display name
    patronTitle:  'Bishop of Myra · c. 270–343 AD', // dates / subtitle
    facts: [
      'Fact 1 about the patron saint or the church's dedication.',
      'Fact 2.',
      // ... 10 total
    ],
    wikiUrl:       'https://en.wikipedia.org/wiki/...',
    readMoreLabel: 'Saint Nicholas — Wikipedia',
  },
};
```

---

## Step 6 (optional) — Add patron saint / founder

File: **`src/data/patronage.js`**

Only needed if the church has specific patron saint data or a known founder.
Add an entry keyed by the church's `id`:

```js
export const churchPatrons = {
  // ... existing entries ...
  'your-new-id': {
    patron:  'St. Nicholas',   // patron saint name (string or null)
    founder: 'Teutonic Order', // founding body or person (string or null)
    order:   null,             // religious order if monastic (string or null)
  },
};
```

---

## Step 5 (optional) — Add confessional notes

File: **`src/data/confessional.js`**

Only needed for additional confessional/doctrinal context beyond the `denomBars`.

---

## After adding — things to verify

- [ ] Open the app and check the church appears in the timeline lanes
- [ ] Check the map pin position (enable the historic map, compare visually)
- [ ] Open the detail panel — verify events render in correct order
- [ ] Check the "Most similar churches" section shows sensible results
- [ ] Check the Churches tab (list view) shows the church with correct data
- [ ] If the church has a new patron saint, check `src/data/patrons.js`

---

## Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `id` not added to `clusters.js` | Church missing from Size filter | Add to correct cluster |
| `id` not added to `districts1450.js` | District column shows `—` in list | Add entry |
| Overlapping `denomBars` | Timeline bar renders incorrectly | Fix year ranges |
| `lat`/`lon` from wrong source | Pin position off on historic map | Use click-helper |
| Missing `'founded'` event | "Established" sort puts church at wrong position | Add founded event |
