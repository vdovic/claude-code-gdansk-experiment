// ═══════════ MOBILE FOCUS WINDOW ═══════════
// Transform-based horizontal panning for the mobile timeline.
// Instead of native overflow-scroll, JS controls translateX on all
// timeline content, creating a "focus window" feel where the user
// drags through centuries with a fixed-width viewport.

import {
  viewStart, viewEnd, pixelsPerYear, labelOffset,
  START_YEAR, END_YEAR,
} from './state.js';

// ── Configurable constants ──────────────────────────────────────
/** Number of years visible in the mobile viewport at once. */
export const MOBILE_FOCUS_SPAN = 200;

/** Drag threshold in px — movement below this is treated as a tap. */
const DRAG_THRESHOLD = 10;

/** Momentum friction: 0.95 = smooth deceleration */
const FRICTION = 0.94;

/** Minimum velocity to continue momentum animation */
const MIN_VELOCITY = 0.3;

// ── Module state ────────────────────────────────────────────────
let _active    = false;   // is the focus window mode active?
let _offset    = 0;       // current translateX offset (px, positive = scrolled right)
let _maxOffset = 0;       // clamp upper bound
let _vpWidth   = 0;       // width of the visible viewport area (px)

// Drag state
let _pointerId  = null;
let _startX     = 0;
let _startOff   = 0;
let _dragging   = false;
let _didDrag    = false;

// Momentum state
let _velocity   = 0;
let _lastX      = 0;
let _lastTime   = 0;
let _momentumId = null;

// DOM refs (cached on init)
let _lanesInner  = null;
let _lanesScroll = null;
let _ctxInners   = [];
let _ctxScrolls  = [];
let _ruler       = null;
let _rulerInner  = null;
let _viewLabel   = null;
let _fadeL       = null;
let _fadeR       = null;
let _centerLine  = null;

// ── Public API ──────────────────────────────────────────────────

export function initMobileFocus() {
  if (_active) return;

  _lanesScroll = document.getElementById('lanesScroll');
  _lanesInner  = document.getElementById('lanesInner');
  if (!_lanesScroll || !_lanesInner) return;

  _ctxScrolls = [...document.querySelectorAll('.tl-ctx-scroll')];
  _ctxInners  = [...document.querySelectorAll('.ctx-inner')];

  // Create visual cue elements
  _createOverlayElements();

  // Create the mobile year ruler
  _createRuler();

  _active = true;

  // Disable native scroll on mobile, use transform instead
  _lanesScroll.style.overflow = 'hidden';
  _lanesScroll.style.touchAction = 'pan-y';  // allow vertical scroll, we handle horizontal
  _ctxScrolls.forEach(el => {
    el.style.overflow = 'hidden';
    el.style.touchAction = 'pan-y';
  });

  // Compute layout after reflow so clientWidth is correct
  requestAnimationFrame(() => {
    _recalcLayout();

    // Center on an interesting starting point (~1250, early Gdańsk)
    const startYear = Math.max(viewStart, 1250);
    _offset = Math.max(0, Math.min((startYear - viewStart) * pixelsPerYear, _maxOffset));
    _applyTransform();
    _updateViewLabel();
    _renderRulerTicks();

    // Show label briefly on load so user sees the year range
    if (_viewLabel) {
      _viewLabel.classList.add('visible');
      setTimeout(() => { if (_viewLabel) _viewLabel.classList.remove('visible'); }, 2500);
    }
  });

  // Attach pointer events for drag
  const target = document.getElementById('tlOuter');
  if (target) {
    target.addEventListener('pointerdown', _onPointerDown, { passive: false });
    target.addEventListener('pointermove', _onPointerMove, { passive: false });
    target.addEventListener('pointerup',   _onPointerUp);
    target.addEventListener('pointercancel', _onPointerUp);
    // Suppress clicks after drag
    target.addEventListener('click', _suppressClick, true);
  }

  // Show visual cues with a brief fade-in
  requestAnimationFrame(() => {
    document.body.classList.add('mobile-focus-active');
  });
}

export function destroyMobileFocus() {
  if (!_active) return;
  _active = false;

  // Restore native scroll
  if (_lanesScroll) {
    _lanesScroll.style.overflow = '';
    _lanesScroll.style.touchAction = '';
  }
  _ctxScrolls.forEach(el => {
    el.style.overflow = '';
    el.style.touchAction = '';
  });

  // Remove transform
  _setTranslate(_lanesInner, 0);
  _ctxInners.forEach(el => _setTranslate(el, 0));

  // Remove overlay elements
  _removeOverlayElements();

  // Remove ruler
  if (_ruler && _ruler.parentNode) _ruler.parentNode.removeChild(_ruler);
  _ruler = null;

  document.body.classList.remove('mobile-focus-active');

  const target = document.getElementById('tlOuter');
  if (target) {
    target.removeEventListener('pointerdown', _onPointerDown);
    target.removeEventListener('pointermove', _onPointerMove);
    target.removeEventListener('pointerup',   _onPointerUp);
    target.removeEventListener('pointercancel', _onPointerUp);
    target.removeEventListener('click', _suppressClick, true);
  }
}

