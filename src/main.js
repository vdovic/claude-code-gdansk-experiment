// ═══════════ MAIN MODULE ═══════════
// App entry point: initialises all modules, wires up scroll sync,
// keyboard shortcuts, zoom, search, and the DOMContentLoaded sequence.

import { churches } from './data/churches.js';
import { eras }     from './data/context.js';
import {
  START_YEAR, END_YEAR, DEFAULT_VIEW_START, DEFAULT_VIEW_END,
  viewStart, viewEnd,
  pixelsPerYear, setPixelsPerYear, labelOffset, setLabelOffset,
  yearToX, getTotalWidth,
  currentSort, getSortedIndices, sortedIndices,
  setSort, applyFilters,
  resetViewRange, setViewStart, setViewEnd,
  allTracksOn, trackVisibility,
} from './state.js';
import { render, renderAxis, renderContextTracks, setRenderSortKey, initGrainTooltip } from './render.js';
import { economicEras } from './data/economic.js';
import { updateViewRangeLabel, buildFilterChips, buildChurchBar, buildTrackToggles, buildChurchRow, renderLegend, initLegendPanel, initChurchSelector, toggleFilters, toggleMobileChrome, switchTab, setupMobileTouchDismiss, buildMobileFilters, initBottomSheet } from './ui.js?v=10';
import { renderMap, toggleMapPanel, setMapYear, isMapExpanded } from './map.js';
import { closePanel }  from './detail.js';
import { setupTooltipClickHandling, hideTT } from './tooltip.js';

// ── Expose scrollToYear globally so detail.js/ui.js can call it ─
window._scrollToYear = scrollToYear;

// ── Zoom ──────────────────────────────────────────────────────
export function zoomIn() {
  setPixelsPerYear(Math.min(pixelsPerYear * 1.4, 50));
  _afterZoom();
}
export function zoomOut() {
  setPixelsPerYear(Math.max(pixelsPerYear / 1.4, 2));
  _afterZoom();
}
export function zoomFit() {
  const lanesScroll = document.getElementById('lanesScroll');
  if (!lanesScroll) return;
  const fitPPY = lanesScroll.clientWidth / (viewEnd - viewStart);
  setPixelsPerYear(Math.max(fitPPY, 2));
  _afterZoom();
}

function _afterZoom() {
  render();
  updateViewRangeLabel();
  window._updateRangeHandles?.();
}

// ── Navigation ────────────────────────────────────────────────
export function scrollToYear(yr) {
  const lanesScroll = document.getElementById('lanesScroll');
  if (!lanesScroll) return;
  const x = Math.max(0, yearToX(yr) - lanesScroll.clientWidth / 3);
  lanesScroll.scrollTo({ left: x, behavior: 'smooth' });
  // Sync map year if map is visible
  if (isMapExpanded() && yr >= 1186 && yr <= 2000) {
    setMapYear(Math.round(yr));
  }
}

// ── Search ────────────────────────────────────────────────────
export function searchEvents(q) {
  q = q.toLowerCase().trim();
  document.querySelectorAll('.evt-dot').forEach(el => {
    if (!q) { el.style.opacity = '1'; el.classList.remove('highlight-pulse'); return; }
    const ci  = +el.dataset.ci;
    const ei  = +el.dataset.ei;
    const ev  = churches[ci].events[ei];
    const hit = ev.label.toLowerCase().includes(q)
      || ev.detail.toLowerCase().includes(q)
      || churches[ci].name.toLowerCase().includes(q);
    el.style.opacity = hit ? '1' : '0.08';
    hit ? el.classList.add('highlight-pulse') : el.classList.remove('highlight-pulse');
  });
  document.querySelectorAll('.war-bar').forEach((el, i) => {
    if (!q) { el.style.opacity = ''; return; }
    import('./data/context.js').then(({ wars }) => {
      if (i >= wars.length) return;
      const w = wars[i];
      el.style.opacity = (w.label.toLowerCase().includes(q) || w.detail.toLowerCase().includes(q)) ? '0.85' : '0.08';
    });
  });
  document.querySelectorAll('.political-marker').forEach((el, i) => {
    if (!q) { el.style.opacity = '1'; return; }
    import('./data/context.js').then(({ politicalEvents }) => {
      if (i >= politicalEvents.length) return;
      const e = politicalEvents[i];
      el.style.opacity = (e.label.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)) ? '1' : '0.08';
    });
  });
  document.querySelectorAll('.calamity-marker').forEach((el, i) => {
    if (!q) { el.style.opacity = '1'; return; }
    import('./data/context.js').then(({ calamities }) => {
      if (i >= calamities.length) return;
      const e = calamities[i];
      el.style.opacity = (e.label.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)) ? '1' : '0.08';
    });
  });
}

