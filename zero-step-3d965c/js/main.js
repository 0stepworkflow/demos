// Zero Step website: theme toggle, phone menu, pause button for the hero wall, gentle reveal.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme toggle (the tiny script in <head> already set data-theme before first paint)
  var themeBtn = document.querySelector('.theme-btn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#141E24' : '#F7F2E8');
  }
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('zs-theme', next); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  // Phone menu
  var toggle = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setMenu(!root.classList.contains('nav-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', function () { setMenu(false); });

  // Hero wall: pause button, and pause while the hero is off-screen
  var hero = document.getElementById('hero');
  var motionBtn = hero.querySelector('.motion-btn');
  motionBtn.addEventListener('click', function () {
    var paused = hero.classList.toggle('is-paused');
    motionBtn.setAttribute('aria-pressed', String(paused));
    motionBtn.textContent = paused ? 'Play motion' : 'Pause motion';
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      hero.classList.toggle('is-off', !entries[0].isIntersecting);
    }).observe(hero);
  }

  // The name flies up into the pill as you scroll, and stays there.
  // 1100px and up: the links part to open a gap in the middle of the pill. Smaller: it lands where the mark is.
  var fly = document.querySelector('.fly');
  var pill = document.querySelector('.pill');
  var heroLogo = hero.querySelector('h1');
  var slot = document.querySelector('.nav .pill__slot');
  var mark = document.querySelector('.pill__mark');
  if (fly && !reduce) {
    root.classList.add('fly-on');
    var phone = window.matchMedia('(max-width: 1099.98px)');
    var RATIO = 568 / 2973;
    var start = null, dist = 1, padL = 0, padR = 0, queued = false;
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function measure() {
      pill.style.paddingLeft = pill.style.paddingRight = '';
      var r = heroLogo.getBoundingClientRect();
      start = { cx: r.left + r.width / 2, cy: r.top + window.scrollY + (r.width * RATIO) / 2, w: r.width };
      fly.style.width = start.w + 'px';
      var pr = pill.getBoundingClientRect();
      dist = Math.max(160, start.cy - (pr.top + pr.height / 2));
      padL = padR = 0;
      if (!phone.matches) {
        // Pad the shorter side so the open gap (and the name) sits exactly in the middle of the pill.
        pill.style.setProperty('--fly', 1);
        var pr2 = pill.getBoundingClientRect(), sr = slot.getBoundingClientRect();
        var diff = (pr2.right - (sr.left + sr.width / 2)) - ((sr.left + sr.width / 2) - pr2.left);
        padL = Math.max(0, diff); padR = Math.max(0, -diff);
      }
      update();
    }
    function update() {
      queued = false;
      if (!start) return;
      var p = Math.min(1, Math.max(0, window.scrollY / dist));
      var e = ease(p);
      pill.style.setProperty('--fly', e);
      pill.style.paddingLeft = padL ? (8 + padL * e) + 'px' : '';
      pill.style.paddingRight = padR ? (8 + padR * e) + 'px' : '';
      root.classList.toggle('is-flying', p > 0.02);
      fly.classList.toggle('is-docked', p >= 1);
      var t = (phone.matches ? mark : slot).getBoundingClientRect();
      var pr = pill.getBoundingClientRect();
      var endW = phone.matches ? 84 : 124;
      var w = start.w + (endW - start.w) * e;
      var cx = start.cx + (t.left + t.width / 2 - start.cx) * e;
      var nowCy = start.cy - window.scrollY;
      var cy = nowCy + (pr.top + pr.height / 2 - nowCy) * e;
      fly.style.transform = 'translate(' + (cx - w / 2) + 'px,' + (cy - (w * RATIO) / 2) + 'px) scale(' + (w / start.w) + ')';
    }
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  // Reveal on scroll, 40ms stagger within a group
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var groups = new Map();
  items.forEach(function (el) {
    var n = groups.get(el.parentNode) || 0;
    el.style.setProperty('--d', n);
    groups.set(el.parentNode, n + 1);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
