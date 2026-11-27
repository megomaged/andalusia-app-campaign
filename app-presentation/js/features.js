/* Andalusia app presentation — #features: the thirteen new features (ticket 002). Vanilla, classic script.

   Pinned. A row of thirteen phones travels sideways as the page scrolls: the current one stands upright in front, its neighbours turn
   away and step back (shared perspective), the ones that have passed leave behind the text. Each feature holds for a part of its
   scroll and then hands over. Left: number, name, the screen's own Arabic title, one line, where it starts in the app.
   Only transform and opacity change per frame; nothing is touched while the section is far from the screen.
*/
(function () {
  'use strict';
  var E = window.ENGINE, S = window.SITE, F = S.features, N = F.length;
  var el = function (tag, cls, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  var css = E.css, c01 = E.c01, smooth = E.smooth;
  var f1 = function (v) { return v.toFixed(1); }, f2 = function (v) { return v.toFixed(2); }, f3 = function (v) { return v.toFixed(3); };
  var STEP = 0.6;                                  // viewport heights of scroll per feature
  var sec = document.getElementById('features'), track = document.getElementById('f-track');
  var cards = [], items = [], rail = [], imgs = [];
  var P = { cx: 0, cy: 0, s: 0.7 }, off = true;

  F.forEach(function (f, k) {
    var c = el('div', 'f-card', track);
    var d = el('div', 'dev', c), sc = el('div', 'dev-screen', d), im = el('img', '', sc);
    im.alt = ''; im.draggable = false; im.setAttribute('data-src', S.screens + f.screen + '.webp'); imgs.push(im);
    c.__veil = el('div', 'veil', c);
    cards.push(c);

    var it = el('div', 'f-item', document.getElementById('f-items'));
    it.innerHTML = '<div class="in"><div class="num">' + ('0' + f.n).slice(-2) + '<small>/ ' + N + '</small></div>' +
      '<span class="ar" lang="ar" dir="rtl">' + f.ar + '</span><h3>' + f.name + '</h3><p class="note">' + f.line + '</p>' +
      '<p class="from"><b>Starts from</b><span>' + f.from + '</span>' + (f.prop ? '<a class="prop" href="#proposals">Carries a proposal</a>' : '') + '</p></div>';
    items.push(it);

    var li = el('li', '', document.getElementById('f-rail'));
    li.innerHTML = '<button type="button" aria-label="' + f.name + '"><i></i><span>' + ('0' + f.n).slice(-2) + '</span></button>';
    li.firstChild.addEventListener('click', function () { var s = E.sec('features'); E.scrollTo(s.top + (k + 0.25) * STEP * E.vh); });
    rail.push(li);
  });
  E.lazy('features', imgs);

  E.onMeasure(function () {
    var vw = E.vw, vh = E.vh;
    sec.style.height = Math.round(vh * (1 + N * STEP)) + 'px';
    if (E.mobile) {
      var top = 330, bottom = 86, avail = Math.max(240, vh - top - bottom);
      P.s = Math.min(avail / 868, vw * 0.56 / 414); P.cx = vw * 0.5; P.cy = top + avail / 2;
    } else {
      P.s = Math.min(vh * 0.76 / 868, vw * 0.25 / 414); P.cx = vw * 0.66; P.cy = vh * 0.53;
    }
    css(track, 'perspectiveOrigin', f1(P.cx) + 'px ' + f1(P.cy) + 'px');
  });

  E.onFrame(function () {
    var s = E.sec('features'), vh = E.vh, y = E.y;
    if (y < s.top - vh * 1.1 || y > s.top + s.h + vh * 0.1) { if (!off) { off = true; cards.forEach(function (c) { css(c, 'visibility', 'hidden'); }); } return; }
    off = false;
    var L = N * STEP * vh, raw = c01((y - s.top) / L) * N; if (raw > N - 0.0001) raw = N - 0.0001;
    var i = Math.floor(raw), u = raw - i;
    var f = i < N - 1 ? i + E.io(c01((u - 0.5) / 0.5)) : i;                       // the row holds, then moves on
    if (E.reduced && i < N - 1) f = u < 0.75 ? i : i + 1;
    var en = E.still ? 1 : smooth((y - (s.top - vh * 0.8)) / (vh * 0.8));         // the row unfolds as the section arrives
    var W = 414 * P.s, t = E.t / 1000, m = E.mobile;

    for (var k = 0; k < N; k++) {
      var c = cards[k], d = k - f, ad = Math.abs(d), near = Math.min(ad, 1), sg = d < 0 ? -1 : 1;
      var o = d < 0 ? 1 - smooth((ad - (m ? 0.9 : 0.75)) / (m ? 0.8 : 0.7)) : 1 - smooth((ad - (m ? 1.6 : 3.2)) / 1.2);
      if (o < 0.004) { css(c, 'visibility', 'hidden'); continue; }
      css(c, 'visibility', 'visible'); css(c, 'opacity', f3(o)); css(c, 'zIndex', String(100 - Math.round(ad * 10)));
      var x = (d * 0.6 + sg * near * 0.36) * W * (0.55 + 0.45 * en);
      var yy = (1 - en) * (160 + k * 26) + (E.still ? 0 : Math.sin(t * 0.9 + k) * 5 * (1 - near));
      var z = -near * 240 - Math.max(0, ad - 1) * 70;
      var sc = P.s * (1 - near * 0.1);
      css(c, 'transform', 'translate3d(' + f1(P.cx + x + E.mx * -10 * (1 + near)) + 'px,' + f1(P.cy + yy) + 'px,' + f1(z) + 'px) rotateY(' + f2(-sg * near * 40 + E.mx * 3) + 'deg) scale(' + f3(sc) + ')');
      css(c.__veil, 'opacity', f3(near * 0.5));
    }

    for (var j = 0; j < N; j++) {
      var loc = raw - j, inn = j === 0 ? 1 : smooth((loc + 0.28) / 0.22), ou = j === N - 1 ? 1 : 1 - smooth((loc - 0.56) / 0.16), op = inn * ou;
      if (y < s.top) op = j === 0 ? 1 : 0;
      css(items[j], 'opacity', f3(op));
      css(items[j], 'transform', 'translate3d(0,' + f1(((1 - inn) - (1 - ou)) * (E.mobile ? 14 : 46)) + 'px,0)');
      css(items[j], 'visibility', op < 0.004 ? 'hidden' : 'visible');
      css(items[j], 'pointerEvents', op > 0.6 ? 'auto' : 'none');
      var fill = j < i ? 1 : j === i ? (y < s.top ? 0 : c01(u / 0.6)) : 0;
      css(rail[j].firstChild.firstChild, '--f', f3(fill));
      var act = (i < N - 1 && u > 0.76) ? i + 1 : i;
      if ((j === act) !== !!rail[j].__on) { rail[j].__on = j === act; rail[j].classList.toggle('on', j === act); }
    }
  });
})();
