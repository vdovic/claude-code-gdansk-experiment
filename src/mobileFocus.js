// ═══════════ MOBILE FOCUS WINDOW ═══════════
// Transform-based horizontal panning for the mobile timeline.
// Creates a "film strip" experience: the user looks through a fixed
// window (~150 years) while the full 800-year timeline scrolls beneath.
//
// Architecture:
//   • NO DOM rearrangement — existing HTML structure is preserved.
//   • #lanesScroll: overflow-x hidden (transforms handle panning),
//     overflow-y auto (native vertical scroll for church rows).
//   • #lanesInner: translateX(-offset) → church bars pan.
//   • .ctx-inner (excl. econEras): translateX(-offset) → context tracks sync.
//   • #econErasRow .tl-ctx-scroll: independent horizontal scroll (Periods).
//   • .tl-labels: always visible — church names stay fixed on left.
//   • Mobile ruler: inserted inside #lanesScroll (sticky top), pans in sync.

import {
  viewStart, viewEnd, pixelsPerYear, labelOffset,
  setPixelsPerYear,
  START_YEAR, END_YEAR,
} from './state.js';
import { render } from './render.js';

// ── Configurable constants ──────────────────────────────────────
/** Number of years visible in the mobile viewport at once. */
export const MOBILE_FOCUS_SPAN = 150;

/** Drag threshold in px — movement below this is treated as a tap. */
const DRAG_THRESHOLD = 10;

/** Momentum friction */
const FRICTION = 0.94;

/** Minimum velocity to continue momentum animation */
const MIN_VELOCITY = 0.3;

// ── Module state ────────────────────────────────────────────────
let _active    = false;
let _offset    = 0;       // current translateX offset (px, positive = scrolled right)
let _maxOffset = 0;
let _vpWidth   = 0;       // width of the visible viewport area (px)

// Drag state
let _pointerId  = null;
let _startX     = 0;
let _startY     = 0;
let _startOff   = 0;
let _dragging   = false;
let _didDrag    = false;
let _gestureDecided = false;

// Momentum state
let _velocity   = 0;
let _lastX      = 0;
let _lastTime   = 0;
let _momentumId = null;

// DOM refs (cached on init)
let _lanesInner  = null;
let _lanesScroll = null;
let _tlOuter     = null;
let _ctxInners   = [];
let _ctxScrolls  = [];
let _ruler       = null;
let _rulerInner  = null;
let _viewLabel   = null;
let _fadeL       = null;
let _fadeR       = null;
let _sprocketTop = null;
let _sprocketBot = null;

// ── Public API ──────────────────────────────────────────────────

export function initMobileFocus() {
  if (_active) return;

  _lanesScroll = document.getElementById('lanesScroll');
  _lanesInner  = document.getElementById('lanesInner');
  _tlOuter     = document.getElementById('tlOuter');
  if (!_lanesScroll || !_lanesInner || !_tlOuter) return;

  // Collect context track elements, EXCLUDING the Periods row
  _ctxScrolls = [...document.querySelectorAll('.tl-ctx-scroll')]
    .filter(el => !el.closest('#econErasRow'));
  _ctxInners  = [...document.querySelectorAll('.ctx-inner')]
    .filter(el => el.id !== 'econErasInner');

  _active = true;

  // ── Set pixelsPerYear to show exactly MOBILE_FOCUS_SPAN years ──
  // _lanesScroll.clientWidth is the bar area (window width minus label column)
  const vpW = _lanesScroll.clientWidth || (window.innerWidth - 110);
  const targetPPY = Math.max(vpW / MOBILE_FOCUS_SPAN, 2);
  setPixelsPerYear(targetPPY);
  render();

  // ── Create ruler inside lanesScroll (sticky, above church bars) ──
  _createRuler();

  // ── Create visual cue elements ──
  _createOverlayElements();

  // ── Override native horizontal scroll — transforms handle it ──
  // IMPORTANT: keep overflowY working so church rows can scroll vertically.
  _lanesScroll.style.overflowX = 'hidden';
  _lanesScroll.style.touchAction = 'pan-y';

  // Context track scrolls: disable native horizontal pan (transforms handle it)
  _ctxScrolls.forEach(el => {
    el.style.overflowX = 'hidden';
    el.style.touchAction = 'pan-y';
  });

  // Ensure Periods row stays independently horizontally scrollable
  const econScroll = document.querySelector('#econErasRow .tl-ctx-scroll');
  if (econScroll) {
    econScroll.style.overflowX = 'auto';
    econScroll.style.touchAction = 'pan-x';
  }

  // Compute layout after reflow
  requestAnimationFrame(() => {
    _recalcLayout();

    // Start at ~1250 (early Gdańsk)
    const startYear = Math.max(viewStart, 1250);
    _offset = Math.max(0, Math.min((startYear - viewStart) * pixelsPerYear, _maxOffset));
    _applyTransform();
    _updateViewLabel();
    _renderRulerTicks();

    // Flash the viewing label briefly
    if (_viewLabel) {
      _viewLabel.classList.add('visible');
      setTimeout(() => { if (_viewLabel) _viewLabel.classList.remove('visible'); }, 2500);
    }
  });

  // Attach pointer events on tlOuter so they cover the whole timeline area
  if (_tlOuter) {
    _tlOuter.addEventListener('pointerdown', _onPointerDown, { passive: false });
    _tlOuter.addEventListener('pointermove', _onPointerMove, { passive: false });
    _tlOuter.addEventListener('pointerup',   _onPointerUp);
    _tlOuter.addEventListener('pointercancel', _onPointerUp);
    _tlOuter.addEventListener('click', _suppressClick, true);
  }

  // Activate CSS class last (after layout computed)
  requestAnimationFrame(() => {
    document.body.classList.add('mobile-focus-active');
  });
}