// ── Keyboard shortcuts ────────────────────────────────────────
let _kbOverlayOpen = false;
export function toggleKbHelp() {
  _kbOverlayOpen = !_kbOverlayOpen;
  const ov = document.getElementById('kbOverlay');
  if (ov) ov.classList.toggle('open', _kbOverlayOpen);
}

function _initKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanel(); _hideKb(); return; }
    if (e.target.tagName === 'INPUT') return;
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
    if (e.key === 'f' || e.key === 'F') zoomFit();
    if (e.key === 'm' || e.key === 'M') toggleMapPanel();
    if (e.key === '?') toggleKbHelp();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const lanesScroll = document.getElementById('lanesScroll');
      if (!lanesScroll) return;
      const currentX    = lanesScroll.scrollLeft + lanesScroll.clientWidth / 2;
      const currentYear = viewStart + currentX / pixelsPerYear;
      let targetEra;
      if (e.key === 'ArrowRight') {
        targetEra = eras.find(era => era.start > currentYear + 5);
      } else {
        for (let i = eras.length - 1; i >= 0; i--) {
          if (eras[i].start < currentYear - 5) { targetEra = eras[i]; break; }
        }
      }
      if (targetEra) scrollToYear(targetEra.start);
    }
  });
}

function _hideKb() {
  _kbOverlayOpen = false;
  document.getElementById('kbOverlay')?.classList.remove('open');
}

// ── Scroll sync (v6 pattern) ──────────────────────────────────
// lanesScroll drives: all ctx-scroll elements, tlLabels (Y only)
// Note: axis is now static (full-range overview), so no horizontal sync needed.
function _initScrollSync() {
  const lanesScroll = document.getElementById('lanesScroll');
  const tlLabels    = document.getElementById('tlLabels');
  if (!lanesScroll) return;

  lanesScroll.addEventListener('scroll', () => {
    const sx = lanesScroll.scrollLeft;
    const sy = lanesScroll.scrollTop;

    if (tlLabels)    tlLabels.scrollTop      = sy;

    // Context track scroll rows
    document.querySelectorAll('.tl-ctx-scroll').forEach(el => { el.scrollLeft = sx; });

  }, { passive: true });
}

// ── Resize handler (debounced) ────────────────────────────────
let _resizeTimer = null;
function _initResize() {
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      setLabelOffset(window.innerWidth <= 768 ? 110 : 180);
      setRenderSortKey(currentSort);
      render();
      updateViewRangeLabel();
    }, 120);
  });
}


