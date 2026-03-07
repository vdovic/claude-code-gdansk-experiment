# Plan: View Mode Toggle + Controls Collapse + Onboarding

## Overview
Replace "Hide Analysis" + "Focus Churches" with a unified View Mode segmented control,
add subtle panel labels/dividers, and show a one-time onboarding tip.

## Files to Modify
1. **index.html** — DOM restructure
2. **src/styles.css** — New styles for view toggle, panel labels, onboarding; remove old Focus Churches + analysis toggle styles
3. **src/main.js** — New `_initViewMode()` replacing `_initAnalysisToggle()`, new `_initOnboarding()`
4. **src/ui.js** — Stop calling `initFocusChurches` (make it a no-op so existing imports don't break)

---

## Step-by-Step

### Step 1: HTML Restructure (index.html)

**a) Remove** the `focusChurchesBtn` button from the controls bar (line ~104).

**b) Replace** the old `<button class="analysis-toggle-btn" id="analysisToggleBtn">` (line 212) with a **View Mode bar** containing the segmented control plus a CONTEXT section label:

```html
<!-- View Mode bar (always visible between axis and panels) -->
<div class="view-mode-bar" id="viewModeBar">
  <span class="panel-label" id="contextLabel">CONTEXT</span>
  <div class="view-mode-toggle" id="viewModeToggle" role="radiogroup" aria-label="View mode">
    <button class="vm-btn active" data-mode="combined" role="radio" aria-checked="true">Combined</button>
    <button class="vm-btn" data-mode="churches" role="radio" aria-checked="false">Churches</button>
    <button class="vm-btn" data-mode="context" role="radio" aria-checked="false">Context</button>
  </div>
</div>
```

**c) Rename** `id="analysisSection"` to `id="contextPanel"`. Keep the closing `</div>` comment updated.

**d) Add** a CHURCHES section label + give `.tl-lanes-wrap` an id. Before the existing `.tl-lanes-wrap`:

```html
<div class="panel-label" id="churchesLabel">CHURCHES</div>
```

And add `id="churchPanel"` to the existing `.tl-lanes-wrap` div.

**e) Add** onboarding tip element after the view mode bar (inside `#tlOuter`, after `#viewModeBar`):

```html
<div class="onboarding-tip" id="onboardingTip" aria-hidden="true">
  <span>Tip: Switch to <b>Churches</b> to explore freely,
  or <b>Context</b> to study historical background.</span>
  <button class="onboarding-close" id="onboardingClose" aria-label="Dismiss">&times;</button>
</div>
```

### Step 2: CSS (src/styles.css)

**a) Replace** the `.analysis-toggle-btn` block and `#analysisSection` / `#analysisSection.collapsed` block with:

- `.view-mode-bar` — full-width flex row, background matches timeline parchment, thin border-bottom, 4px vertical padding
- `.panel-label` — 9px uppercase, letter-spacing 0.08em, muted color, left padding matching label column width, thin top-border as divider, 2px vertical padding. Very subtle — doesn't draw attention but provides orientation.
- `.view-mode-toggle` — inline-flex group of pill buttons, sits on the right side of the bar
- `.vm-btn` — 10px uppercase text, padding 3px 10px, transparent bg, border-radius, cursor pointer
- `.vm-btn.active` — accent background tint + accent text color
- Light theme variants for all of the above

**b) Add** panel collapse CSS via body mode classes:

```css
/* Context panel collapse (churches mode) */
body.mode-churches #contextPanel,
body.mode-churches #contextLabel { max-height: 0; opacity: 0; overflow: hidden; pointer-events: none; padding: 0; border: none; transition: max-height 200ms ease, opacity 200ms ease; }

/* Church panel collapse (context mode) */
body.mode-context #churchPanel,
body.mode-context #churchesLabel { max-height: 0; opacity: 0; overflow: hidden; pointer-events: none; padding: 0; border: none; transition: max-height 200ms ease, opacity 200ms ease; }
```

