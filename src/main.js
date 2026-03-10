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
import { updateViewRangeLabel, buildFilterChips, buildChurchBar, buildTrackToggles, buildChurchRow, renderLegend, initLegendPanel, initChurchSelector, toggleFilters, toggleMobileChrome, switchTab, setupMobileTouchDismiss, buildMobileFilters, initPatronageToggle, initBottomSheet } from './ui.js?v=6';
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
    + '.tl-ctx-stub, .tl-axis-stub, .tl-labels, .range-handle, .axis-track';

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
function _initViewMode() {
  const toggle = document.getElementById('viewModeToggle');
  if (!toggle) return;

  // Mobile (≤768) defaults to 'churches', desktop to 'combined'
  const defaultMode = window.innerWidth <= 768 ? 'churches' : 'combined';
  const saved = localStorage.getItem('viewMode') || defaultMode;

  _applyViewMode(saved);

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    _applyViewMode(mode);
    localStorage.setItem('viewMode', mode);
    _dismissOnboarding();
  });
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
    setViewStart(DEFAULT_VIEW_START);
    setViewEnd(DEFAULT_VIEW_END);
    zoomFit();   // → _afterZoom → render + updateViewRangeLabel + _syncUI
  });

  // Export so external code (zoom, _afterZoom) can sync the handles
  window._updateRangeHandles = _syncUI;
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

  // Map toggle
  document.getElementById('mapToggleBtn')?.addEventListener('click', toggleMapPanel);

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

  // Jump (era nav) buttons — zoom to fit the entire era
  document.querySelectorAll('.jump-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const clickedYear = +btn.dataset.year;

      // Find the era that matches this year
      const era = eras.find(e => clickedYear >= e.start && clickedYear < e.end);
      if (!era) {
        scrollToYear(clickedYear);
        return;
      }

      // Fit the timeline to exactly this era's date range
      const eraWidth = era.end - era.start;
      const lanesScroll = document.getElementById('lanesScroll');
      if (lanesScroll) {
        // Calculate pixels-per-year needed to fit the era in the available viewport width
        const viewportWidth = lanesScroll.clientWidth;
        const idealPPY = (viewportWidth * 0.85) / eraWidth; // Use 85% of viewport for padding

        // Set zoom to fit era
        setPixelsPerYear(Math.max(Math.min(idealPPY, 50), 2)); // Clamp between 2 and 50

        // Then scroll to center the era
        setTimeout(() => {
          const eraStartX = yearToX(era.start);
          const eraMidX = yearToX((era.start + era.end) / 2);
          const scrollX = Math.max(0, eraMidX - viewportWidth / 2);
          lanesScroll.scrollTo({ left: scrollX, behavior: 'smooth' });

          // Sync map year to era start
          if (isMapExpanded() && era.start >= 1186 && era.start <= 2000) {
            setMapYear(Math.round(era.start));
          }
        }, 50);
      }
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

    // Pad 15% of era width each side (min 15 years) so adjacent period blocks
    // stay visible and clickable — preserves the "navigate by clicking" UX.
    const eraWidth = era.end - era.start;
    const pad = Math.max(15, Math.round(eraWidth * 0.15));
    setViewStart(Math.max(START_YEAR, era.start - pad));
    setViewEnd(Math.min(END_YEAR,   era.end   + pad));

    // Auto-fit zoom and sync handles + labels in one call
    zoomFit();   // → _afterZoom → render + updateViewRangeLabel + _updateRangeHandles

    // Scroll content to the beginning of the period
    const lanesScroll = document.getElementById('lanesScroll');
    if (lanesScroll) lanesScroll.scrollTo({ left: 0, behavior: 'smooth' });
  });

  // Tab bar
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // KB help button
  document.getElementById('btnKbHelp')?.addEventListener('click', toggleKbHelp);

  // Range slider reset (goes to full 1200–2005)
  document.getElementById('btnResetRange')?.addEventListener('click', () => {
    resetViewRange();
    render();
    updateViewRangeLabel();
    window._updateRangeHandles?.();
  });
}

// ── Init sequence ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Determine label column width
  setLabelOffset(window.innerWidth <= 768 ? 110 : 180);

  // Apply default focus view (medieval / early-modern) before first render
  setViewStart(DEFAULT_VIEW_START);   // 1200
  setViewEnd(DEFAULT_VIEW_END);       // 1750

  // Prime sorted indices with default sort (setSort handles direction + button state)
  setSort(currentSort);
  setRenderSortKey(currentSort);

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

  // Controls chrome — default collapsed
  _initChromeCollapse();

  // Integrated range handles (on the unified axis)
  initRangeHandles();

  // View Mode segmented control (Combined / Churches / Context)
  _initViewMode();

  // One-time onboarding tip
  _initOnboarding();

  // Legend panel
  initLegendPanel();

  // Church compact selector
  initChurchSelector();

  // Patronage mode (guild lens) toggle
  initPatronageToggle();

  // Mobile bottom sheet
  initBottomSheet();

  // Drag-to-pan (desktop)
  _initDragToPan();

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
