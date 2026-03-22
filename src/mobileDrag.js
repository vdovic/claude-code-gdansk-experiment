// ══ mobileDrag.js ══
// Mobile-only horizontal drag/swipe handler for the timeline viewport.
// Converts horizontal touch movement into mobileViewStart updates via
// the contained coordinate layer established in Step 2.
//
// Desktop is never affected — initMobileDrag() is only called from
// _applyViewport('mobile') in main.js; destroyMobileDrag() is called
// on every viewport switch so state never leaks across modes.
//
// ── Event target ─────────────────────────────────────────────────────────────
// Listeners are attached to #tlOuter (the common ancestor of the whole
// timeline area) rather than to #lanesScroll alone.  This lets gestures
// start on Global Context rows as well as on church lanes, so both areas
// move together.
//
// _onPointerDown filters by hit-test so only events originating inside
// #contextPanel or #lanesScroll are accepted.  Events on #churchesLabel
// (the vertical split-resize handle) are explicitly rejected so its own
// touchstart/touchmove logic is never interrupted.
//
// ── "Time navigation mode" UI ────────────────────────────────────────────────
// When a drag gesture commits (threshold crossed), we enter "tl-dragging"
// state by adding the class to document.body. Two CSS changes fire:
//
//   1. #econErasRow fades to opacity:0 (but keeps its layout space).
//   2. #mobileRangeLabel switches to position:fixed, centred over the
//      Periods row, and rendered as a prominent pill.
//
// The label's fixed position is computed once per drag from the ruler
// track's getBoundingClientRect() and stored as CSS custom properties
// (--mrl-top / --mrl-left) on :root. CSS uses those vars directly;
// no per-frame JS positioning is needed.
//
// On drag end:
//   • After LABEL_HOLD_MS the pill fades in place (.is-fading added).
//   • After LABEL_FADE_MS (opacity transition done) both classes are
//     removed — label snaps back to the ruler corner while invisible,
//     Periods row fades back in.
//
// destroyMobileDrag() forces immediate cleanup so no dangling state
// leaks across viewport switches.

import {
  setMobileViewStart, mobileViewStart,
  MOBILE_TIMELINE_WINDOW_YEARS, START_YEAR, END_YEAR,
} from './state.js';
import { mobilePPY, renderLanes, renderContextTracks } from './render.js';

// Minimum horizontal movement (px) before we commit to a horizontal drag.
// 6 px is large enough to survive tap jitter, small enough to feel instant.
const DRAG_THRESHOLD = 6;

// How long the pill stays fully visible after the finger lifts (ms).
const LABEL_HOLD_MS = 100;

// How long to wait after adding .is-fading before resetting state (ms).
// Should be slightly longer than the CSS opacity transition (0.28s → 280 ms).
const LABEL_FADE_MS = 320;

// ── Module state ─────────────────────────────────────────────────────────────
let _active        = false;
let _tlOuter       = null;   // #tlOuter  — the unified event-listener target
let _lanesEl       = null;   // #lanesScroll — ghost-click suppression target
let _captureEl     = null;   // element on which setPointerCapture was called
let _ctxScrollEls  = [];     // .tl-ctx-scroll elements — style-managed during mobile

let _pointerId = null;   // pointer being tracked (null = idle)
let _startX    = 0;
let _startY    = 0;
let _startVS   = 0;      // mobileViewStart at the moment the drag began
let _dragging  = false;  // true once threshold is crossed and gesture committed

let _holdTimer    = null;  // LABEL_HOLD_MS delay after drag end
let _restoreTimer = null;  // LABEL_FADE_MS delay after .is-fading is added

// ── Navigation mode helpers ───────────────────────────────────────────────────
//
// All three functions operate only on DOM + CSS — no state beyond the timers.

// Compute the center of the ruler's bar track in viewport coords and store
// as CSS custom properties so the fixed pill is positioned correctly.
// Called once per drag when the gesture commits.
function _measureLabelAnchor() {
  const track = document.querySelector('#mobileRuler .mobile-ruler-track');
  const econ  = document.getElementById('econErasRow');
  if (!track || !econ) return;

  const trackRect = track.getBoundingClientRect();
  const econRect  = econ.getBoundingClientRect();

  // Horizontal: centre of the ruler's track column (right of the label stub).
  // The track spans exactly the bar area so this avoids the label column.
  const x = trackRect.left + trackRect.width  / 2;

  // Vertical: centre of the Periods row (where the pill will visually live).
  const y = econRect.top  + econRect.height / 2;

  const root = document.documentElement;
  root.style.setProperty('--mrl-left', `${x}px`);
  root.style.setProperty('--mrl-top',  `${y}px`);
}

// Enter "time navigation mode": show pill, fade Periods row.
function _enterNavMode() {
  _clearTimers();
  _measureLabelAnchor();
  document.body.classList.add('tl-dragging');
}