// ── Drag-to-pan (desktop) ─────────────────────────────────────
// Click-drag on the main timeline area pans horizontally by changing scrollLeft.
// The existing scroll-sync handler keeps axis and context tracks in sync.
function _initDragToPan() {
  const tlOuter     = document.getElementById('tlOuter');
  const lanesScroll = document.getElementById('lanesScroll');
  if (!tlOuter || !lanesScroll) return;

  const THRESHOLD = 4; // px before treating as drag

  // Elements where drag should NOT start (interactive controls)
  const INTERACTIVE = 'button, input, select, a, .evt-dot, .war-bar, .ruler-bar, '
    + '.political-marker, .calamity-marker, .econ-era-block, .filter-chip, '
    + '.church-selector, .sort-btn, .ctrl-btn, .track-toggle, .ch-label, '
    + '.tl-ctx-stub, .tl-axis-stub, .tl-labels, .range-handle, .axis-track, .panel-label';

  let pointerId    = null;   // active pointer id (null = not tracking)
  let startX       = 0;      // clientX at pointerdown
  let startScroll  = 0;      // scrollLeft at pointerdown
  let dragging     = false;  // true once threshold exceeded
  let didDrag      = false;  // sticky flag cleared after click suppression

  tlOuter.addEventListener('pointerdown', e => {
    // Only primary (left) button
    if (e.button !== 0) return;
    // Skip interactive elements
    if (e.target.closest(INTERACTIVE)) return;

    startX      = e.clientX;
    startScroll = lanesScroll.scrollLeft;
    pointerId   = e.pointerId;
    dragging    = false;
    didDrag     = false;

    tlOuter.setPointerCapture(e.pointerId);
    e.preventDefault(); // prevent text selection
  });

  tlOuter.addEventListener('pointermove', e => {
    if (pointerId === null || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;

    // Check threshold before activating drag
    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) return;
      dragging = true;
      didDrag  = true;
      document.body.classList.add('timeline-panning');
    }

    // Apply scroll: drag left (negative dx) → scrollLeft increases → see later years
    lanesScroll.scrollLeft = startScroll - dx;
  });

  const _endDrag = (e) => {
    if (pointerId === null) return;
    if (e && e.pointerId !== pointerId) return;

    if (dragging) {
      document.body.classList.remove('timeline-panning');
      dragging = false;
    }

    if (pointerId !== null) {
      try { tlOuter.releasePointerCapture(pointerId); } catch (_) { /* already released */ }
    }
    pointerId = null;
  };

  tlOuter.addEventListener('pointerup', _endDrag);
  tlOuter.addEventListener('pointercancel', _endDrag);

  // Suppress click events that follow a drag gesture (capture phase)
  tlOuter.addEventListener('click', e => {
    if (didDrag) {
      didDrag = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
}

// ── Chrome collapse init (default hidden) ─────────────────────
function _initChromeCollapse() {
  const chrome = document.getElementById('mChrome');
  const btn    = document.getElementById('mChromeToggle');
  if (!chrome || !btn) return;
  // Default collapsed unless user explicitly expanded ('0')
  const saved = localStorage.getItem('chromeCollapsed');
  if (saved !== '0') {
    chrome.classList.add('collapsed');
    btn.classList.add('collapsed');
    btn.textContent = '▶';
  }
}

// ── View Mode segmented control ────────────────────────────────
// Handles both the header pill (desktop) and the bar pill (mobile).
function _initViewMode() {
  const toggles = document.querySelectorAll('.pill-toggle');
  if (!toggles.length) return;

  // Default to 'churches' on all screen sizes
  const defaultMode = 'churches';
  const saved = localStorage.getItem('viewMode') || defaultMode;

  _applyViewMode(saved);

  // ── First-visit discovery pulse ──
  // Pulse runs on whichever toggle is currently visible.
  const PULSE_KEY = 'switcherPulseSeen';
  if (!localStorage.getItem(PULSE_KEY)) {
    setTimeout(() => {
      const visible = Array.from(toggles).find(t => t.offsetParent !== null) || toggles[0];
      visible.classList.add('pill-discover');
      visible.addEventListener('animationend', () => {
        visible.classList.remove('pill-discover');
        localStorage.setItem(PULSE_KEY, '1');
      }, { once: true });
    }, 1000);
  }

  toggles.forEach(toggle => {
    toggle.addEventListener('click', e => {
      const btn = e.target.closest('.pill-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      // Cancel pulse on any interaction
      if (!localStorage.getItem(PULSE_KEY)) {
        toggles.forEach(t => t.classList.remove('pill-discover'));
        localStorage.setItem(PULSE_KEY, '1');
      }
      _applyViewMode(mode);
      localStorage.setItem('viewMode', mode);
      _dismissOnboarding();
    });
  });
}

// ── Draggable split handle between context and church panels ────
// --ctx-h is set as an element-scoped CSS variable directly on #contextPanel.
// This means:
//   • body.mode-combined uses it:  height: var(--ctx-h, auto)
//   • body.mode-churches ignores it: height: 0  (that rule doesn't use var())
//   → No cascade conflict; no need to clear on mode-switch.
const SPLIT_KEY = 'gdansk-splitH';

// ── Context panel height initialiser ──────────────────────────────────────────
// Ensures #contextPanel always gets an explicit px height in combined mode so:
//  (a) there is no empty gap below the last context row, and
//  (b) the CHURCHES drag-handle is always visible.
// Priority: (1) user-dragged value persisted in localStorage,
//           (2) measured sum of .tl-ctx-row heights (natural content height),
//               capped so at least 60 px of the church section remains visible.
function _setCtxHeight() {
  const ctxPanel = document.getElementById('contextPanel');
  const handle   = document.getElementById('churchesLabel');
  const tlOuter  = document.getElementById('tlOuter');
  if (!ctxPanel || !handle || !tlOuter) return;
  if (!document.body.classList.contains('mode-combined')) return;

  const saved = localStorage.getItem(SPLIT_KEY);
  if (saved) {
    ctxPanel.style.setProperty('--ctx-h', saved + 'px');
    return;
  }

  // Measure after layout so rows have their final heights.
  requestAnimationFrame(() => {
    const rows       = ctxPanel.querySelectorAll('.tl-ctx-row');
    const contentH   = [...rows].reduce((s, r) => s + (r.getBoundingClientRect().height || 0), 0);
    const outerH     = tlOuter.getBoundingClientRect().height;
    const labelH     = handle.getBoundingClientRect().height || 20;
    // Reserve at least 30% of the outer height (min 150px) for the church section
    const minChurchH = Math.max(150, Math.round(outerH * 0.30));
    const maxH       = Math.max(100, outerH - labelH - minChurchH);
    const h          = Math.max(60, Math.min(contentH || 220, maxH));
    ctxPanel.style.setProperty('--ctx-h', h + 'px');
  });
}

function _initSplitHandle() {
  const handle   = document.getElementById('churchesLabel');
  const ctxPanel = document.getElementById('contextPanel');
  const tlOuter  = document.getElementById('tlOuter');
  if (!handle || !ctxPanel || !tlOuter) return;

  // Set initial height (restores saved drag value or measures natural content height).
  _setCtxHeight();

  let dragging = false, startY = 0, startH = 0, _maxDragH = 9999;

  function _startDrag(e) {
    if (!document.body.classList.contains('mode-combined')) return;
    dragging = true;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    startH = ctxPanel.scrollHeight > ctxPanel.clientHeight
           ? ctxPanel.getBoundingClientRect().height
           : ctxPanel.scrollHeight;

    // Hard cap: content height + 1.5× the grain-export row height.
    // This limits the dark empty-space zone to a shallow visual cue only.
    const visRows  = [...ctxPanel.querySelectorAll('.tl-ctx-row')]
                       .filter(r => r.offsetParent !== null);
    const contentH = visRows.reduce((s, r) => s + r.getBoundingClientRect().height, 0);
    const grainRow = document.getElementById('grainRow');
    const grainH   = grainRow ? grainRow.getBoundingClientRect().height : 48;
    const outerH   = tlOuter.getBoundingClientRect().height;
    const labelH   = handle.getBoundingClientRect().height || 20;
    const minChurchH = Math.max(150, Math.round(outerH * 0.30));
    _maxDragH = Math.min(
      contentH + Math.round(grainH * 0.5),       // content + half grain-row dark-zone allowance
      Math.max(100, outerH - labelH - minChurchH) // must leave room for churches
    );

    document.body.classList.add('split-dragging');
    e.preventDefault();
  }

  function _onDrag(e) {
    if (!dragging) return;
    const y    = e.touches ? e.touches[0].clientY : e.clientY;
    const newH = Math.max(60, Math.min(startH + (y - startY), _maxDragH));
    ctxPanel.style.setProperty('--ctx-h', newH + 'px');
    e.preventDefault();
  }

  function _endDrag() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('split-dragging');
    localStorage.setItem(SPLIT_KEY, Math.round(ctxPanel.getBoundingClientRect().height));
  }

  handle.addEventListener('mousedown',  _startDrag);
  handle.addEventListener('touchstart', _startDrag, { passive: false });
  document.addEventListener('mousemove', _onDrag,   { passive: false });
  document.addEventListener('touchmove', _onDrag,   { passive: false });
  document.addEventListener('mouseup',   _endDrag);
  document.addEventListener('touchend',  _endDrag);
}

function _applyViewMode(mode) {
  // Map legacy 'context'-only localStorage value to 'combined'
  if (mode === 'context') mode = 'combined';

  document.body.classList.remove('mode-combined', 'mode-churches', 'mode-context');
  document.body.classList.add('mode-' + mode);

  // Update active button + ARIA
  document.querySelectorAll('.pill-btn').forEach(b => {
    const isActive = b.dataset.mode === mode;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });

  // Ensure tracks are visible when context is needed
  if (mode === 'combined' || mode === 'context') {
    const anyOn = Object.values(trackVisibility).some(v => v);
    if (!anyOn) { allTracksOn(); buildTrackToggles(); }
    renderContextTracks();
    // Re-apply panel height so handle stays visible after every mode switch.
    if (mode === 'combined') _setCtxHeight();
  }

  // Auto-scroll to top of church rows when switching to churches mode
  if (mode === 'churches') {
    setTimeout(() => {
      const lanesScroll = document.getElementById('lanesScroll');
      if (lanesScroll) lanesScroll.scrollTop = 0;
    }, 50);
  }
}

// ── Integrated Range Handles (on the unified axis) ────────────
// Handles and ticks share one coordinate system:
//   percentage = (year − START_YEAR) / (END_YEAR − START_YEAR) × 100
// The axis never re-renders during drag — only handle/fill CSS positions
// update, eliminating the layout-reflow jitter that plagued the old strip.

const _AX_SPAN = END_YEAR - START_YEAR;     // 805
function _yearPct(y)  { return ((y - START_YEAR) / _AX_SPAN) * 100; }
function _pctToYear(p) { return Math.round(START_YEAR + Math.max(0, Math.min(100, p)) / 100 * _AX_SPAN); }

function initRangeHandles() {
  const track     = document.getElementById('axisTrack');
  const fill      = document.getElementById('rangeFill');
  const muteL     = document.getElementById('rangeMuteL');
  const muteR     = document.getElementById('rangeMuteR');
  const hl        = document.getElementById('rangeHandleL');
  const hr        = document.getElementById('rangeHandleR');
  const label     = document.getElementById('rangeLabel');
  const reset     = document.getElementById('rangeReset');
  const dragLabel = document.getElementById('rangeDragLabel');
  const pMarkerL  = document.getElementById('periodMarkerL');
  const pMarkerR  = document.getElementById('periodMarkerR');
  if (!track) return;

  // ── clientX → year using the SAME coordinate system as ticks ──
  function _clientToYear(clientX) {
    const rect = track.getBoundingClientRect();
    const pct  = ((clientX - rect.left) / rect.width) * 100;
    return _pctToYear(pct);
  }

  // ── Position handles, fill, and mute overlays ──────────────────
  function _syncUI() {
    const lPct = _yearPct(viewStart);
    const rPct = _yearPct(viewEnd);

    // Handles
    hl.style.left = lPct + '%';
    hr.style.left = rPct + '%';

    // Fill highlight (full height of axis-track)
    fill.style.left  = lPct + '%';
    fill.style.width = (rPct - lPct) + '%';

    // Muted overlays (only cover the tick area, top:14px via CSS)
    muteL.style.width = lPct + '%';
    muteR.style.width = (100 - rPct) + '%';

    // Label
    label.textContent = viewStart + ' – ' + viewEnd;
    hl.setAttribute('aria-valuenow', viewStart);
    hr.setAttribute('aria-valuenow', viewEnd);

  }

  // ── Throttled render for drag (timeline content updates) ────────
  let _rafId = null;
  function _scheduleRender() {
    if (_rafId) return;
    _rafId = requestAnimationFrame(() => {
      _rafId = null;
      render();
      updateViewRangeLabel();
    });
  }

  // ── Drag feedback label ─────────────────────────────────────────
  function _showDragLabel(handle, year) {
    dragLabel.textContent = year;
    dragLabel.style.left = handle.style.left;
    dragLabel.classList.add('visible');
  }
  function _hideDragLabel() {
    dragLabel.classList.remove('visible');
  }

  // ── Pointer-capture drag ────────────────────────────────────────
  // setPointerCapture routes ALL pointer events to the capturing element,
  // preventing lost tracking when cursor leaves the handle or scrollable areas.
  // The axis is static (never re-renders during drag), so getBoundingClientRect()
  // on the track is stable — no jitter from layout reflows.
  function _makeDraggable(handle, isLeft) {
    handle.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      handle.setPointerCapture(ev.pointerId);
      handle.classList.add('dragging');
      _hidePeriodMarkers();

      function onMove(e) {
        if (!handle.hasPointerCapture(e.pointerId)) return;
        const yr = _clientToYear(e.clientX);
        // Consistent 50-year minimum gap (matches setViewStart/setViewEnd clamping)
        if (isLeft) {
          setViewStart(Math.min(yr, viewEnd - 50));
        } else {
          setViewEnd(Math.max(yr, viewStart + 50));
        }
        _syncUI();
        _showDragLabel(handle, isLeft ? viewStart : viewEnd);
        _scheduleRender();
      }
      function onUp(e) {
        handle.releasePointerCapture(e.pointerId);
        handle.classList.remove('dragging');
        handle.removeEventListener('pointermove',   onMove);
        handle.removeEventListener('pointerup',     onUp);
        handle.removeEventListener('pointercancel', onUp);
        _hideDragLabel();
        // Auto-fit the timeline width to the newly selected range
        zoomFit();   // → _afterZoom → render + updateViewRangeLabel + _syncUI
      }
      handle.addEventListener('pointermove',   onMove);
      handle.addEventListener('pointerup',     onUp);
      handle.addEventListener('pointercancel', onUp);
    });
  }

  _makeDraggable(hl, true);
  _makeDraggable(hr, false);

  // ── Click anywhere on track → snap nearest handle ──────────────
  track.addEventListener('pointerdown', ev => {
    if (ev.target === hl || ev.target === hr) return;
    // Ignore clicks on tick labels
    if (ev.target.closest('.yr-tick')) return;
    ev.preventDefault();
    const yr   = _clientToYear(ev.clientX);
    const dL   = Math.abs(yr - viewStart);
    const dR   = Math.abs(yr - viewEnd);
    const doLeft = dL <= dR;
    if (doLeft) setViewStart(Math.min(yr, viewEnd - 50));
    else        setViewEnd(Math.max(yr, viewStart + 50));
    _syncUI();
    _scheduleRender();

    // Hand off to the nearest handle's drag
    const handle = doLeft ? hl : hr;
    handle.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: ev.pointerId, pointerType: ev.pointerType,
      clientX: ev.clientX, clientY: ev.clientY,
      bubbles: true, cancelable: true,
    }));
  });

  // ── Reset button ────────────────────────────────────────────────
  reset.addEventListener('click', () => {
    _hidePeriodMarkers();
    setViewStart(DEFAULT_VIEW_START);
    setViewEnd(DEFAULT_VIEW_END);
    zoomFit();   // → _afterZoom → render + updateViewRangeLabel + _syncUI
  });

  // ── Period boundary markers ─────────────────────────────────
  function _showPeriodMarkers(startYear, endYear) {
    if (!pMarkerL || !pMarkerR) return;
    const lPct = _yearPct(startYear);
    const rPct = _yearPct(endYear);
    pMarkerL.style.left = lPct + '%';
    pMarkerR.style.left = rPct + '%';
    pMarkerL.querySelector('.period-marker-yr').textContent = startYear;
    pMarkerR.querySelector('.period-marker-yr').textContent = endYear;
    pMarkerL.classList.add('visible');
    pMarkerR.classList.add('visible');
  }
  function _hidePeriodMarkers() {
    if (pMarkerL) pMarkerL.classList.remove('visible');
    if (pMarkerR) pMarkerR.classList.remove('visible');
  }

  // Export so external code (zoom, _afterZoom) can sync the handles
  window._updateRangeHandles = _syncUI;
  window._showPeriodMarkers = _showPeriodMarkers;
  window._hidePeriodMarkers = _hidePeriodMarkers;
  _syncUI();
}