export function destroyMobileFocus() {
  if (!_active) return;
  _active = false;

  // Restore native scroll behaviour
  if (_lanesScroll) {
    _lanesScroll.style.overflowX = '';
    _lanesScroll.style.touchAction = '';
  }
  _ctxScrolls.forEach(el => {
    el.style.overflowX = '';
    el.style.touchAction = '';
  });

  // Remove transforms
  _setTranslate(_lanesInner, 0);
  _ctxInners.forEach(el => _setTranslate(el, 0));

  // Remove ruler (was inserted into lanesScroll)
  if (_ruler && _ruler.parentNode) _ruler.parentNode.removeChild(_ruler);
  _ruler = null; _rulerInner = null;

  // Remove overlay elements
  _removeOverlayElements();

  document.body.classList.remove('mobile-focus-active');

  if (_tlOuter) {
    _tlOuter.removeEventListener('pointerdown', _onPointerDown);
    _tlOuter.removeEventListener('pointermove', _onPointerMove);
    _tlOuter.removeEventListener('pointerup',   _onPointerUp);
    _tlOuter.removeEventListener('pointercancel', _onPointerUp);
    _tlOuter.removeEventListener('click', _suppressClick, true);
  }
}

/** Called after render() or tab switch to re-sync geometry. */
export function syncMobileFocus() {
  if (!_active) return;
  requestAnimationFrame(() => {
    const vpW = _lanesScroll?.clientWidth || 0;
    if (vpW === 0) return;

    // Re-set pixelsPerYear to enforce exactly MOBILE_FOCUS_SPAN visible
    const targetPPY = Math.max(vpW / MOBILE_FOCUS_SPAN, 2);
    if (Math.abs(pixelsPerYear - targetPPY) > 0.1) {
      setPixelsPerYear(targetPPY);
      render();
    }

    _recalcLayout();
    _offset = Math.max(0, Math.min(_offset, _maxOffset));
    _applyTransform();
    _updateViewLabel();
    _renderRulerTicks();
  });
}

// ── Layout computation ──────────────────────────────────────────

function _recalcLayout() {
  if (!_lanesScroll || !_lanesInner) return;
  _vpWidth   = _lanesScroll.clientWidth;
  const totalW = (viewEnd - viewStart) * pixelsPerYear + 60;
  _maxOffset = Math.max(0, totalW - _vpWidth);
}

// ── Transform helpers ───────────────────────────────────────────

function _setTranslate(el, offset) {
  if (el) el.style.transform = `translateX(${-offset}px)`;
}

function _applyTransform() {
  _setTranslate(_lanesInner, _offset);
  _ctxInners.forEach(el => _setTranslate(el, _offset));
  if (_rulerInner) _setTranslate(_rulerInner, _offset);
}

// ── Year ruler ──────────────────────────────────────────────────

function _createRuler() {
  if (!_lanesScroll) return;

  _ruler = document.createElement('div');
  _ruler.className = 'mobile-ruler';
  _ruler.id = 'mobileRuler';

  _rulerInner = document.createElement('div');
  _rulerInner.className = 'mobile-ruler-inner';
  _rulerInner.id = 'mobileRulerInner';
  _ruler.appendChild(_rulerInner);

  // Insert as first child of lanesScroll — it sits above church bars
  // position: sticky keeps it visible when scrolling vertically
  _lanesScroll.insertBefore(_ruler, _lanesScroll.firstChild);
}

function _renderRulerTicks() {
  if (!_rulerInner) return;
  _rulerInner.innerHTML = '';

  const totalW = (viewEnd - viewStart) * pixelsPerYear + 60;
  _rulerInner.style.width = totalW + 'px';

  const majorInterval = 100;
  const minorInterval = 25;

  for (let yr = Math.ceil(viewStart / minorInterval) * minorInterval; yr <= viewEnd; yr += minorInterval) {
    const x = (yr - viewStart) * pixelsPerYear;
    const isMajor = yr % majorInterval === 0;
    const isMid   = !isMajor && yr % 50 === 0;

    const tick = document.createElement('div');
    tick.className = 'mobile-ruler-tick' + (isMajor ? ' major' : isMid ? ' mid' : '');
    tick.style.left = x + 'px';

    const lbl = document.createElement('span');
    lbl.className = 'mobile-ruler-yr';
    lbl.textContent = yr;
    tick.appendChild(lbl);

    _rulerInner.appendChild(tick);
  }
}

// ── Visual cue elements ─────────────────────────────────────────

