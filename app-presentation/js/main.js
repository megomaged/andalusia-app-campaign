/* Andalusia app presentation — boot (tickets 001, 002). Vanilla, classic script.

   The page starts only when the first frame can be complete: the fonts of the headline, and every image the hero shows (Home, its two
   lifted cards and the four screens behind) loaded AND decoded. Until then a small lock-up waits in the middle of the screen.
   (Ticket 002, fix 1: the page used to start on a timer or on a detached copy of one image; on a real connection the phone could then be
   painted before its screen had arrived.) If something never arrives the page starts anyway after 12 s and late images repaint their layer.
   The text of the hero rises on the engine's clock. */
(function () {
  'use strict';
  var E = window.ENGINE, ST = window.STAGE;
  var rv = [].slice.call(document.querySelectorAll('.rv')).map(function (el) { return { el: el, d: parseFloat(el.getAttribute('data-d')) || 0, v: -1 }; });
  var top = document.querySelector('.top'), boot = document.getElementById('boot');

  E.onFrame(function () {
    var t = E.intro;
    for (var i = 0; i < rv.length; i++) {
      var r = rv[i], v = E.still ? 1 : E.expo((t - r.d) / 1.15);
      if (v !== r.v) { r.v = v; r.el.style.setProperty('--rv', v.toFixed(4)); }
    }
    E.css(top, 'opacity', (E.still ? 1 : E.out((t - 0.2) / 0.9)).toFixed(3));
  });

  var started = false;
  function go() {
    if (started) return; started = true;
    E.start();
    ST.loadRest();
    if (boot) { boot.classList.add('gone'); setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 900); }
  }
  function ready(im) {
    return new Promise(function (ok) {
      var done = function () { if (im.decode) im.decode().then(ok, ok); else ok(); };
      if (im.complete && im.naturalWidth) done(); else { im.addEventListener('load', done); im.addEventListener('error', ok); }
    });
  }
  var waits = (ST.first || []).map(ready);
  if (document.fonts && document.fonts.load) { waits.push(document.fonts.load('600 60px Montserrat')); waits.push(document.fonts.load('300 60px Montserrat')); waits.push(document.fonts.load('500 16px Montserrat')); }
  Promise.all(waits).then(function () { requestAnimationFrame(function () { requestAnimationFrame(go); }); }, go);
  setTimeout(go, 12000);
  window.addEventListener('load', function () { if (started) E.measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (started) E.measure(); });
})();