// ── Onboarding tip ─────────────────────────────────────────────
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

// ── DOM wiring: buttons declared in index.html ────────────────
function _wireButtons() {
  // Zoom
  document.getElementById('btnZoomIn')?.addEventListener('click', zoomIn);
  document.getElementById('btnZoomOut')?.addEventListener('click', zoomOut);
  document.getElementById('btnZoomFit')?.addEventListener('click', zoomFit);

  // Map year slider (desktop)
  document.getElementById('mapYearSlider')?.addEventListener('input', e => setMapYear(+e.target.value));

  // Map year slider (fullscreen map tab)
  document.getElementById('mapYearSliderFs')?.addEventListener('input', e => setMapYear(+e.target.value));

  // Search
  document.getElementById('searchInput')?.addEventListener('input', e => searchEvents(e.target.value));

  // Chrome toggle
  document.getElementById('mChromeToggle')?.addEventListener('click', toggleMobileChrome);

  // Close drawer overlay click
  document.getElementById('drawerOverlay')?.addEventListener('click', closePanel);
  document.getElementById('drawerClose')?.addEventListener('click', closePanel);

  // KB overlay close
  document.getElementById('kbClose')?.addEventListener('click', _hideKb);
  document.getElementById('kbOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) _hideKb();
  });

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setSort(btn.dataset.sort);
      setRenderSortKey(btn.dataset.sort);
      render();
    });
  });

  // Economic era blocks — click to focus the period with context padding so
  // adjacent periods remain partially visible and clickable for easy navigation.
  document.getElementById('econErasInner')?.addEventListener('click', e => {
    const block = e.target.closest('.econ-era-block');
    if (!block) return;
    const idx = +block.dataset.idx;
    const era = economicEras[idx];
    if (!era) return;

    // Snap exactly to the period's start and end — no padding.
    // Set END first so setViewStart's 50-yr clamp uses the new viewEnd.
    setViewEnd(Math.min(END_YEAR,   era.end));
    setViewStart(Math.max(START_YEAR, era.start));

    // Auto-fit zoom and sync handles + labels in one call
    zoomFit();   // → _afterZoom → render + updateViewRangeLabel + _updateRangeHandles

    // Show exact period boundary markers at the un-padded start/end
    if (window._showPeriodMarkers) window._showPeriodMarkers(era.start, era.end);

    // Scroll content to the beginning of the period
    const lanesScroll = document.getElementById('lanesScroll');
    if (lanesScroll) lanesScroll.scrollTo({ left: 0, behavior: 'smooth' });
  });

  // Tab bar
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Range slider reset (goes to full 1200–2005)
  document.getElementById('btnResetRange')?.addEventListener('click', () => {
    resetViewRange();
    render();
    updateViewRangeLabel();
    window._updateRangeHandles?.();
  });
}

