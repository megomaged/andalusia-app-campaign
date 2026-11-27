/* Andalusia app presentation — design system, before / after, proposals, close (ticket 002). Vanilla, classic script.
   Small live pieces: the day picker and button of the design system, the glass card that leans to the pointer, the before / after line
   (drag, tap, arrow keys; it sweeps to the middle by itself as the phone arrives), and the link of the last section. */
(function () {
  'use strict';
  var E = window.ENGINE, S = window.SITE;
  var $ = function (id) { return document.getElementById(id); };
  var css = E.css, c01 = E.c01;

  // ---------------------------------------------------------------- design system: live controls
  var days = $('s-days'), book = $('s-book'), toggle = $('s-toggle'), glass = $('s-glass');
  if (days) days.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.day') : null; if (!b || b.disabled) return;
    [].forEach.call(days.querySelectorAll('.day'), function (d) { var on = d === b; d.classList.toggle('on', on); if (on) d.setAttribute('aria-pressed', 'true'); else d.removeAttribute('aria-pressed'); });
    if (book) book.classList.remove('done');
  });
  if (book) book.addEventListener('click', function () { book.classList.toggle('done'); });
  if (toggle) toggle.addEventListener('click', function () { var on = !toggle.classList.contains('on'); toggle.classList.toggle('on', on); toggle.setAttribute('aria-checked', on ? 'true' : 'false'); });
  var card = glass ? glass.querySelector('.g-card') : null;
  if (card) E.onFrame(function () {
    var s = E.sec('design-system'); if (E.y < s.top - E.vh || E.y > s.top + s.h || E.still) return;
    css(card, 'transform', 'translate3d(' + (E.mx * 26).toFixed(1) + 'px,' + (E.my * 14).toFixed(1) + 'px,0)');
  });

  // ---------------------------------------------------------------- before / after
  var sec = $('before-after'), box = $('ba-phone'), dev = $('ba-dev'), clip = $('ba-clip'), oldI = $('ba-old'), newI = $('ba-new'), line = $('ba-line'), range = $('ba-range'), tabs = $('ba-tabs');
  var pos = 0.5, target = 0.5, touched = false, drag = false, bs = 0.8, boxTop = 0, cur = -1;
  function pick(i) {
    if (i === cur) return; cur = i; var p = S.pairs[i];
    oldI.src = S.screens + p.old + '.webp'; newI.src = S.screens + p.now + '.webp';
    $('ba-before').textContent = p.before; $('ba-after').textContent = p.after;
    [].forEach.call(tabs.children, function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    if (touched) target = 0.5;
  }
  S.pairs.forEach(function (p, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = p.name; b.addEventListener('click', function () { loaded = true; pick(i); }); tabs.appendChild(b); });
  [].forEach.call(tabs.children, function (b, k) { b.classList.toggle('on', k === 0); });
  $('ba-before').textContent = S.pairs[0].before; $('ba-after').textContent = S.pairs[0].after;
  var loaded = false;

  function at(e) { var r = dev.getBoundingClientRect(); return c01((e.clientX - r.left - 12 * bs) / (390 * bs)); }
  dev.addEventListener('pointerdown', function (e) { drag = true; touched = true; target = at(e); if (dev.setPointerCapture) { try { dev.setPointerCapture(e.pointerId); } catch (x) {} } });
  dev.addEventListener('pointermove', function (e) { if (drag) { target = at(e); if (e.pointerType !== 'touch') pos = target; } });
  ['pointerup', 'pointercancel'].forEach(function (n) { dev.addEventListener(n, function () { drag = false; }); });
  dev.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { touched = true; target = c01(target + (e.key === 'ArrowLeft' ? -0.08 : 0.08)); e.preventDefault(); } });
  dev.tabIndex = 0; dev.setAttribute('role', 'slider'); dev.setAttribute('aria-label', 'Before and after: how much of the current app is shown'); dev.setAttribute('aria-valuemin', '0'); dev.setAttribute('aria-valuemax', '100');
  if (range) range.tabIndex = -1;

  E.onMeasure(function () {
    bs = E.mobile ? Math.min((E.vw - 70) / 414, (E.vh * 0.74) / 868, 0.8) : Math.min((E.vh - 250) / 868, 0.95, (E.vw * 0.3) / 414);
    bs = Math.max(0.5, bs);
    sec.style.setProperty('--bs', bs.toFixed(4));
    var r = box.getBoundingClientRect(); boxTop = r.top + window.scrollY;
    [].forEach.call(document.querySelectorAll('.p-shot'), function (s) { s.style.setProperty('--ps', (E.mobile ? 0.62 : Math.min(1, s.offsetWidth / 300)).toFixed(3)); });
  });
  E.onFrame(function (_, dt) {
    var s = E.sec('before-after'), vh = E.vh;
    if (E.y < s.top - vh * 1.6 || E.y > s.top + s.h + vh * 0.2) return;
    if (!loaded) { loaded = true; pick(0); }
    if (!touched) {
      // arriving: the line starts at the far side (all of today's app) and comes to the middle
      var a = E.still ? 1 : c01((E.y + vh - boxTop - vh * 0.28) / (vh * 0.5));
      target = 1 - 0.5 * E.io(a);
    }
    pos = E.still || !dt ? target : E.damp(pos, target, 12, dt);
    var x = pos * 390;
    css(clip, 'transform', 'translate3d(' + (x - 390).toFixed(1) + 'px,0,0)'); css(oldI, 'transform', 'translate3d(' + (390 - x).toFixed(1) + 'px,0,0)');
    css(line, 'transform', 'translate3d(' + x.toFixed(1) + 'px,0,0)');
    var v = String(Math.round(pos * 100)); if (dev.getAttribute('aria-valuenow') !== v) dev.setAttribute('aria-valuenow', v);
  });

  // ---------------------------------------------------------------- close: the live prototype
  // On GitHub Pages the campaign site already holds the app at ../app/ ; from a file or a local server it is the copy in assets/app/.
  var link = $('close-link');
  if (link && /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) link.href = '../app/';
})();