function _createOverlayElements() {
  const wrap = _tlOuter;
  if (!wrap) return;

  // Film strip sprocket holes — top
  _sprocketTop = document.createElement('div');
  _sprocketTop.className = 'film-sprocket film-sprocket-top';
  wrap.appendChild(_sprocketTop);

  // Film strip sprocket holes — bottom
  _sprocketBot = document.createElement('div');
  _sprocketBot.className = 'film-sprocket film-sprocket-bottom';
  wrap.appendChild(_sprocketBot);

  // Left edge fade (at label column right edge)
  _fadeL = document.createElement('div');
  _fadeL.className = 'mobile-focus-fade mobile-focus-fade-l';
  wrap.appendChild(_fadeL);

  // Right edge fade
  _fadeR = document.createElement('div');
  _fadeR.className = 'mobile-focus-fade mobile-focus-fade-r';
  wrap.appendChild(_fadeR);

  // "Viewing" year-range label
  _viewLabel = document.createElement('div');
  _viewLabel.className = 'mobile-focus-label';
  _viewLabel.textContent = '';
  wrap.appendChild(_viewLabel);
}

function _removeOverlayElements() {
  [_fadeL, _fadeR, _viewLabel, _sprocketTop, _sprocketBot].forEach(el => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  _fadeL = _fadeR = _viewLabel = _sprocketTop = _sprocketBot = null;
}

function _updateViewLabel() {
  if (!_viewLabel || _vpWidth === 0) return;
  const leftYear  = Math.round(viewStart + _offset / pixelsPerYear);
  const rightYear = Math.round(viewStart + (_offset + _vpWidth) / pixelsPerYear);
  const clamped   = Math.min(rightYear, viewEnd);
  _viewLabel.textContent = `${leftYear} – ${clamped}`;
}

// ── Pointer event handlers ──────────────────────────────────────

function _onPointerDown(e) {
  if (!_active) return;
  if (e.pointerType === 'mouse') return;
  if (e.target.closest('button, input, select, a, .filter-chip, .sort-btn, .ctrl-btn, .bottom-sheet-tab, .pill-btn, .pill-toggle, .legend-panel, .drawer, .bottom-sheet, .econ-era-block, .econ-era-m-card')) return;

  // Cancel any ongoing momentum
  if (_momentumId) { cancelAnimationFrame(_momentumId); _momentumId = null; }

  _pointerId = e.pointerId;
  _startX    = e.clientX;
  _startY    = e.clientY;
  _startOff  = _offset;
  _dragging  = false;
  _didDrag   = false;
  _gestureDecided = false;
  _velocity  = 0;
  _lastX     = e.clientX;
  _lastTime  = performance.now();
}

function _onPointerMove(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  const dx = e.clientX - _startX;
  const dy = e.clientY - _startY;

  if (!_gestureDecided) {
    const totalMove = Math.abs(dx) + Math.abs(dy);
    if (totalMove < DRAG_THRESHOLD) return;

    _gestureDecided = true;

    // Vertical gesture → yield to browser (native vertical scroll)
    if (Math.abs(dy) > Math.abs(dx)) {
      _pointerId = null;
      return;
    }

    // Horizontal → we handle it
    _dragging = true;
    _didDrag  = true;
    document.body.classList.add('mobile-focus-dragging');
    try { e.target.closest('#tlOuter')?.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }

  if (_dragging) {
    e.preventDefault();
    const now = performance.now();
    const dt  = now - _lastTime;
    if (dt > 0) {
      _velocity = (e.clientX - _lastX) / dt * 16;
    }
    _lastX    = e.clientX;
    _lastTime = now;

    const newOffset = _startOff - dx;
    _offset = Math.max(0, Math.min(newOffset, _maxOffset));
    _applyTransform();
    _updateViewLabel();

    if (_viewLabel) _viewLabel.classList.add('visible');
  }
}

function _onPointerUp(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  if (_dragging) {
    document.body.classList.remove('mobile-focus-dragging');
    _dragging = false;

    if (Math.abs(_velocity) > MIN_VELOCITY) {
      _startMomentum();
    } else {
      _scheduleHideLabel();
    }

    try { e.target.closest('#tlOuter')?.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  _pointerId = null;
}

function _suppressClick(e) {
  if (_didDrag) {
    _didDrag = false;
    e.stopPropagation();
    e.preventDefault();
  }
}

// ── Momentum animation ──────────────────────────────────────────

function _startMomentum() {
  function frame() {
    _velocity *= FRICTION;
    if (Math.abs(_velocity) < MIN_VELOCITY) {
      _momentumId = null;
      _scheduleHideLabel();
      return;
    }
    _offset = Math.max(0, Math.min(_offset - _velocity, _maxOffset));
    _applyTransform();
    _updateViewLabel();
    _momentumId = requestAnimationFrame(frame);
  }
  _momentumId = requestAnimationFrame(frame);
}

let _hideLabelTimer = null;
function _scheduleHideLabel() {
  clearTimeout(_hideLabelTimer);
  _hideLabelTimer = setTimeout(() => {
    if (_viewLabel) _viewLabel.classList.remove('visible');
  }, 1500);
}