// ── [EXPERIMENT] Synced Periods toggle ─────────────────────────
// Creates a small ⚗ Sync button inside the Periods row stub.
// Clicking it toggles between the original pixel-positioned layout
// (scrollable, drift-prone) and the experimental %-positioned layout
// (fixed, aligned with axis ruler). The current implementation is
// preserved — the experiment only changes the rendering path for the
// econEras row. Synced-periods is permanently on; no toggle button exposed.
function _initSyncedPeriodsToggle() {
  document.getElementById('econErasRow')?.classList.add('synced-periods');
}

// ── Init sequence ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Determine label column width
  setLabelOffset(window.innerWidth <= 768 ? 110 : 180);

  // Apply default focus view (medieval / early-modern) before first render
  setViewStart(DEFAULT_VIEW_START);   // 1200
  setViewEnd(DEFAULT_VIEW_END);       // 1750

  // Prime sorted indices with default sort (setSort handles direction + button state)
  setSort('established');
  setRenderSortKey('established');

  // Apply initial filter state (all visible)
  applyFilters();

  // Render all components
  renderLegend();
  buildTrackToggles();
  buildChurchRow();
  buildFilterChips();
  buildChurchBar();
  render();
  updateViewRangeLabel();

  // Scroll sync and resize
  _initScrollSync();
  _initResize();

  // Tooltip pin handling
  setupTooltipClickHandling();

  // Grain track tooltip (persistent mousemove listener)
  initGrainTooltip();

  // Keyboard
  _initKeyboard();

  // Wire all buttons/controls
  _wireButtons();

  // Integrated range handles (on the unified axis)
  initRangeHandles();

  // View Mode segmented control (Combined / Churches / Context)
  _initViewMode();

  // Draggable split between context and church panels
  _initSplitHandle();

  // One-time onboarding tip
  _initOnboarding();

  // Legend panel
  initLegendPanel();

  // Church compact selector
  initChurchSelector();

  // Mobile bottom sheet
  initBottomSheet();

  // Drag-to-pan (desktop)
  _initDragToPan();

  // [EXPERIMENT] Synced periods toggle (align period bands with ruler)
  _initSyncedPeriodsToggle();

  // Mobile touch dismiss
  setupMobileTouchDismiss();

  // Auto-fit + initial view range label (after brief layout settle)
  setTimeout(() => {
    const lanesScroll = document.getElementById('lanesScroll');
    if (lanesScroll) {
      const fitPPY = lanesScroll.clientWidth / (viewEnd - viewStart);
      if (fitPPY < pixelsPerYear) {
        setPixelsPerYear(Math.max(fitPPY, 2.5));
        render();
      }
    }
    updateViewRangeLabel();
    window._updateRangeHandles?.();
  }, 150);

});
