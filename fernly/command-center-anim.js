/**
 * GeoPORTAL BPTD Jabar — Command Center V2
 * DARK RIVET ANIMATION & INTERACTION ENGINE
 * ---------------------------------------------------------------------
 * Mengimplementasikan teknik animasi GSAP-style dari RIVET Dashboard:
 * 1. Number Counter Animation dengan cubic ease-out
 * 2. Magnetic button & card micro-interactions dengan subtle neon glow
 * 3. Cascade re-trigger saat perubahan filter tahun
 */

(function () {
  'use strict';

  // --- 1. Number Counter Animation ---
  var animatedElements = new WeakMap();

  function formatNumberID(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function animateCounter(el, targetValue, duration) {
    if (isNaN(targetValue) || targetValue <= 0) return;
    duration = duration || 1200;
    var startTime = performance.now();
    var lastValue = animatedElements.get(el) || 0;
    if (lastValue === targetValue) return;
    animatedElements.set(el, targetValue);

    function tick(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // GSAP-style Power3 Out: 1 - Math.pow(1 - progress, 3)
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(lastValue + (targetValue - lastValue) * eased);
      el.textContent = formatNumberID(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = formatNumberID(targetValue);
      }
    }

    requestAnimationFrame(tick);
  }

  function observeKpis() {
    var kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(function (el) {
      var raw = el.textContent.trim().replace(/\./g, '');
      var num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        animateCounter(el, num, 1200);
      }

      var observer = new MutationObserver(function () {
        var newRaw = el.textContent.trim().replace(/\./g, '');
        var newNum = parseInt(newRaw, 10);
        if (!isNaN(newNum) && newNum > 0) {
          var currentKnown = animatedElements.get(el);
          if (currentKnown !== newNum) {
            observer.disconnect();
            animateCounter(el, newNum, 900);
            setTimeout(function () {
              observer.observe(el, { childList: true, characterData: true, subtree: true });
            }, 1000);
          }
        }
      });

      observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // --- 2. Magnetic / Spring Micro-Interactions dengan Neon Accent ---
  function initMagneticButtons() {
    var targets = document.querySelectorAll('.quick-btn, .btn-map-open');
    targets.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.12;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.12;
        btn.style.transform = 'translate(' + x + 'px, ' + (y - 2.5) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // --- 3. Cascade Animation pada Filter Tahun ---
  function initYearFilterCascade() {
    var yearButtons = document.querySelectorAll('.year-btn');
    yearButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kpis = document.querySelectorAll('.kpi-card');
        kpis.forEach(function (kpi, idx) {
          kpi.style.animation = 'none';
          void kpi.offsetWidth;
          kpi.style.animation = 'rivetCascade 0.5s cubic-bezier(0.16, 1, 0.3, 1) ' + (idx * 0.05) + 's both';
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        observeKpis();
        initMagneticButtons();
        initYearFilterCascade();
      }, 150);
    });
  } else {
    setTimeout(function () {
      observeKpis();
      initMagneticButtons();
      initYearFilterCascade();
    }, 150);
  }
})();
