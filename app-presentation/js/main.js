/* Andalusia app presentation — boot (ticket 001). Vanilla, classic script.
   Waits for the fonts and the first screen (never longer than 2.5 s), then starts the engine. The text of the hero rises on the engine's clock. */
(function () {
  'use strict';
  var E = window.ENGINE;
  var rv = [].slice.call(document.querySelectorAll('.rv')).map(function (el) { return { el: el, d: parseFloat(el.getAttribute('data-d')) || 0, v: -1 }; });
  var top = document.querySelector('.top');

  E.onFrame(function () {
    var t = E.intro;
    for (var i = 0; i < rv.length; i++) {
      var r = rv[i], v = E.still ? 1 : E.expo((t - r.d) / 1.15);
      if (v !== r.v) { r.v = v; r.el.style.setProperty('--rv', v.toFixed(4)); }
    }
    E.css(top, 'opacity', (E.still ? 1 : E.out((t - 0.2) / 0.9)).toFixed(3));
  });

  var started = false;
  function go() { if (started) return; started = true; E.start(); }
  var first = new Image(); first.src = window.SITE.screens + window.SITE.hero.screen + '.webp';
  var waits = [first.decode ? first.decode().catch(function () {}) : Promise.resolve()];
  if (document.fonts && document.fonts.load) { waits.push(document.fonts.load('600 60px Montserrat')); waits.push(document.fonts.load('300 60px Montserrat')); waits.push(document.fonts.load('500 16px Montserrat')); }
  Promise.all(waits).then(go, go);
  setTimeout(go, 2500);
  window.addEventListener('load', function () { if (started) E.measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (started) E.measure(); });
})();
