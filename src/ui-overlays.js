// ═══════════ OVERLAYS MODULE ═══════════
// Manages the About / Credits overlay and the Onboarding overlay.
// Extracted from the inline <script> block in index.html.
// No external imports — pure DOM wiring.

document.addEventListener('DOMContentLoaded', function () {
  // ── About / credits overlay ──
  const aboutOverlay = document.getElementById('aboutOverlay');
  document.getElementById('aboutClose')?.addEventListener('click', function () {
    aboutOverlay.classList.remove('open');
  });
  aboutOverlay?.addEventListener('click', function (e) {
    if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
  });

  // ── Onboarding overlay ──
  const onbOverlay = document.getElementById('onboardingOverlay');
  const SEEN_KEY   = 'onboardingOverlaySeen';

  function openOnb() {
    onbOverlay.classList.add('open');
    document.body.classList.add('onb-open');
  }
  function closeOnb() {
    onbOverlay.classList.remove('open');
    document.body.classList.remove('onb-open');
    localStorage.setItem(SEEN_KEY, '1');
  }

  // Show on first visit
  if (!localStorage.getItem(SEEN_KEY)) {
    setTimeout(openOnb, 400);
  }

  // ℹ button opens onboarding
  document.getElementById('btnAbout')?.addEventListener('click', openOnb);

  // Close: button, backdrop, ESC
  document.getElementById('onbClose')?.addEventListener('click', closeOnb);
  document.getElementById('onbCta')?.addEventListener('click', closeOnb);
  onbOverlay?.addEventListener('click', function (e) {
    if (e.target === onbOverlay) closeOnb();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && onbOverlay?.classList.contains('open')) closeOnb();
  });

  // "About this project" link inside onboarding opens credits overlay
  document.getElementById('onbCreditsBtn')?.addEventListener('click', function () {
    closeOnb();
    setTimeout(function () { aboutOverlay?.classList.add('open'); }, 200);
  });
});
