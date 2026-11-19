/* Core: helpers, reveal, parallax, nav, lightbox, player, drawer. Classic script (file:// safe). */
var APP = (function () {
  'use strict';
  var C = window.CAMPAIGN, doc = document, root = doc.documentElement;
  var STATIC = root.classList.contains('static');
  var CALM = root.classList.contains('calm');
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function h(tag, attrs, kids) {
    var el = doc.createElement(tag), k;
    if (attrs) for (k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = (el.className ? el.className + ' ' : '') + v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') { for (var e in v) el.addEventListener(e, v[e]); }
      else if (k === 'ar') { el.setAttribute('dir', 'rtl'); el.setAttribute('lang', 'ar'); el.classList.add('ar'); }
      else el.setAttribute(k, v === true ? '' : v);
    }
    if (kids != null) {
      if (!Array.isArray(kids)) kids = [kids];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (c == null || c === false) continue;
        el.appendChild(typeof c === 'object' ? c : doc.createTextNode(String(c)));
      }
    }
    return el;
  }
  function img(src, alt, eager, cls) {
    return h('img', { src: src, alt: alt || '', loading: eager ? 'eager' : 'lazy', decoding: 'async', class: cls, draggable: 'false' });
  }
  function qs(s, r) { return (r || doc).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function parseDate(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function fmtDate(s, year) { var d = parseDate(s); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + (year ? ' ' + d.getUTCFullYear() : ''); }
  function dayName(s) { return DAYS[parseDate(s).getUTCDay()]; }
  function iso(d) { return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()); }
  /* tatweel (kashida) is typographic stretching, not a letter: dropped when a lockup headline is set as running text */
  function clean(s) { return String(s || '').replace(/ـ+/g, '').replace(/\s+/g, ' ').trim(); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function eyebrow(n, label) { return h('p', { class: 'eyebrow rv' }, [n, h('i', { text: '—' }), label]); }
  function secHead(n, label, titleKids, note) {
    return h('div', { class: 'sec-head' }, [
      eyebrow(n, label),
      h('h2', { class: 'sec-title rv', style: '--d:.08s' }, titleKids),
      note ? h('p', { class: 'sec-note rv', style: '--d:.16s', text: note }) : null
    ]);
  }
  function backdrop(src, speed) {
    var im = img(src, '');
    if (speed) im.setAttribute('data-speed', speed);
    return h('div', { class: 'backdrop' }, im);
  }

  /* who is who: key visual id -> hero story (decision logged in GOAL.md) */
  var heroByKv = {};
  C.heroes.forEach(function (x) { heroByKv[x.kv] = x; });
  /* short name from the story title: "Nourhan's Long Day" -> "Nourhan"; titles without a name stay whole */
  function castShort(id) {
    if (id === 'coach') return 'Coach';
    var hero = heroByKv[id];
    if (!hero) return cap(id);
    var i = hero.title.indexOf("'s ");
    return i > 0 ? hero.title.slice(0, i) : hero.title;
  }
  function castName(id) {
    if (id === 'coach') return 'Coach';
    var hero = heroByKv[id];
    return hero ? hero.title : cap(id);
  }

  /* ---------- reveal ---------- */
  var io = null;
  function reveal(scope) {
    var els = qsa('.rv,.rv-s', scope);
    if (STATIC || CALM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    if (!io) io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { if (!e.classList.contains('in')) io.observe(e); });
  }

  /* ---------- frame loop: smoothed scroll, parallax, pointer ---------- */
  var px = [], roots = [], frameFns = [];
  var sy = 0, ty = 0, mx = 0, my = 0, tmx = 0, tmy = 0, vh = innerHeight, vw = innerWidth, dirty = true;
  var motion = !(STATIC || CALM);
  function pxScan() {
    px = []; roots = [];
    qsa('[data-speed],[data-depth]').forEach(function (el) {
      var r = el.closest('section');
      var ri = roots.indexOf(r);
      if (ri < 0) { roots.push(r); ri = roots.length - 1; }
      px.push({ el: el, ri: ri, speed: parseFloat(el.getAttribute('data-speed')) || 0, depth: parseFloat(el.getAttribute('data-depth')) || 0 });
    });
    measure();
  }
  var rootBox = [];
  function measure() {
    vh = innerHeight; vw = innerWidth;
    var y0 = window.pageYOffset;
    rootBox = roots.map(function (r) { var b = r.getBoundingClientRect(); return { top: b.top + y0, h: b.height }; });
    dirty = true;
  }
  function onFrame(fn) { frameFns.push(fn); }
  function frame() {
    ty = window.pageYOffset;
    var d = ty - sy, dm = Math.abs(tmx - mx) + Math.abs(tmy - my);
    if (Math.abs(d) > 0.2 || dm > 0.002 || dirty) {
      sy = Math.abs(d) < 0.2 ? ty : sy + d * 0.14;
      mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
      dirty = false;
      if (motion) {
        var k = vw < 861 ? 0.45 : 1, i, it, b, p, x, y;
        for (i = 0; i < px.length; i++) {
          it = px[i]; b = rootBox[it.ri];
          if (!b || b.top - sy > vh * 1.6 || b.top + b.h - sy < -vh * 0.6) continue;
          p = (b.top - sy + b.h / 2 - vh / 2) / vh;
          y = -p * vh * it.speed * k + my * it.depth * 16 * k;
          x = mx * it.depth * 22 * k;
          it.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        }
      }
      for (var f = 0; f < frameFns.length; f++) frameFns[f](sy, vh, vw);
      navTick();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- nav ---------- */
  var secs = [], links = [], dots = [], navNow, navBar, curSec = -1;
  function buildNav() {
    var box = qs('#nav-links'), dbox = qs('#dots');
    navNow = qs('#nav-now'); navBar = qs('#nav-bar');
    secs = qsa('main > section');
    secs.forEach(function (s, i) {
      var a = h('a', { href: '#' + s.id, text: s.getAttribute('data-label') });
      box.appendChild(a); links.push(a);
      var d = h('a', { href: '#' + s.id, title: s.getAttribute('data-label') });
      dbox.appendChild(d); dots.push(d);
    });
  }
  function navTick() {
    var y = window.pageYOffset + shiftY, max = Math.max(1, qs('#main').offsetHeight - vh);
    navBar.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    var cur = 0;
    for (var i = 0; i < secs.length; i++) { if (secs[i].getBoundingClientRect().top <= vh * 0.42) cur = i; }
    if (cur !== curSec) {
      curSec = cur;
      links.forEach(function (a, j) { a.classList.toggle('on', j === cur); });
      dots.forEach(function (a, j) { a.classList.toggle('on', j === cur); });
      navNow.textContent = pad2(cur + 1) + ' · ' + secs[cur].getAttribute('data-label');
    }
  }

  /* ---------- overlays ---------- */
  var openOv = null, lastFocus = null;
  function ovOpen(el) {
    lastFocus = doc.activeElement;
    el.classList.add('open'); void el.offsetWidth; el.classList.add('show'); openOv = el;
    var x = qs('.ov-x', el); if (x) x.focus({ preventScroll: true });
  }
  function ovClose() {
    if (!openOv) return;
    var el = openOv; openOv = null;
    el.classList.remove('show');
    setTimeout(function () { el.classList.remove('open'); }, STATIC ? 0 : 450);
    if (el.id === 'pl') { var v = qs('#pl-video'); v.pause(); v.removeAttribute('src'); v.load(); resumeAmbient(); }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  var lbItems = [], lbI = 0;
  function lbShow(i) {
    lbI = (i + lbItems.length) % lbItems.length;
    var it = lbItems[lbI];
    qs('#lb-img').src = it.src; qs('#lb-img').alt = it.cap || '';
    qs('#lb-n').textContent = pad2(lbI + 1) + ' / ' + pad2(lbItems.length);
    qs('#lb-t').textContent = it.cap || '';
    var one = lbItems.length < 2;
    qs('#lb-prev').hidden = one; qs('#lb-next').hidden = one;
  }
  function lightbox(items, i) { lbItems = items; lbShow(i || 0); ovOpen(qs('#lb')); }
  function player(v) {
    var el = qs('#pl-video'), fr = qs('#pl-frame');
    fr.className = 'pl-frame glass ' + (v.vertical ? 'v' : 'h');
    el.poster = v.poster; el.src = v.src;
    qs('#pl-title').textContent = v.title.split(' · Coming soon')[0];
    qs('#pl-soon').hidden = v.group !== 'feature_soon';
    ovOpen(qs('#pl'));
    var p = el.play(); if (p && p.catch) p.catch(function () {});
  }
  /* only one film with sound at a time; ambient outdoor loops pause while it plays */
  var ambient = [];
  function resumeAmbient() { ambient.forEach(function (a) { if (a.inView && a.v.paused) { var p = a.v.play(); if (p && p.catch) p.catch(function () {}); } }); }
  doc.addEventListener('play', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'VIDEO' || t.hasAttribute('data-ambient')) return;
    qsa('video').forEach(function (v) { if (v !== t && !v.paused) v.pause(); });
  }, true);
  function ambientVideo(v, holder) {
    var rec = { v: v, inView: false };
    ambient.push(rec);
    v.addEventListener('playing', function () { holder.classList.add('playing'); });
    v.addEventListener('pause', function () { holder.classList.remove('playing'); });
    if (STATIC || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        rec.inView = e.isIntersecting;
        if (e.isIntersecting && !openOv) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 }).observe(holder);
  }
  var drawerEl, scrim;
  function drawer(open) {
    drawerEl.classList.toggle('open', open); scrim.classList.toggle('open', open);
    drawerEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { var b = qs('button', drawerEl); if (b) b.focus({ preventScroll: true }); }
  }
  function keys(e) {
    if (e.key === 'Escape') {
      if (openOv) { ovClose(); e.preventDefault(); }
      else if (drawerEl.classList.contains('open')) { drawer(false); e.preventDefault(); }
      return;
    }
    if (openOv && openOv.id === 'lb') {
      if (e.key === 'ArrowRight') { lbShow(lbI + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { lbShow(lbI - 1); e.preventDefault(); }
    }
  }

  /* static mode (screenshots): headless Chrome captures a scrolled page wrongly, so the document is shifted
     up instead of scrolled and the page stays at scroll 0 */
  var shiftY = 0;
  function jump() {
    var id = location.hash.replace('#', '');
    var el = id && doc.getElementById(id), main = qs('#main');
    if (!el) return;
    if (STATIC) {
      shiftY = Math.round(el.getBoundingClientRect().top - main.getBoundingClientRect().top);
      main.style.marginTop = (-shiftY) + 'px';
      root.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else { window.scrollTo(0, Math.round(el.getBoundingClientRect().top + window.pageYOffset)); }
    sy = window.pageYOffset; dirty = true;
  }

  function start() {
    drawerEl = qs('#drawer'); scrim = qs('#scrim');
    SECTIONS.build();
    buildNav();
    if (window.BRAIN) BRAIN.init(qs('#brain'));
    reveal(doc);
    pxScan();
    doc.documentElement.setAttribute('data-counts', SECTIONS.counts());
    qs('#lb-x').addEventListener('click', ovClose);
    qs('#pl-x').addEventListener('click', ovClose);
    qs('#lb-prev').addEventListener('click', function () { lbShow(lbI - 1); });
    qs('#lb-next').addEventListener('click', function () { lbShow(lbI + 1); });
    qsa('.ov').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) ovClose(); }); });
    scrim.addEventListener('click', function () { drawer(false); });
    doc.addEventListener('keydown', keys);
    window.addEventListener('resize', function () { if (STATIC) jump(); measure(); });
    window.addEventListener('load', function () { measure(); if (STATIC) jump(); });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(doc.body);
    if (motion) window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tmx = (e.clientX / vw - 0.5) * 2; tmy = (e.clientY / vh - 0.5) * 2;
    }, { passive: true });
    if (STATIC) { jump(); setTimeout(jump, 400); setTimeout(jump, 1500); }
    sy = window.pageYOffset;
    requestAnimationFrame(frame);
  }

  return {
    C: C, STATIC: STATIC, CALM: CALM, h: h, img: img, qs: qs, qsa: qsa, clamp: clamp, pad2: pad2,
    parseDate: parseDate, fmtDate: fmtDate, dayName: dayName, iso: iso, clean: clean, cap: cap,
    eyebrow: eyebrow, secHead: secHead, backdrop: backdrop, castName: castName, castShort: castShort, heroByKv: heroByKv,
    reveal: reveal, onFrame: onFrame, lightbox: lightbox, player: player, ambientVideo: ambientVideo,
    drawer: drawer, start: start, measure: measure
  };
})();
