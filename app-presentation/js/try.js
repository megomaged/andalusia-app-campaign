/* Andalusia app presentation — "Try it": the live prototype in a phone (ticket 001). Vanilla, classic script.

   The app is the public single file (assets/app/index.html) in an iframe, opened in its own "frame" mode (390 x 844 device with a status bar);
   the iframe window is 440 x 960 and only the device rectangle shows through .live-screen.
   Language and appearance are switched from outside with window.postMessage (the bridge at the end of the app file, see
   _ops/scripts/prep_assets.mjs). If the bridge does not answer, the switch reloads the app with ?lang= & ?theme= instead.
*/
(function () {
  'use strict';
  var E = window.ENGINE;
  var sec = document.getElementById('try'), box = document.getElementById('try-phone'), live = document.getElementById('live'), screen = document.getElementById('live-screen');
  var ctl = document.getElementById('try-ctl'), openLink = document.getElementById('live-open');
  var hints = [].slice.call(sec.querySelectorAll('.hints li')), ctls = [].slice.call(ctl.querySelectorAll('.ctl'));
  var rest = 0, lastY = -1;
  var frame = null, bridged = false, want = { lang: 'ar', theme: 'light' }, ls = 0.8, boxTop = 0;

  var url = function (extra) { return 'assets/app/index.html?' + (extra || '') + 'nosave=1&lang=' + want.lang + '&theme=' + want.theme; };

  function load() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.title = 'Andalusia Health app, working prototype';
    frame.setAttribute('allow', '');
    frame.src = url('frame=1&');
    screen.appendChild(frame);
    // without the bridge (older copy of the app) the phone still shows once it has loaded
    frame.addEventListener('load', function () { setTimeout(function () { screen.classList.add('ready'); }, 2600); });
  }
  function reload() { bridged = false; screen.classList.remove('ready'); if (frame) { frame.remove(); frame = null; } load(); }

  function paint() {
    [].forEach.call(ctl.querySelectorAll('[data-lang]'), function (b) { var on = b.getAttribute('data-lang') === want.lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    [].forEach.call(ctl.querySelectorAll('[data-theme]'), function (b) { var on = b.getAttribute('data-theme') === want.theme; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    openLink.href = url();
  }
  function send() {
    if (!frame) { load(); return; }
    if (bridged && frame.contentWindow) frame.contentWindow.postMessage({ src: 'andalusia-site', lang: want.lang, theme: want.theme }, '*');
    else reload();
  }

  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.src !== 'andalusia-app' || !frame || e.source !== frame.contentWindow) return;
    bridged = true;
    if (d.ready) { screen.classList.add('ready'); if (d.lang !== want.lang || (d.theme !== want.theme && d.theme !== 'auto')) { send(); return; } }
    // the app can also be switched from inside (Profile): the controls outside follow
    if (d.lang === 'ar' || d.lang === 'en') want.lang = d.lang;
    if (d.theme === 'light' || d.theme === 'dark') want.theme = d.theme;
    paint();
  });

  ctl.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    if (b.hasAttribute('data-lang')) { want.lang = b.getAttribute('data-lang'); paint(); send(); }
    else if (b.hasAttribute('data-theme')) { want.theme = b.getAttribute('data-theme'); paint(); send(); }
    else if (b.id === 'live-restart') reload();
  });

  E.onMeasure(function () {
    ls = E.mobile ? Math.min((E.vw - 56) / 414, (E.vh * 0.84) / 868, 0.86) : Math.min((E.vh * 0.8) / 868, 0.92, (E.vw * 0.3) / 414);
    ls = Math.max(0.5, ls);
    sec.style.setProperty('--ls', ls.toFixed(4));
    var r = box.getBoundingClientRect(); boxTop = r.top + window.scrollY;
  });

  E.onFrame(function () {
    var s = E.sec('try'), vh = E.vh;
    // the app is a 2 MB file and starting it costs a long frame: do it while the page is at rest (nothing scrubbing), or at the latest near the section
    if (!frame) {
      rest = Math.abs(E.y - window.scrollY) < 0.5 && E.y === lastY ? rest + 1 : 0; lastY = E.y;
      if ((rest > 40 && E.intro > 3.4 && !E.CAPTURE) || E.y > s.top - vh * 1.5) load();
    }
    if (E.y < s.top - vh * 1.2) return;
    // the phone rises into place as the section arrives
    var p = E.still ? 1 : E.c01((E.y + vh - boxTop - vh * 0.08) / (vh * 0.72)), e = E.out(p);
    E.css(live, 'transform', e > 0.999 ? 'scale(' + ls.toFixed(4) + ')' : 'translate3d(0,' + ((1 - e) * 150).toFixed(1) + 'px,0) perspective(1500px) rotateX(' + ((1 - e) * 20).toFixed(2) + 'deg) rotateY(' + ((1 - e) * -10).toFixed(2) + 'deg) scale(' + (ls * (0.9 + 0.1 * e)).toFixed(4) + ')');
    if (E.mobile) return;
    var q = E.still ? 1 : E.c01((E.y - (s.top - vh * 0.62)) / (vh * 0.5));
    hints.forEach(function (li, i) { var k = E.out(E.c01(q * 1.5 - i * 0.18)); E.css(li, 'opacity', k.toFixed(3)); E.css(li, 'transform', 'translate3d(' + ((1 - k) * -36).toFixed(1) + 'px,0,0)'); });
    ctls.forEach(function (c, i) { var k = E.out(E.c01(q * 1.5 - 0.15 - i * 0.16)); E.css(c, 'opacity', k.toFixed(3)); E.css(c, 'transform', 'translate3d(' + ((1 - k) * 36).toFixed(1) + 'px,0,0)'); });
  });

  // touch: the phone is switched on by a tap, and off again when it has left the screen
  var gate = document.getElementById('live-gate'), touch = !E.fine;
  if (touch) {
    gate.hidden = false;
    gate.addEventListener('click', function () { gate.hidden = true; load(); });
    E.onFrame(function () { if (!gate.hidden) return; var top = boxTop - E.y, h = 868 * ls; if (top > E.vh * 0.92 || top + h < E.vh * 0.08) gate.hidden = false; });
  }

  window.__site.loadLive = load;
  window.__site.live = function () { return { frame: !!frame, bridged: bridged, lang: want.lang, theme: want.theme, ready: screen.classList.contains('ready') }; };
  paint();
})();