// Begin the exit sequence: pill fades in place, then Periods row restores.
function _scheduleExitNavMode() {
  _clearTimers();
  _holdTimer = setTimeout(() => {
    // Phase 1 — fade the pill while it is still centered / fixed.
    const label = document.getElementById('mobileRangeLabel');
    if (label) label.classList.add('is-fading');

    // Phase 2 — after transition completes: snap back to corner (invisible),
    // remove dragging state, Periods row fades back in via CSS transition.
    _restoreTimer = setTimeout(() => {
      const lbl = document.getElementById('mobileRangeLabel');
      if (lbl) lbl.classList.remove('is-fading');
      document.body.classList.remove('tl-dragging');
    }, LABEL_FADE_MS);
  }, LABEL_HOLD_MS);
}

// Immediate cleanup — used by destroyMobileDrag() and pointercancel.
function _exitNavModeNow() {
  _clearTimers();
  const label = document.getElementById('mobileRangeLabel');
  if (label) label.classList.remove('is-fading');
  document.body.classList.remove('tl-dragging');
}

function _clearTimers() {
  clearTimeout(_holdTimer);
  clearTimeout(_restoreTimer);
}

// ── Pointer lifecycle ─────────────────────────────────────────────────────────

function _onPointerDown(e) {
  // Touch only — desktop mouse drag is handled by the existing _initDragToPan()
  if (e.pointerType === 'mouse') return;
  // Ignore a second finger while one is already tracked
  if (_pointerId !== null) return;

  // ── Hit-test: only accept gestures starting inside allowed zones ──────────
  //
  // Allowed:  #contextPanel (Global Context rows)
  //           #lanesScroll  (church lanes)
  //
  // Rejected: #churchesLabel — the vertical split-resize drag handle.
  //           Its own touchstart/touchmove handlers must not be interrupted.
  //           Everything else in #tlOuter (axis, ruler, toggles) is also
  //           rejected so we don't steal gestures from controls.
  const handle = document.getElementById('churchesLabel');
  if (handle && handle.contains(e.target)) return;

  const ctxPanel = document.getElementById('contextPanel');
  const inCtx    = ctxPanel && ctxPanel.contains(e.target);
  const inLanes  = _lanesEl  && _lanesEl.contains(e.target);
  if (!inCtx && !inLanes) return;

  // Listeners live on #tlOuter, so pointer capture must also be on #tlOuter.
  // After capture, all subsequent pointer events for this ID are dispatched
  // here regardless of where the finger moves.
  _captureEl = _tlOuter;

  _pointerId = e.pointerId;
  _startX    = e.clientX;
  _startY    = e.clientY;
  _startVS   = mobileViewStart;   // anchor for the whole drag
  _dragging  = false;
}

function _onPointerMove(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  const dx = e.clientX - _startX;
  const dy = e.clientY - _startY;

  if (!_dragging) {
    // Wait until the finger has moved enough to call it intentional
    if (Math.abs(dx) < DRAG_THRESHOLD) return;

    // If vertical movement dominates at threshold, yield to native scroll
    // (the browser will scroll church rows up/down as expected).
    if (Math.abs(dy) > Math.abs(dx)) {
      _pointerId = null;
      return;
    }

    // Commit to horizontal drag: capture the pointer so subsequent
    // move/up events keep firing even if the finger leaves the element.
    _dragging = true;
    _captureEl.setPointerCapture(e.pointerId);

    // Enter "time navigation mode" — pill appears, Periods row fades.
    _enterNavMode();
  }

  // Prevent the browser from also scrolling vertically while we pan
  e.preventDefault();

  // ── px → year conversion ──────────────────────────────────────────────────
  // mobilePPY (px per year) is a live ES-module binding written by
  // renderLanes() on every repaint. It reflects the current bar-area
  // width ÷ MOBILE_TIMELINE_WINDOW_YEARS so the gesture always feels
  // proportional to what is on screen.
  //
  // Direction: dragging RIGHT (dx > 0) = finger moving toward earlier
  // history = mobileViewStart should decrease.
  const ppy      = mobilePPY > 0 ? mobilePPY : 1;   // guard against 0 before first render
  const newStart = _startVS - dx / ppy;

  // Clamping is handled inside setMobileViewStart():
  //   lower bound: START_YEAR (1150)
  //   upper bound: END_YEAR − MOBILE_TIMELINE_WINDOW_YEARS (2005 − 150 = 1855)
  setMobileViewStart(newStart);

  // Repaint church lanes + all context tracks in sync.
  // renderLanes()         → updates church bars, grid, and mobile ruler ticks.
  // renderContextTracks() → re-renders rulers/wars/political/etc. at the new
  //                         mobileViewStart using the same _ctxX coordinate fn,
  //                         keeping every visible row pixel-perfectly aligned.
  renderLanes();
  renderContextTracks();
}