**c) Add** `.onboarding-tip` styles:
- Positioned relative within `#tlOuter` flow (not absolute)
- Subtle background: `rgba(212,162,83,0.08)` dark / `rgba(42,122,138,0.06)` light
- Small text (11px), accent-tinted, dismissable
- `.onboarding-tip.hidden` with opacity 0 + max-height 0 transition for fade-out

**d) Add** `@media (prefers-reduced-motion: reduce)` overrides for all new transitions.

**e) Remove** these old CSS blocks:
- `.focus-churches-btn` and all variants (lines ~2017-2037)
- `body.focus-churches .tl-ctx-row` rule
- `.analysis-toggle-btn` styles
- `#analysisSection` / `#analysisSection.collapsed` styles

### Step 3: JavaScript — main.js

**a) Replace** `_initAnalysisToggle()` with `_initViewMode()`:

```
function _initViewMode() {
  const toggle = document.getElementById('viewModeToggle');
  if (!toggle) return;

  // Determine default: mobile (<=768) defaults to 'churches', desktop to 'combined'
  const defaultMode = window.innerWidth <= 768 ? 'churches' : 'combined';
  const saved = localStorage.getItem('viewMode') || defaultMode;

  _applyViewMode(saved);

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('.vm-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    _applyViewMode(mode);
    localStorage.setItem('viewMode', mode);
    _dismissOnboarding();
  });
}

function _applyViewMode(mode) {
  document.body.classList.remove('mode-combined', 'mode-churches', 'mode-context');
  document.body.classList.add('mode-' + mode);

  // Update active button + ARIA
  document.querySelectorAll('.vm-btn').forEach(b => {
    const isActive = b.dataset.mode === mode;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });

  // Ensure tracks are visible when context is needed
  if (mode === 'combined' || mode === 'context') {
    const anyOn = Object.values(trackVisibility).some(v => v);
    if (!anyOn) { allTracksOn(); buildTrackToggles(); }
    renderContextTracks();
  }

  // Auto-scroll to relevant section after a brief layout settle
  if (mode === 'churches') {
    setTimeout(() => {
      const lanesScroll = document.getElementById('lanesScroll');
      if (lanesScroll) lanesScroll.scrollTop = 0;
    }, 50);
  }
}
```

**b) Add** `_initOnboarding()`:
```
function _initOnboarding() {
  if (localStorage.getItem('onboardingSeen')) return;
  const tip = document.getElementById('onboardingTip');
  if (!tip) return;

  setTimeout(() => {
    tip.classList.add('visible');
    tip.setAttribute('aria-hidden', 'false');
  }, 600);

  const dismiss = () => {
    tip.classList.remove('visible');
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    localStorage.setItem('onboardingSeen', '1');
  };

  window._dismissOnboarding = dismiss;
  document.getElementById('onboardingClose')?.addEventListener('click', dismiss);
  setTimeout(dismiss, 7000);
}

function _dismissOnboarding() {
  if (window._dismissOnboarding) window._dismissOnboarding();
}
```

**c) Update** DOMContentLoaded sequence:
- Remove `_initAnalysisToggle();` call
- Remove `initFocusChurches();` call
- Add `_initViewMode();` (after render() so DOM exists)
- Add `_initOnboarding();` (after _initViewMode)

**d) Update** imports:
- Remove `initFocusChurches` from the ui.js import (keep allTracksOn, buildTrackToggles, renderContextTracks)
- Clean up any unused imports (`allTracksOff` may still be needed by ui.js internally)
- Remove old localStorage keys cleanup: `analysisCollapsed` is no longer used

### Step 4: ui.js Cleanup

**a)** Remove `initFocusChurches` from the main.js import line. The function stays in ui.js but is no longer called.

**b)** The `toggleFocusChurches` function remains in ui.js (it's used by the bottom sheet — would need to verify), but body.focus-churches CSS rules are removed so it's effectively a no-op visually.

### Step 5: Verify & Test
- Start dev server with preview_start
- Screenshot all 3 modes (Combined, Churches, Context)
- Verify no console errors
- Verify mobile layout (375px)
- Verify localStorage persistence across reload
- Verify onboarding tip appears once then never again
- Verify existing features still work (filters, sort, search, tooltips, map)
