/* Andalusia app presentation — the scroll engine (ticket 001). Vanilla, classic script.

   What it does
   - One requestAnimationFrame loop. Every frame it produces: E.y (eased scroll position), E.t (clock, ms), E.intro (seconds since the
     page was ready), E.mx / E.my (eased pointer, -1..1) and calls the render functions registered with E.onFrame(fn).
   - Wheel on a fine pointer is eased by the engine (the page still scrolls natively: it only sets window.scrollTo). Touch, keyboard,
     scrollbar and anchors stay native; E.y follows them with a short ease, so scrubbed animation never steps.
   - Sections: every visible .sec is measured (top, height). E.sec(id) -> { top, h, el }. E.progress(id) -> 0..1 through a pinned section.
   - E.scrollTo(y) eased jump; section dock, counter and progress line are built here from [data-nav].

   Switches
   - prefers-reduced-motion (or ?reduced=1): no wheel easing, E.y = scrollY, intro finished, E.reduced = true (renderers drop ambient motion).
   - ?static=1 : the same, for stills.
   - ?capture=1: no loop of its own. window.__site.frame(dtMs, scrollY) advances exactly one frame (used to record the scroll film).
   - ?perf=1   : records real frame times; window.__site.perf() -> { n, avg, p95, worst }.
*/
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var E = {
    reduced: mq.matches || Q.get('reduced') === '1',
    STATIC: Q.get('static') === '1',
    CAPTURE: Q.get('capture') === '1',
    fine: window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true,
    vw: 0, vh: 0, max: 0, y: 0, t: 0, intro: -1, mx: 0, my: 0, mobile: false,
    sections: [], frames: [], measures: [], started: false
  };
  E.still = E.reduced || E.STATIC;
  window.ENGINE = E;

  // ---------------------------------------------------------------- maths
  E.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  E.c01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  E.lerp = function (a, b, t) { return a + (b - a) * t; };
  E.smooth = function (t) { t = E.c01(t); return t * t * (3 - 2 * t); };
  E.io = function (t) { t = E.c01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };            // ease in-out cubic
  E.out = function (t) { t = E.c01(t); return 1 - Math.pow(1 - t, 3); };                                              // ease out cubic
  E.expo = function (t) { t = E.c01(t); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };                              // ease out expo
  E.back = function (t) { t = E.c01(t); var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };   // slight overshoot (the app's "gentle spring")
  E.damp = function (a, b, k, dt) { return a + (b - a) * (1 - Math.exp(-k * dt / 1000)); };
  // write a style only when it changes
  E.css = function (el, prop, val) { var c = el.__c || (el.__c = {}); if (c[prop] !== val) { c[prop] = val; if (prop.charCodeAt(0) === 45) el.style.setProperty(prop, val); else el.style[prop] = val; } };

  E.onFrame = function (fn) { E.frames.push(fn); };
  E.onMeasure = function (fn) { E.measures.push(fn); };

  // ---------------------------------------------------------------- measuring
  function measure() {
    E.vw = document.documentElement.clientWidth; E.vh = window.innerHeight;
    E.mobile = E.vw <= 760;
    for (var i = 0; i < E.measures.length; i++) E.measures[i](E);       // renderers may set heights first
    E.sections = [];
    var list = document.querySelectorAll('main > .sec:not([hidden])');
    for (var j = 0; j < list.length; j++) { var el = list[j]; E.sections.push({ id: el.id, el: el, top: el.offsetTop, h: el.offsetHeight, nav: el.getAttribute('data-nav') }); }
    E.max = Math.max(0, document.documentElement.scrollHeight - E.vh);
  }
  E.measure = measure;
  E.sec = function (id) { for (var i = 0; i < E.sections.length; i++) if (E.sections[i].id === id) return E.sections[i]; return { top: 0, h: 0 }; };
  E.progress = function (id) { var s = E.sec(id); return E.c01((E.y - s.top) / Math.max(1, s.h - E.vh)); };

  // ---------------------------------------------------------------- scrolling
  var target = 0, pos = 0, wheeling = false, lastSet = -1, tween = null;
  function setScroll(v) { lastSet = Math.round(v); window.scrollTo(0, v); }
  function onWheel(e) {
    if (e.ctrlKey || e.metaKey || E.still || E.CAPTURE) return;
    if (e.target && e.target.closest && e.target.closest('[data-native-scroll]')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    var d = e.deltaY; if (e.deltaMode === 1) d *= 34; else if (e.deltaMode === 2) d *= E.vh;
    if (!wheeling) { target = pos = window.scrollY; wheeling = true; }
    tween = null;
    target = E.clamp(target + d, 0, E.max);
  }
  function onScroll() {
    if (Math.abs(window.scrollY - lastSet) > 2) { wheeling = false; tween = null; target = pos = window.scrollY; }   // someone else scrolled: touch, keys, scrollbar
  }
  E.scrollTo = function (y, instant) {
    y = E.clamp(y, 0, E.max); wheeling = false;
    if (instant || E.still || E.CAPTURE) { tween = null; setScroll(y); target = pos = y; if (instant) E.y = y; return; }
    var from = window.scrollY, dist = Math.abs(y - from);
    tween = { from: from, to: y, t0: E.t, dur: E.clamp(500 + dist * 0.28, 600, 1900), own: true };
  };
  E.toSection = function (id, offset) { var s = E.sec(id); E.scrollTo(s.top + (offset || 0)); };

  function step(dt) {
    if (tween) {
      var k = (E.t - tween.t0) / tween.dur;
      if (k >= 1) { setScroll(tween.to); target = pos = tween.to; tween = null; } else { pos = tween.from + (tween.to - tween.from) * E.io(k); setScroll(pos); }
    } else if (wheeling) {
      pos = E.damp(pos, target, 8.5, dt);
      if (Math.abs(target - pos) < 0.35) { pos = target; wheeling = false; }
      setScroll(pos);
    }
    var sy = window.scrollY;
    E.y = E.still ? sy : E.damp(E.y, sy, (wheeling || tween) ? 40 : 15, dt);
    if (Math.abs(E.y - sy) < 0.05) E.y = sy;
  }

  // ---------------------------------------------------------------- pointer (desktop parallax)
  var pmx = 0, pmy = 0;
  function onMove(e) { pmx = (e.clientX / E.vw) * 2 - 1; pmy = (e.clientY / E.vh) * 2 - 1; }

  // ---------------------------------------------------------------- chrome: dock, counter, progress
  var dock, links = [], countNow, countAll, bar, activeIdx = -1;
  function buildChrome() {
    dock = document.getElementById('dock'); countNow = document.getElementById('count-now'); countAll = document.getElementById('count-all'); bar = document.getElementById('progress');
    var navs = E.sections.filter(function (s) { return s.nav; });
    dock.innerHTML = ''; links = [];
    navs.forEach(function (s, i) {
      var a = document.createElement('a'); a.href = '#' + s.id; a.innerHTML = '<b>' + ('0' + (i + 1)).slice(-2) + '</b><span>' + s.nav + '</span>';
      dock.appendChild(a); links.push({ a: a, id: s.id });
    });
    if (countAll) countAll.textContent = ('0' + navs.length).slice(-2);
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return;
      var id = a.getAttribute('href').slice(1); if (!id || !document.getElementById(id)) return;
      e.preventDefault(); E.toSection(id);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  }
  function chrome() {
    var mid = E.y + E.vh * 0.5, idx = 0;
    for (var i = 0; i < links.length; i++) if (E.sec(links[i].id).top <= mid) idx = i;
    if (idx !== activeIdx) {
      activeIdx = idx;
      links.forEach(function (l, i) { l.a.classList.toggle('on', i === idx); if (i === idx) l.a.setAttribute('aria-current', 'true'); else l.a.removeAttribute('aria-current'); });
      if (countNow) countNow.textContent = ('0' + (idx + 1)).slice(-2);
    }
    if (bar) E.css(bar, 'transform', 'scaleX(' + (E.max ? E.c01(E.y / E.max) : 0).toFixed(4) + ')');
  }

  // ---------------------------------------------------------------- the loop
  var last = 0, perf = Q.get('perf') === '1' ? [] : null, slow = [], introAt = -1;
  function frame(dt) {
    E.t += dt;
    if (introAt >= 0) E.intro = E.still ? 99 : (E.t - introAt) / 1000;
    step(dt);
    E.mx = E.still ? 0 : E.damp(E.mx, pmx, 4.5, dt); E.my = E.still ? 0 : E.damp(E.my, pmy, 4.5, dt);
    chrome();
    for (var i = 0; i < E.frames.length; i++) E.frames[i](E, dt);
  }
  function loop(now) {
    var dt = last ? now - last : 16.7; last = now;
    if (perf && dt < 1000) { perf.push(dt); if (dt > 34) slow.push({ ms: Math.round(dt), y: Math.round(window.scrollY), t: Math.round(E.t) }); }
    frame(Math.min(dt, 50));
    requestAnimationFrame(loop);
  }

  E.start = function () {
    if (E.started) return; E.started = true;
    measure(); buildChrome();
    // a #hash on load goes to its section at once
    var id = location.hash.slice(1);
    if (id && document.getElementById(id) && E.sec(id).h) { setScroll(E.sec(id).top); }
    target = pos = E.y = window.scrollY;
    introAt = E.t; E.intro = E.still ? 99 : 0;
    window.addEventListener('resize', function () { measure(); target = pos = window.scrollY; });
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { var h = document.documentElement.scrollHeight; if (Math.abs(h - E.vh - E.max) > 2) measure(); }); ro.observe(document.getElementById('main')); }
    window.addEventListener('scroll', onScroll, { passive: true });
    if (E.fine) { window.addEventListener('wheel', onWheel, { passive: false }); window.addEventListener('mousemove', onMove, { passive: true }); }
    if (mq.addEventListener) mq.addEventListener('change', function () { E.reduced = mq.matches || Q.get('reduced') === '1'; E.still = E.reduced || E.STATIC; });
    document.documentElement.classList.add('is-ready');
    if (E.CAPTURE) frame(0); else requestAnimationFrame(loop);
  };

  // ---------------------------------------------------------------- hooks for the checks in _ops/scripts
  window.__site = {
    engine: E,
    frame: function (dt, y) { if (typeof y === 'number') { window.scrollTo(0, y); lastSet = Math.round(y); } frame(dt); return { y: E.y, t: E.t, max: E.max }; },
    perf: function () { if (!perf || !perf.length) return null; var s = perf.slice().sort(function (a, b) { return a - b; }), sum = 0; s.forEach(function (v) { sum += v; }); return { n: s.length, avg: sum / s.length, p50: s[Math.floor(s.length * 0.5)], p95: s[Math.floor(s.length * 0.95)], worst: s[s.length - 1], over20: s.filter(function (v) { return v > 20; }).length, over34: s.filter(function (v) { return v > 34; }).length, slow: slow.slice() }; },
    perfReset: function () { if (perf) perf.length = 0; slow.length = 0; }
  };
})();
