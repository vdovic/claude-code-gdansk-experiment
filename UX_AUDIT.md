# UX Audit: Gdansk Sacred Landscape

## Section 1: Critical Structural Issues

### 1.1 The "Dark Void" Problem — No Orientation on First Load
When a user opens the app for the first time, they see a dark control panel taking up ~40% of the viewport, a small minimap, and church lanes scrolled to some arbitrary position. There is **no welcome state**, no visual cue explaining what they are looking at, and no guidance on how to interact. The timeline just... starts. For a presentation-grade product, this is the single biggest problem: the first 3 seconds determine whether the audience is hooked or confused.

**Fix:** Add a subtle first-load overlay or "hero moment" — a 2-second animated fly-in that starts zoomed into a key event (e.g., St. Mary's 1343 cornerstone), then smoothly zooms out to reveal the full timeline. This creates a narrative entry point. Alternatively, a translucent "Start exploring: scroll horizontally through 8 centuries" hint that fades on first interaction.

### 1.2 The Scroll Paradigm is Backwards
The primary content (church lanes) scrolls horizontally, but the entire web convention is vertical scrolling. Users instinctively scroll down. The horizontal scroll with no visible scrollbar, combined with the fact that the minimap is tiny and visually passive, means many users will **never discover** that the timeline extends 800 years to the right. On trackpads this works; on mice with vertical-only scroll wheels, the content is essentially trapped.

**Fix:** (a) Add a subtle horizontal scroll indicator/arrow at the right edge. (b) Support Shift+scroll for horizontal navigation. (c) Make the minimap larger and more visually prominent — it should feel like a navigation tool, not a decoration. (d) Consider adding a "current year" indicator that updates as the user scrolls.

### 1.3 Two Separate Map Implementations Create Confusion
The app has a map panel that can be toggled inside the timeline screen AND a separate full-screen "Map" tab. They share the same Leaflet instance but are presented as different features. A user who finds the inline map may never check the tab (and vice versa). The year slider, district toggles, and church list exist in the sidebar of the inline map but not consistently in the tab view.

**Fix:** Unify the map experience. The inline map panel should be a "preview" that expands to the full tab. Or remove the inline panel entirely and make the Map tab the sole map experience, with a clear "See on Map" button in the timeline.

### 1.4 Information Buried in the Drawer
The detail drawer contains an extraordinary amount of content — heraldic shields, guild patrons, denomination history, similar churches, organ details, parishioner demographics circa 1500, tax information. But the drawer is accessed only by clicking a church label or event dot. **There is no browsing path** — you cannot scroll through churches in the drawer. You must close, click another church, wait for the animation.

**Fix:** Add "Previous / Next" navigation arrows in the drawer header (following the current sort order). This transforms the drawer from a dead-end into a browsable experience.

### 1.5 Context Tracks Are Invisible Until You Know They Exist
The 7 context tracks (Rulers, Wars, Political, Plagues, Population, Grain, Districts) are hidden behind toggle chips that themselves are inside the collapsible chrome. A first-time user who collapses the chrome (or is on mobile where sort buttons are hidden) will never see these tracks. Yet they contain some of the most valuable content — wars, plagues, and rulers contextualize the entire church timeline.

**Fix:** Context tracks should be ON by default (they are, but the toggle UI is buried). More importantly, add visual "connector lines" from context events to church events — e.g., a faint vertical line from the 1308 Teutonic takeover down through all church lanes, showing which churches were affected. This is the **killer feature** the app is missing.

---

## Section 2: Major UX Improvements (25 Items)

### Navigation & Orientation

**1. Add a "Current Year" Floating Indicator**
As the user scrolls horizontally, display a floating year badge (e.g., "~1450") that tracks with the viewport center. This gives instant temporal orientation. Currently, the user must look up at the axis and mentally estimate the year — a cognitive tax that breaks flow.

**2. Add "Era Breadcrumb" Below the Axis**
Display the current era name (e.g., "Polish Crown Period · 1454–1793") as a persistent, updating label. This contextualizes the abstract year number with a meaningful historical period.

**3. Minimap Should Show the Current Era**
The minimap is a grey canvas with tiny bars. It should be colour-coded by era (Teutonic=red, Polish=blue, etc.) and show era labels, so it doubles as a visual table of contents.

**4. Add Scroll Snap to Centuries or Eras**
Optional scroll-snap behavior that gently aligns to century boundaries when the user stops scrolling. This creates a "chapter" feel and makes it easier to discuss specific periods during presentations.

### Information Architecture

**5. Church Labels Need More Information at a Glance**
The frozen label column shows only the church name (and a cluster dot). Add the cornerstone year and a tiny denomination colour bar next to each name. This eliminates the need to scan across the timeline to find basic facts.

**6. Add a "Story Mode" or Guided Tour**
For presentations, a sequential walkthrough that highlights key events with narration would be transformative. E.g., "In 1343, construction begins on what will become the largest brick church in the world..." with automatic scrolling and highlighting. This is the difference between a tool and an experience.

**7. Event Dots Need Visual Hierarchy**
All event dots are the same size regardless of importance. The 1945 destruction of Gdansk and a minor expansion look identical. Scale dots by significance — major events get larger markers and a subtle glow.

**8. Denomination Bars Need Transition Markers**
When a church changes denomination (e.g., Catholic → Lutheran during the Reformation), the transition is just a colour change on a thin bar. Add small diamond markers at transition points. The Reformation is the most dramatic story in the data — it should be visually dramatic.

### Readability & Typography

**9. Church Lane Height is Too Small**
At 40px, denomination bars are thin (9px) and event dots are tiny. Users must zoom in to read anything. Increase lane height to 48-52px with proportionally larger bars and dots. The data is rich enough to deserve the space.

**10. Context Track Labels are Cryptic**
The stub labels ("RULERS", "WARS") use 8px uppercase Cinzel. They are hard to read and feel like footnotes, not features. Increase to 10px and add a subtle icon before each label (crown for rulers, swords for wars, etc.).

**11. Year Axis Tick Labels are Too Small**
At 9px, the decade labels on the axis are barely legible. They should be the primary orientation device. Increase to 11px for century marks.

**12. Filter Chips Text is Tiny**
9px Cinzel in the filter bar is elegant but unreadable at normal viewing distance. Increase to 10-11px. During a presentation, the audience needs to read these from a few feet away.

### Interaction Design

**13. Add Double-Click to Zoom Into a Year**
Double-clicking on the timeline should zoom in centered on that year. Currently zoom is only via buttons (+/−/Fit). Direct manipulation is always more intuitive than controls.

**14. Add Pinch-to-Zoom on Touch Devices**
The zoom buttons work on mobile, but pinch-to-zoom is the natural gesture. Its absence feels like a missing feature.

**15. Context Track Click Should Cross-Reference Churches**
Clicking a war or political event opens the detail drawer with that event's description. But it doesn't show which churches were affected. Add a "Churches affected" section to war/political details listing churches that had events during that period.

**16. Similar Churches Should Highlight on the Timeline**
When viewing a church's "Most Similar" list in the drawer, hovering over a similar church should temporarily highlight its lane on the timeline. This creates a spatial connection between the similarity score and the visual data.

**17. Add Keyboard Navigation Between Churches**
Arrow up/down should move between church lanes (highlighting the active one). Enter opens the detail. This makes keyboard-driven presentations much smoother than mouse hunting.

### Visual Hierarchy

**18. Create Visual "Epochs" Across the Full Timeline**
The axis shows era bands, but the church lanes below are uniform. Add extremely subtle (2-3% opacity) background colour bands that extend through all lanes, tinting the Teutonic period slightly red, the Polish period slightly blue, etc. This creates unconscious temporal grouping.

**19. The 1945 Line Should Be Dramatic**
The destruction of Gdansk in 1945 is the most significant single event across all churches. Add a bold vertical red line at 1945 that cuts through all tracks and lanes — like a scar. Currently it's just more dots.

**20. War Bars Need More Visual Weight**
War bars at 55% opacity are too subtle. Wars fundamentally shaped the churches — the Thirteen Years' War, the Swedish Deluge, WWII. Make them more prominent (70% opacity) with a subtle pulsing hatched pattern.

### Content Discoverability

**21. Add a "Statistics" Summary Panel**
Show aggregate stats: "12 of 16 churches changed denomination during the Reformation", "All churches were damaged in 1945", "Average church age: 560 years". This synthesizes the data into insights.

**22. Add "Related Events" Connections**
When hovering over a political event marker, temporarily show which churches have events within ±10 years. This makes the causal relationship between political change and church history visible.

**23. The Church List Screen is Underutilized**
The List tab shows church cards but doesn't add value beyond the timeline. Transform it into a "Comparison View" where you can select 2-3 churches and see their timelines side by side, or a "Faceted Browser" with richer filtering and sorting.

### Mobile-Specific

**24. Mobile Filters Screen Needs Visual Grouping**
The mobile filter screen uses inline `var(--parchment-dk)` card backgrounds that don't contrast with the dark panel redesign. Update the mobile filters to use dark panel colours matching the new design language.

**25. Swipe Between Churches in Mobile Drawer**
On mobile, allow swiping left/right in the drawer to navigate between churches. This is the most natural mobile interaction for browsing sequential content.

---

## Section 3: Innovation Opportunities

### 3.1 "Time Travel" Cursor
Replace the standard cursor with a custom cursor that, when hovering over the timeline, displays the year. As you move the mouse horizontally, the year updates in real-time. This eliminates the constant eye-jump to the axis.

### 3.2 Denomination Timeline Animation
Add a "Play" button that animates denomination changes across all churches simultaneously. Watching the Reformation sweep through Gdansk (Catholic brown → Lutheran blue spreading from 1525 to 1560) would be one of the most powerful visualizations possible. Speed: ~20 years per second. The map could sync, showing denomination colours change in real-time.

### 3.3 "What Happened This Year" Mode
Click any year on the axis to see a popover showing ALL events that year — across all churches, political events, wars, plagues. This is how historians think: "What was happening in 1525?" Currently, this requires scanning every row visually.

### 3.4 Comparative Denomination Chart
A stacked area chart showing the percentage of churches that are Catholic vs. Lutheran vs. Calvinist over time. This would instantly communicate the Reformation's impact better than 16 individual bars.

### 3.5 "Memory Palace" View
An isometric or 3D-perspective view of the Gdansk skyline with church towers at their actual heights, colour-coded by denomination, with a year slider. This is the "wow" feature for presentations — it makes the abstract data physical.

### 3.6 Deep Linking / URL State
Encode the current view state (scroll position, zoom level, active filters, open drawer) in the URL hash. This allows sharing specific views: "Look at this — all monastic churches during the Teutonic period" as a link.

### 3.7 Annotation Layer
Allow the presenter to add temporary annotations — circles, arrows, text boxes — on top of the timeline during a presentation. These could be saved as "presentation bookmarks."

---

## Section 4: Accessibility & Readability Audit

### 4.1 Colour-Only Encoding
Denomination bars rely entirely on colour to distinguish Catholic (brown-red), Lutheran (blue), Calvinist (green), Armenian (brown-orange), and Secular (grey). For the ~8% of men with colour vision deficiency, Catholic and Armenian are indistinguishable. **Fix:** Add subtle patterns (solid, striped, dotted, crosshatch) as a secondary encoding.

### 4.2 Contrast Issues in Dark Panel
The dark panel redesign uses colours like `#5a4a28` on `#1e160a` background. This is a contrast ratio of approximately 2.5:1, well below the WCAG AA minimum of 4.5:1. The `ctrl-label` at `#5a4a28` and `filter-section-label` at `#4a3a1c` are particularly problematic.

**Fix:** Raise label colours to at least `#9a8050` (≈4.6:1 contrast) for all text in the dark panel. Interactive elements should meet 4.5:1 minimum.

### 4.3 No Focus Indicators
Tab/keyboard navigation shows no focus rings on buttons, chips, or interactive elements. The default browser focus outline is suppressed by the reset CSS. **Fix:** Add `focus-visible` styles with amber outline for all interactive elements.

### 4.4 Missing ARIA Labels
- Sort buttons have no `aria-label` beyond "Cornerstone" etc.
- Filter chips have no `role="checkbox"` or `aria-checked` state
- The drawer has no `role="dialog"` or `aria-modal="true"`
- Tooltip has no `role="tooltip"` linking
- Tab bar buttons have no `role="tab"` / `role="tabpanel"` relationship

### 4.5 Touch Targets Are Too Small
Filter chips at 9px text with 3px padding create touch targets under 30px tall. WCAG recommends 44×44px minimum. The event dots are even smaller (8-12px). **Fix:** Increase chip padding to at least 6px vertical; add invisible larger hit areas to event dots.

### 4.6 No Reduced Motion Support
The app uses animations (fade-in, drawer slide, tooltip transitions). Add `@media (prefers-reduced-motion: reduce)` to disable or simplify animations for users with vestibular disorders.

### 4.7 Screen Reader Experience is Non-Existent
The entire timeline is built with `div` elements and `position:absolute` layout. A screen reader user would encounter a wall of incomprehensible text. While full accessibility for a visual timeline is extremely difficult, at minimum: (a) add `role="img"` with `aria-label` to the entire timeline region, (b) ensure the Church List tab provides an accessible alternative view, (c) add `alt` text descriptions to heraldic shields.

### 4.8 Font Size Below 9px
Multiple elements use 7-8px font size (era labels, context bar labels, population chart labels). These are below the minimum readable size for most users. Increase to 9px minimum throughout.

---

## Section 5: Presentation-Impact Upgrades

### 5.1 The Title Needs Gravitas
"Gdansk history through the lenses of churches" is descriptive but flat. For a presentation-grade product, consider: **"Gdańsk: Eight Centuries of Sacred Stone"** or **"The Sacred Landscape of Gdańsk, 1186–2005"**. The diacritical mark (ń) signals authenticity. The date range signals scope.

### 5.2 Add a Subtle Texture to the Parchment Zone
The flat `#f5edd8` parchment feels digital. Adding a very subtle noise texture (CSS background-image with a tiny repeating grain pattern at 3-5% opacity) would give the timeline area a tactile, archival quality. This is a 1-line CSS change with massive perceived quality improvement.

### 5.3 The Heraldic Shields Deserve a Showcase
The SVG shields in the detail drawer are beautifully crafted but hidden inside a scroll area. Consider displaying them as a "coat of arms gallery" in the Church List screen — a grid of all 16 shields with church names below. This creates a visually stunning browsing experience and gives the shields the prominence they deserve.

### 5.4 Add Print/Export Capability
For after the presentation, allow exporting the current view as a high-resolution PNG or PDF. This transforms the app from ephemeral to sharable. Use `html2canvas` or similar.

### 5.5 Loading State Should Feel Intentional
The 0.35s fade-in on load feels like the app is hesitating. Replace with a brief, elegant sequence: dark screen → amber line draws across → timeline fades in. This signals craftsmanship.

### 5.6 Add Ambient Sound Option (Bold Suggestion)
A very subtle, optional medieval ambient sound (distant bells, wind) that plays at low volume during presentations would create an immersive atmosphere. Toggle with a speaker icon. This is unusual but memorable — it signals that the creator went beyond the expected.

### 5.7 The Minimap Should Be Beautiful
The current minimap is a functional but visually bland canvas. Render it with the same denomination colours as the main timeline, add era colour bands behind it, and give it a slight shadow. It should feel like a beautiful artefact, not a UI widget.

### 5.8 End-of-Timeline "Epilogue"
When the user scrolls to the rightmost extent (2005), there's just empty space. Add a brief text: "Gdańsk today: all 16 churches stand, 14 restored to Catholic worship. The oldest brick — Oliwa, 1186 — has outlived 39 rulers, 15 wars, and 16 plagues." This creates a narrative conclusion.

---

## Section 6: Top 5 Highest-Impact Changes

These are the changes that would most dramatically improve the product, ranked by impact-to-effort ratio:

### #1: Add "Previous / Next" Church Navigation in the Drawer
**Impact: 10/10 | Effort: Low (2-3 hours)**
Currently, exploring churches requires close-drawer → click-another-label → wait-for-animation. Adding ◄ ► arrows in the drawer header (following sort order) transforms the app from "click-and-read" to "browse-and-discover." This single change would double the amount of content a user explores in a session.

### #2: Add Denomination Change Animation ("Play" Button)
**Impact: 10/10 | Effort: Medium (4-6 hours)**
A "Play" button that auto-scrolls the timeline while animating denomination bar colours would be the single most impressive feature for a presentation. Watching the Reformation sweep through Gdańsk visually is the "aha moment" the data is begging for. Sync with the map's year slider for full effect.

### #3: Cross-Reference Context Events with Churches
**Impact: 9/10 | Effort: Medium (4-6 hours)**
When the user clicks a war or political event, show which churches were affected. When hovering a context track element, draw faint vertical connector lines through affected church lanes. This makes the **causal relationship** between history and architecture visible — which is the entire thesis of the app.

### #4: Floating "Current Year" Indicator
**Impact: 8/10 | Effort: Low (1-2 hours)**
A floating year badge that tracks the viewport center eliminates the #1 cognitive load issue: "What year am I looking at?" This is a small UI element with outsized impact on usability. Add era name below it for full context.

### #5: Visual Epoch Bands Across Church Lanes
**Impact: 8/10 | Effort: Low (1-2 hours)**
Add extremely subtle (3-5% opacity) background colour bands extending through all church lanes, matching the era colours in the axis. Teutonic period gets a slight warm tint, Polish period a cool tint. This creates unconscious temporal grouping without any text or UI — the timeline "feels" different in different centuries. It's the kind of refinement that makes people say "I don't know what it is, but this feels really well-designed."

---

*Audit conducted 2026-02-21. This application has exceptional intellectual depth, meticulous historical research, and a sophisticated data architecture. The improvements above are not about fixing a broken product — they are about elevating an already impressive creation to a level where it commands the room during any presentation.*
