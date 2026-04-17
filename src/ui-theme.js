// ═══════════ THEME SWITCHER MODULE ═══════════
// Manages the light/dark theme toggle button and persists the user's
// preference to localStorage. Extracted from the inline <script> block
// in index.html. No external imports — pure DOM wiring.
//
// Note: the synchronous theme-flash-prevention IIFE in <head> handles the
// initial paint (applies 'light' data-theme before CSS loads). This module
// handles button state, aria labels, and subsequent user-driven switches.

document.addEventListener('DOMContentLoaded', function () {
  const btn  = document.getElementById('themeToggle');
  const meta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (btn) { btn.textContent = '☀️'; btn.title = 'Switch to dark theme'; }
      if (meta) meta.content = '#f4f5f7';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (btn) { btn.textContent = '🌙'; btn.title = 'Switch to light theme'; }
      if (meta) meta.content = '#0f0f14';
    }
    localStorage.setItem('gdansk-theme', theme);
    // Re-render economic eras (they read theme at render time for bg colour)
    if (window._reRenderEconEras) window._reRenderEconEras();
  }

  // Set initial state from saved preference
  applyTheme(localStorage.getItem('gdansk-theme') || 'light');

  btn?.addEventListener('click', function () {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'light' ? 'dark' : 'light');
  });
});
