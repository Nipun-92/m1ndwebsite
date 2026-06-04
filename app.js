/* ================================================================
   LEGAL M1ND — app.js v2
   Handles: nav, scroll reveals, count-up stats, pipeline,
            contact form, GA4 event tracking.
   Zero dependencies. Runs via `defer` after DOM is ready.
   ================================================================ */

'use strict';

/* ── GA4 helper — fires only when analytics is loaded ── */
function track(event, params) {
  if (typeof gtag !== 'undefined') gtag('event', event, params || {});
}

/* ================================================================
   1. NAVIGATION
   ================================================================ */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
const allLinks  = document.querySelectorAll('.nav-link, .footer-nav a');

/* Sticky shadow on scroll */
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* Hamburger toggle */
hamburger?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

/* Close mobile nav on link click */
navLinks?.querySelectorAll('a, button').forEach(el =>
  el.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  })
);

/* Active nav link highlighting on scroll */
const sections = document.querySelectorAll('section[id]');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      allLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4, rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))}px 0px 0px 0px` });
sections.forEach(s => navObserver.observe(s));

/* Track nav CTA clicks */
document.querySelectorAll('[data-cta]').forEach(el =>
  el.addEventListener('click', () => track('cta_click', { button: el.dataset.cta }))
);

/* ================================================================
   2. SCROLL REVEAL — fade-in-up as elements enter viewport
   ================================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      // Trigger section-level animations (drawLine etc.)
      e.target.querySelectorAll('.section-title').forEach(t => t.classList.add('visible'));
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ================================================================
   3. COUNT-UP STATS
   ================================================================ */
function animateCount(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const target   = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix   = el.dataset.suffix || '';
  const dur      = 1400;
  const start    = performance.now();

  function fmt(n) {
    return n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + suffix;
  }

  function tick(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  }

  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num[data-target]').forEach(animateCount);
      statObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stats-grid').forEach(g => statObserver.observe(g));

/* ================================================================
   4. SECTION VIEW TRACKING (GA4)
   Fires once per section when 40% of it is visible.
   ================================================================ */
const sectionTracker = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.tracked) {
      e.target.dataset.tracked = '1';
      track('section_view', { section_id: e.target.id });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionTracker.observe(s));

/* ================================================================
   5. WHO IT'S FOR — CLICKABLE CARDS WITH POPUPS
   ================================================================ */
function openPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) return;
  popup.hidden = false;
  document.body.style.overflow = 'hidden';
  const firstFocusable = popup.querySelector('.popup-close');
  if (firstFocusable) firstFocusable.focus();
  track('usecase_popup_open', { popup: popupId });
}
function closePopup(popup) {
  popup.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('.who-clickable').forEach(card => {
  const open = () => openPopup(card.dataset.popup);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

document.querySelectorAll('.popup-close').forEach(btn => {
  btn.addEventListener('click', () => closePopup(btn.closest('.who-popup-wrap')));
});

document.querySelectorAll('.who-popup-wrap').forEach(wrap => {
  wrap.addEventListener('click', e => { if (e.target === wrap) closePopup(wrap); });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.who-popup-wrap:not([hidden])').forEach(closePopup);
    // also close nav
    if (navLinks?.classList.contains('open')) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.focus();
    }
  }
});

/* ================================================================
   6. PIPELINE ANIMATION — start dot travel when section is visible
   ================================================================ */
const pipelineWrap = document.getElementById('pipeline-wrap');
if (pipelineWrap) {
  const pipelineObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        // Add visible class to trigger reveal, dots already pulse via CSS
        pipelineWrap.classList.add('visible');
        pipelineObserver.unobserve(pipelineWrap);
      }
    });
  }, { threshold: 0.2 });
  pipelineObserver.observe(pipelineWrap);
}

/* ================================================================
   6. CONTACT FORM
   ================================================================ */
const form       = document.getElementById('contact-form');
const submitBtn  = document.getElementById('submit-btn');
const statusEl   = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) { submitBtn.textContent = 'Sending…'; submitBtn.disabled = true; }
    if (statusEl)  { statusEl.textContent = ''; }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        if (statusEl) statusEl.textContent = 'Received. We will be in touch within one business day.';
        form.reset();
        track('form_submit', { form: 'contact', status: 'success' });
      } else {
        throw new Error('Server error');
      }
    } catch {
      if (statusEl) statusEl.textContent = 'Something went wrong. Please email info@m1nd.in directly.';
      track('form_submit', { form: 'contact', status: 'error' });
    } finally {
      if (submitBtn) { submitBtn.textContent = 'Send Request'; submitBtn.disabled = false; }
    }
  });
}

/* ================================================================
   7. SMOOTH SCROLL — for any anchor link
   ================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
  });
});

/* ================================================================
   8. KEYBOARD ACCESSIBILITY — handled in popup section above
   ================================================================ */
