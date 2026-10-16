// ===================================================================
// Pet grooming template — interactions & motion
// Scroll reveals use IntersectionObserver + CSS (no animation library).
// ===================================================================

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     Current year in footer
  ----------------------------------------------------------- */
  var yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -----------------------------------------------------------
     Sticky header shadow + shrink on scroll
  ----------------------------------------------------------- */
  var header = document.getElementById('site-header');
  var backToTop = document.getElementById('back-to-top');

  function onScroll() {
    var scrolled = window.scrollY > 24;
    if (header) {
      header.classList.toggle('shadow-lg', scrolled);
      header.classList.toggle('bg-cream/95', scrolled);
      header.classList.toggle('backdrop-blur-md', scrolled);
    }
    if (backToTop) {
      var show = window.scrollY > 600;
      backToTop.style.opacity = show ? '1' : '0';
      backToTop.style.transform = show ? 'translateY(0)' : 'translateY(12px)';
      backToTop.style.pointerEvents = show ? 'auto' : 'none';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* -----------------------------------------------------------
     Mobile menu toggle
  ----------------------------------------------------------- */
  var menuBtn = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  var menuIconOpen = document.getElementById('icon-menu-open');
  var menuIconClose = document.getElementById('icon-menu-close');

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    menuIconOpen && menuIconOpen.classList.remove('hidden');
    menuIconClose && menuIconClose.classList.add('hidden');
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuIconOpen && menuIconOpen.classList.toggle('hidden', isOpen);
      menuIconClose && menuIconClose.classList.toggle('hidden', !isOpen);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        menuBtn.focus();
      }
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  /* -----------------------------------------------------------
     Photo carousel — "Our Furry Clients"
     One large centered photo with peeking neighbors. Browse by
     dragging/swiping (native touch scroll + custom mouse-drag);
     click a peeking photo to smoothly center it. Purely decorative
     otherwise — no lightbox, no hover-to-enlarge.
  ----------------------------------------------------------- */
  var carouselTrack = document.getElementById('photo-carousel-track');
  if (carouselTrack) {
    var carouselCards = Array.prototype.slice.call(carouselTrack.querySelectorAll('.photo-carousel-card'));
    var isDragging = false;
    var isCaptured = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    var dragMoved = 0;
    var DRAG_THRESHOLD = 5;

    function updateActiveCard() {
      var trackRect = carouselTrack.getBoundingClientRect();
      var trackCenter = trackRect.left + trackRect.width / 2;
      var closest = null;
      var closestDist = Infinity;

      carouselCards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var cardCenter = rect.left + rect.width / 2;
        var dist = Math.abs(cardCenter - trackCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = card;
        }
      });

      carouselCards.forEach(function (card) {
        card.classList.toggle('is-active', card === closest);
      });
    }

    var scrollRaf = null;
    carouselTrack.addEventListener('scroll', function () {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(function () {
        updateActiveCard();
        scrollRaf = null;
      });
    }, { passive: true });

    function centerCard(card) {
      card.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }

    carouselCards.forEach(function (card) {
      card.setAttribute('tabindex', '0');

      card.addEventListener('click', function () {
        if (dragMoved > DRAG_THRESHOLD) return; // this was a drag release, not a tap
        centerCard(card);
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          centerCard(card);
        }
      });
    });

    // Mouse drag-to-scroll (touch/pen already get native swipe scrolling).
    // Pointer capture is only engaged once real dragging is detected —
    // capturing immediately on pointerdown would retarget the resulting
    // "click" event to the track itself (per the Pointer Events spec's
    // compatibility-mouse-event rules), which silently breaks
    // click-to-center on an ordinary tap.
    carouselTrack.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      isDragging = true;
      isCaptured = false;
      dragMoved = 0;
      dragStartX = e.clientX;
      dragStartScroll = carouselTrack.scrollLeft;
    });

    carouselTrack.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var delta = e.clientX - dragStartX;
      dragMoved = Math.abs(delta);

      if (!isCaptured && dragMoved > DRAG_THRESHOLD) {
        isCaptured = true;
        carouselTrack.classList.add('is-dragging');
        carouselTrack.setPointerCapture(e.pointerId);
      }

      if (isCaptured) {
        carouselTrack.scrollLeft = dragStartScroll - delta;
      }
    });

    function endCarouselDrag() {
      if (!isDragging) return;
      isDragging = false;
      if (isCaptured) {
        isCaptured = false;
        carouselTrack.classList.remove('is-dragging');
      }
    }
    carouselTrack.addEventListener('pointerup', endCarouselDrag);
    carouselTrack.addEventListener('pointercancel', endCarouselDrag);
    carouselTrack.addEventListener('pointerleave', function () {
      if (isDragging) endCarouselDrag();
    });

    // Start centered on a middle photo so peeks are visible on both
    // sides right away, instead of opening on card 1 with nothing to
    // peek at on the left.
    var startCard = carouselCards[Math.floor(carouselCards.length / 2)];
    if (startCard) {
      startCard.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    }
    updateActiveCard();
    window.addEventListener('load', updateActiveCard);
  }

  /* -----------------------------------------------------------
     Scroll reveals. CSS (.js .reveal / .is-in in style.css) does the
     animation; this only flips the class once an element is in view.
     Hero entrance is pure CSS and needs nothing here.
  ----------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showReveal(el) { el.classList.add('is-in'); }

  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    revealEls.forEach(showReveal);
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // also catch elements already scrolled past (e.g. after an anchor jump)
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          showReveal(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* -----------------------------------------------------------
     Contact / booking form — client-side validation + demo submit
     (no backend wired up; swap the handleSubmit body for a real
     fetch() call to your booking API / Formspree / etc.)
  ----------------------------------------------------------- */
  var form = document.getElementById('booking-form');
  if (form) {
    var statusEl = document.getElementById('form-status');

    function setError(field, message) {
      var errorEl = document.getElementById(field.id + '-error');
      if (errorEl) {
        errorEl.textContent = message || '';
        errorEl.classList.toggle('hidden', !message);
      }
      field.classList.toggle('border-red-400', !!message);
      field.classList.toggle('ring-red-200', !!message);
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(field) {
      if (!field.hasAttribute('required')) return true;
      var value = field.value.trim();
      if (!value) {
        setError(field, 'This field is required.');
        return false;
      }
      if (field.type === 'email') {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          setError(field, 'Please enter a valid email address.');
          return false;
        }
      }
      if (field.type === 'tel') {
        var digits = value.replace(/\D/g, '');
        if (digits.length < 10) {
          setError(field, 'Please enter a valid phone number.');
          return false;
        }
      }
      setError(field, '');
      return true;
    }

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
      var allValid = fields.reduce(function (valid, field) {
        return validateField(field) && valid;
      }, true);

      if (!allValid) {
        if (statusEl) {
          statusEl.textContent = 'Please fix the highlighted fields and try again.';
          statusEl.className = 'text-sm font-semibold text-red-600 mt-2';
        }
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      // Demo-only: simulate network delay, then show success.
      // Replace this block with a real fetch() to your backend/booking API.
      setTimeout(function () {
        form.reset();
        form.classList.add('hidden');
        var successEl = document.getElementById('form-success');
        if (successEl) {
          successEl.classList.remove('hidden');
          successEl.focus();
        }
      }, 700);
    });
  }
})();