/** Called after render() or tab switch to re-sync geometry. */
export function syncMobileFocus() {
  if (!_active) return;
  // Defer to next frame to ensure tab is visible and clientWidth is valid
  requestAnimationFrame(() => {
    _recalcLayout();
    if (_vpWidth === 0) return; // tab still hidden, skip
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
  // Insert ruler just before #churchPanel
  const churchPanel = document.getElementById('churchPanel');
  if (!churchPanel) return;

  _ruler = document.createElement('div');
  _ruler.className = 'mobile-ruler';
  _ruler.id = 'mobileRuler';

  _rulerInner = document.createElement('div');
  _rulerInner.className = 'mobile-ruler-inner';
  _rulerInner.id = 'mobileRulerInner';
  _ruler.appendChild(_rulerInner);

  churchPanel.parentNode.insertBefore(_ruler, churchPanel);
}

function _renderRulerTicks() {
  if (!_rulerInner) return;
  _rulerInner.innerHTML = '';

  const totalW = (viewEnd - viewStart) * pixelsPerYear + 60;
  _rulerInner.style.width = totalW + 'px';

  // Determine tick cadence based on pixelsPerYear
  const majorInterval = pixelsPerYear >= 4 ? 100 : 200;
  const minorInterval = pixelsPerYear >= 4 ? 25 : 50;

  for (let yr = Math.ceil(viewStart / minorInterval) * minorInterval; yr <= viewEnd; yr += minorInterval) {
    const x = (yr - viewStart) * pixelsPerYear;
    const isMajor = yr % majorInterval === 0;
    const isMid   = !isMajor && yr % (majorInterval / 2) === 0;

    const tick = document.createElement('div');
    tick.className = 'mobile-ruler-tick' + (isMajor ? ' major' : isMid ? ' mid' : '');
    tick.style.left = x + 'px';

    if (isMajor || isMid) {
      const lbl = document.createElement('span');
      lbl.className = 'mobile-ruler-yr';
      lbl.textContent = yr;
      tick.appendChild(lbl);
    }

    _rulerInner.appendChild(tick);
  }
}

// ── Visual cue elements ─────────────────────────────────────────

function _createOverlayElements() {
  const wrap = document.getElementById('churchPanel');
  if (!wrap) return;

  // Left edge fade
  _fadeL = document.createElement('div');
  _fadeL.className = 'mobile-focus-fade mobile-focus-fade-l';
  wrap.appendChild(_fadeL);

  // Right edge fade
  _fadeR = document.createElement('div');
  _fadeR.className = 'mobile-focus-fade mobile-focus-fade-r';
  wrap.appendChild(_fadeR);

  // Center line
  _centerLine = document.createElement('div');
  _centerLine.className = 'mobile-focus-center-line';
  wrap.appendChild(_centerLine);

  // "Viewing" label — sits above the church lanes
  _viewLabel = document.createElement('div');
  _viewLabel.className = 'mobile-focus-label';
  _viewLabel.textContent = '';
  wrap.appendChild(_viewLabel);
}

function _removeOverlayElements() {
  [_fadeL, _fadeR, _centerLine, _viewLabel].forEach(el => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  _fadeL = _fadeR = _centerLine = _viewLabel = null;
}

function _updateViewLabel() {
  if (!_viewLabel) return;
  const leftYear  = Math.round(viewStart + _offset / pixelsPerYear);
  const rightYear = Math.round(viewStart + (_offset + _vpWidth) / pixelsPerYear);
  const clamped   = Math.min(rightYear, viewEnd);
  _viewLabel.textContent = `${leftYear} – ${clamped}`;
}

// ── Pointer event handlers ──────────────────────────────────────

function _onPointerDown(e) {
  if (!_active) return;
  // Only handle touches in the timeline area (not on interactive controls)
  if (e.pointerType === 'mouse') return; // desktop uses its own drag
  if (e.target.closest('button, input, select, a, .filter-chip, .sort-btn, .ctrl-btn, .bottom-sheet-tab, .pill-btn, .pill-toggle, .legend-panel, .drawer, .bottom-sheet')) return;

  // Cancel any ongoing momentum
  if (_momentumId) { cancelAnimationFrame(_momentumId); _momentumId = null; }

  _pointerId = e.pointerId;
  _startX    = e.clientX;
  _startOff  = _offset;
  _dragging  = false;
  _didDrag   = false;
  _velocity  = 0;
  _lastX     = e.clientX;
  _lastTime  = performance.now();

  // Don't capture yet — wait until threshold exceeded
}

function _onPointerMove(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  const dx = e.clientX - _startX;

  if (!_dragging) {
    if (Math.abs(dx) < DRAG_THRESHOLD) return;
    _dragging = true;
    _didDrag  = true;
    document.body.classList.add('mobile-focus-dragging');
    // Now capture to prevent losing the pointer
    try { e.target.closest('#tlOuter')?.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }

  if (_dragging) {
    e.preventDefault();
    // Calculate velocity for momentum
    const now = performance.now();
    const dt  = now - _lastTime;
    if (dt > 0) {
      _velocity = (e.clientX - _lastX) / dt * 16; // px per frame (~16ms)
    }
    _lastX    = e.clientX;
    _lastTime = now;

    const newOffset = _startOff - dx;
    _offset = Math.max(0, Math.min(newOffset, _maxOffset));
    _applyTransform();
    _updateViewLabel();

    // Show label during drag
    if (_viewLabel) _viewLabel.classList.add('visible');
  }
}

function _onPointerUp(e) {
  if (_pointerId === null || e.pointerId !== _pointerId) return;

  if (_dragging) {
    document.body.classList.remove('mobile-focus-dragging');
    _dragging = false;

    // Start momentum animation
    if (Math.abs(_velocity) > MIN_VELOCITY) {
      _startMomentum();
    } else {
      // Fade out label after a brief delay
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