function _onPointerUp(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  // Capture drag state before we clear it — used for post-release decisions.
  const wasDragging = _dragging;

  _pointerId = null;
  _dragging  = false;

  // Explicitly release pointer capture.  The browser also auto-releases on
  // pointerup, but being explicit prevents any ambiguity in edge cases.
  try { _captureEl?.releasePointerCapture(e.pointerId); } catch (_) { /* already released */ }
  _captureEl = null;

  if (wasDragging) {
    // pointerup DOES generate a subsequent click event (the browser synthesises
    // it from the touch sequence).  Intercept it in the capture phase before
    // any child handler (.evt-dot click, .ch-label click) sees it.
    // once:true removes the listener after it fires so no legitimate tap is
    // ever suppressed.
    // Ghost-click suppression targets #lanesScroll (where evt-dot and ch-label
    // listeners live).  Context row click handlers are benign (no drawer opens),
    // so we only need to guard the lanes area.
    if (_lanesEl) {
      _lanesEl.addEventListener('click', _suppressClick, { capture: true, once: true });
    }

    // Begin exit sequence: pill holds, then fades, then Periods restores.
    _scheduleExitNavMode();
  }
}

// pointercancel fires when the OS steals the gesture (incoming call, scroll
// lock, palm rejection, etc.).  Unlike pointerup, it does NOT generate a
// click event — registering _suppressClick here would cause the listener to
// sit idle and fire against the next legitimate tap instead.
function _onPointerCancel(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  const wasDragging = _dragging;

  _pointerId = null;
  _dragging  = false;

  try { _captureEl?.releasePointerCapture(e.pointerId); } catch (_) { /* already released */ }
  _captureEl = null;

  if (wasDragging) {
    // Gesture was interrupted — collapse nav mode immediately rather than
    // letting the hold/fade timers run.
    _exitNavModeNow();
  }
}

function _suppressClick(e) {
  // Stop the ghost-click from reaching any child handler (evt-dot, ch-label).
  // capture:true already puts us ahead of bubbling listeners; stopPropagation
  // is the primary guard.  preventDefault is added defensively.
  e.stopPropagation();
  e.preventDefault();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initMobileDrag() {
  if (_active) destroyMobileDrag();   // clean slate if re-initialising

  _tlOuter = document.getElementById('tlOuter');
  _lanesEl = document.getElementById('lanesScroll');
  if (!_tlOuter) return;

  // Disable native horizontal scroll so browser pan-x never fights our handler.
  // touch-action: pan-y keeps native vertical scroll alive for scrolling through
  // church rows while our JS owns the horizontal axis.
  if (_lanesEl) {
    _lanesEl.style.overflowX   = 'hidden';
    _lanesEl.style.touchAction = 'pan-y';
  }

  // Apply the same horizontal-scroll suppression to Global Context rows so a
  // gesture starting on a context row doesn't trigger native scroll before our
  // threshold logic runs.
  // Suppress native horizontal scroll on context rows so a gesture starting
  // on one of them doesn't trigger the browser's own pan-x before our
  // threshold logic runs.
  //
  // Exception: #econErasRow's scroll container is intentionally independent —
  // renderEconErasMobile() marks it data-no-sync="1" so the user can swipe
  // through historical periods without moving the main timeline.  Setting
  // overflow-x:hidden there would permanently break that interaction.
  _ctxScrollEls = [...document.querySelectorAll('.tl-ctx-scroll')]
    .filter(el => !el.closest('#econErasRow'));
  _ctxScrollEls.forEach(el => {
    el.style.overflowX   = 'hidden';
    el.style.touchAction = 'pan-y';
  });

  _tlOuter.addEventListener('pointerdown',   _onPointerDown);
  _tlOuter.addEventListener('pointermove',   _onPointerMove, { passive: false });
  _tlOuter.addEventListener('pointerup',     _onPointerUp);
  _tlOuter.addEventListener('pointercancel', _onPointerCancel);

  _active = true;
}

export function destroyMobileDrag() {
  if (!_active || !_tlOuter) return;

  // Restore scroll behaviour so desktop mode (or a re-init) starts clean
  if (_lanesEl) {
    _lanesEl.style.overflowX   = '';
    _lanesEl.style.touchAction = '';
  }
  _ctxScrollEls.forEach(el => {
    el.style.overflowX   = '';
    el.style.touchAction = '';
  });
  _ctxScrollEls = [];

  _tlOuter.removeEventListener('pointerdown',   _onPointerDown);
  _tlOuter.removeEventListener('pointermove',   _onPointerMove);
  _tlOuter.removeEventListener('pointerup',     _onPointerUp);
  _tlOuter.removeEventListener('pointercancel', _onPointerCancel);

  // Force-exit nav mode so no dangling class or timer survives the viewport switch.
  _exitNavModeNow();

  _tlOuter    = null;
  _lanesEl    = null;
  _captureEl  = null;
  _active     = false;
  _pointerId  = null;
  _dragging   = false;
}
