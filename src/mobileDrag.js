// ══ mobileDrag.js ══
// Mobile-only horizontal drag/swipe handler for the timeline viewport.
// Converts horizontal touch movement into mobileViewStart updates via
// the contained coordinate layer established in Step 2.
//
// Desktop is never affected — initMobileDrag() is only called from
// _applyViewport('mobile') in main.js; destroyMobileDrag() is called
// on every viewport switch so state never leaks across modes.

import {
  setMobileViewStart, mobileViewStart,
  MOBILE_TIMELINE_WINDOW_YEARS, START_YEAR, END_YEAR,
} from './state.js';
import { mobilePPY, renderLanes } from './render.js';

// Minimum horizontal movement (px) before we commit to a horizontal drag.
// 6 px is large enough to survive tap jitter, small enough to feel instant.
const DRAG_THRESHOLD = 6;

// Delay (ms) after drag release before the range label fades out.
const LABEL_HIDE_DELAY = 1000;

// ── Module state ─────────────────────────────────────────────
let _active    = false;
let _el        = null;   // #lanesScroll — the element we attach to
let _pointerId = null;   // pointer being tracked (null = idle)
let _startX    = 0;
let _startY    = 0;
let _startVS   = 0;      // mobileViewStart at the moment the drag began
let _dragging  = false;  // true once threshold is crossed and gesture committed

// ── Range label lifecycle ─────────────────────────────────────
// The label element (#mobileRangeLabel) is a persistent DOM node declared in
// index.html — it is never created or destroyed here, only shown/hidden via
// the .is-visible class. CSS opacity + transition does the actual fade.

let _hideTimer = null;   // pending setTimeout id for fade-out

function _showRangeLabel() {
  clearTimeout(_hideTimer);
  const el = document.getElementById('mobileRangeLabel');
  if (el) el.classList.add('is-visible');
}

function _scheduleHideRangeLabel() {
  clearTimeout(_hideTimer);
  _hideTimer = setTimeout(() => {
    const el = document.getElementById('mobileRangeLabel');
    if (el) el.classList.remove('is-visible');
  }, LABEL_HIDE_DELAY);
}

function _hideRangeLabelNow() {
  clearTimeout(_hideTimer);
  const el = document.getElementById('mobileRangeLabel');
  if (el) el.classList.remove('is-visible');
}

// ── Pointer lifecycle ─────────────────────────────────────────

function _onPointerDown(e) {
  // Touch only — desktop mouse drag is handled by the existing _initDragToPan()
  if (e.pointerType === 'mouse') return;
  // Ignore a second finger while one is already tracked
  if (_pointerId !== null) return;

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
    _el.setPointerCapture(e.pointerId);

    // Show the range label as soon as the gesture is committed
    _showRangeLabel();
  }

  // Prevent the browser from also scrolling vertically while we pan
  e.preventDefault();

  // ── px → year conversion ─────────────────────────────────────
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

  // Repaint church lanes with the new viewport window.
  // renderLanes() also calls renderMobileRuler() which updates the label text.
  renderLanes();
}

function _onPointerUp(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  if (_dragging) {
    // Suppress the click event that fires immediately after a drag-release
    // so a fast swipe doesn't accidentally open a church detail drawer.
    _el.addEventListener('click', _suppressClick, { capture: true, once: true });

    // Schedule the range label fade-out
    _scheduleHideRangeLabel();
  }

  _pointerId = null;
  _dragging  = false;
}

function _suppressClick(e) {
  e.stopPropagation();
  e.preventDefault();
}

// ── Public API ───────────────────────────────────────────────

export function initMobileDrag() {
  if (_active) destroyMobileDrag();   // clean slate if re-initialising

  _el = document.getElementById('lanesScroll');
  if (!_el) return;

  // Disable native horizontal scroll so browser pan-x never fights our handler.
  // touch-action: pan-y keeps native vertical scroll alive for scrolling through
  // church rows while our JS owns the horizontal axis.
  _el.style.overflowX  = 'hidden';
  _el.style.touchAction = 'pan-y';

  _el.addEventListener('pointerdown',   _onPointerDown);
  _el.addEventListener('pointermove',   _onPointerMove, { passive: false });
  _el.addEventListener('pointerup',     _onPointerUp);
  _el.addEventListener('pointercancel', _onPointerUp);

  _active = true;
}

export function destroyMobileDrag() {
  if (!_active || !_el) return;

  // Restore scroll behaviour so desktop mode (or a re-init) starts clean
  _el.style.overflowX   = '';
  _el.style.touchAction = '';

  _el.removeEventListener('pointerdown',   _onPointerDown);
  _el.removeEventListener('pointermove',   _onPointerMove);
  _el.removeEventListener('pointerup',     _onPointerUp);
  _el.removeEventListener('pointercancel', _onPointerUp);

  // Hide the label immediately — no dangling fade timer on viewport switch
  _hideRangeLabelNow();

  _el        = null;
  _active    = false;
  _pointerId = null;
  _dragging  = false;
}
