/* Andalusia app presentation — #layers: one app, six ways (ticket 002). Vanilla, classic script.

   Pinned. One phone; the switch itself is the motion: the screen is wiped from one state to the next by a bronze line that crosses the
   phone as the page scrolls, with the name of the state on each side of the line (English | العربية, Light | Dark, Standard | Simple Home,
   Ahmed | Mariam | Youssef | Hassan, the screens of first run). For presentation mode the phone steps back into the prototype's own
   presenting window. A wipe is two transforms (a clipping box and its image moving against each other), so only transform and opacity change.
*/
(function () {
  'use strict';
  var E = window.ENGINE, S = window.SITE, LY = S.layers, N = LY.length;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  var css = E.css, c01 = E.c01, smooth = E.smooth;
  var f1 = function (v) { return v.toFixed(1); }, f2 = function (v) { return v.toFixed(2); }, f3 = function (v) { return v.toFixed(3); };
  var sec = $('layers'), stage = $('l-stage'), phone = $('l-phone'), screen = $('l-screen'), div = $('l-div'), la = $('l-la'), lb = $('l-lb'), win = $('l-win'), cap = $('l-cap');
  var arch = stage.querySelector('.arch');
  var items = [], index = [], all = [], imgs = [];
  var P = { cx: 0, cy: 0, s: 0.7, sw: 0.5 }, total = 0, off = true, capKey = '', labKey = '';

  LY.forEach(function (L, i) {
    L.els = L.states.map(function (st) {
      var d = el('div', 'l-st', screen), im = el('img', '', d); im.alt = ''; im.draggable = false; im.setAttribute('data-src', S.screens + st[0] + '.webp'); imgs.push(im);
      d.__img = im; all.push(d); return d;
    });
    L.n = L.states.length - 1;                                   // wipes in this step
    L.w = L.win ? 1.15 : 0.7 + 0.44 * L.n;                       // viewport heights of scroll
    L.at = total; total += L.w;
    L.fade = i > 0 && LY[i - 1].states[LY[i - 1].states.length - 1][0] !== L.states[0][0];      // the step starts from another screen than the last one ended on

    var it = el('div', 'l-item', $('l-items'));
    it.innerHTML = '<div class="in"><p class="k"><span>' + ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + N).slice(-2) + ' · ' + L.name + '</span><span class="ar" lang="ar" dir="rtl">' + L.ar + '</span></p><h3>' + L.line + '</h3><p class="note">' + L.note + '</p></div>';
    items.push(it);
    var li = el('li', '', $('l-index'));
    li.innerHTML = '<button type="button" aria-label="' + L.name + '"><span>' + L.short + '</span><i></i><b>' + ('0' + (i + 1)).slice(-2) + '</b></button>';
    li.firstChild.addEventListener('click', function () { var s = E.sec('layers'); E.scrollTo(s.top + (L.at + L.w * 0.5) * E.vh); });
    index.push(li);
  });
  E.lazy('layers', imgs);

  E.onMeasure(function () {
    var vw = E.vw, vh = E.vh;
    sec.style.height = Math.round(vh * (1 + total)) + 'px';
    if (E.mobile) {
      var top = 338, bottom = 112, avail = Math.max(240, vh - top - bottom);
      P.s = Math.min(avail / 868, vw * 0.6 / 414); P.cx = vw * 0.5; P.cy = top + avail / 2;
    } else {
      P.s = Math.min(vh * 0.74 / 868, vw * 0.26 / 414); P.cx = vw * (vw > 1100 ? 0.6 : 0.7); P.cy = vh * 0.5;
    }
    P.sw = Math.min(868 * P.s * 1.08 / 1200, (vw - (E.mobile ? 20 : 80)) / 1230, E.mobile ? 1 : (vw * 0.5) / 1230);
  });

  function show(d, z, o) { css(d, 'visibility', 'visible'); css(d, 'zIndex', z); css(d, 'opacity', o === undefined ? '1' : f3(o)); css(d, 'transform', 'none'); css(d.__img, 'transform', 'none'); d.__seen = true; }

  E.onFrame(function () {
    var s = E.sec('layers'), vh = E.vh, y = E.y;
    if (y < s.top - vh * 1.1 || y > s.top + s.h + vh * 0.1) { off = true; return; }
    off = false;
    var pos = c01((y - s.top) / (total * vh)) * total; if (pos > total - 0.0001) pos = total - 0.0001;
    var i = 0; while (i < N - 1 && pos >= LY[i + 1].at) i++;
    var L = LY[i], u = (pos - L.at) / L.w;
    if (y < s.top) { i = 0; L = LY[0]; u = 0; }
    var en = E.still ? 1 : E.out(c01((y - (s.top - vh * 0.75)) / (vh * 0.75)));          // the phone rises into place as the section arrives

    for (var a = 0; a < all.length; a++) all[a].__seen = false;

    // ---- which states are on the glass
    var from = L.els[0], to = null, p = 0, label = L.states[0], dir = L.dir;
    if (L.fade && u < 0.1) { var prev = LY[i - 1]; show(prev.els[prev.els.length - 1], '1'); show(from, '2', E.reduced ? 1 : smooth(u / 0.1)); }
    else show(from, '1');
    if (L.n > 0) {
      var span = 0.76 / L.n;
      for (var j = 0; j < L.n; j++) {
        var q = E.io(c01((u - (0.14 + j * span)) / (span * 0.8)));
        if (E.reduced) q = q < 0.5 ? 0 : 1;
        if (q >= 1) { from.__seen = false; show(L.els[j + 1], '1'); from = L.els[j + 1]; label = L.states[j + 1]; }
        else if (q > 0) { to = L.els[j + 1]; p = q; label = q > 0.5 ? L.states[j + 1] : L.states[j]; setLabels(L.states[j], L.states[j + 1], dir); break; }
      }
    }
    if (to) {
      var k = (1 - p) * 390 * -dir;
      css(to, 'visibility', 'visible'); css(to, 'zIndex', '3'); css(to, 'opacity', '1'); to.__seen = true;
      css(to, 'transform', 'translate3d(' + f1(k) + 'px,0,0)'); css(to.__img, 'transform', 'translate3d(' + f1(-k) + 'px,0,0)');
      css(div, 'transform', 'translate3d(' + f1(dir > 0 ? p * 390 : (1 - p) * 390) + 'px,0,0)');
      css(div, 'opacity', f3(smooth(p / 0.07) * (1 - smooth((p - 0.93) / 0.07))));
    } else css(div, 'opacity', '0');
    for (var b = 0; b < all.length; b++) if (!all[b].__seen) css(all[b], 'visibility', 'hidden');

    // ---- presentation mode: the phone steps back into the presenting window
    var w = L.win ? E.io(c01((u - 0.1) / 0.42)) : 0; if (E.reduced && L.win) w = u > 0.3 ? 1 : 0;
    var t = E.t / 1000, bob = E.still ? 0 : Math.sin(t * 0.9) * 5;
    var tilt = to ? (p - 0.5) * 8 * dir : 0;
    css(stage, 'transform', 'translate3d(' + f1(P.cx) + 'px,' + f1(P.cy + (1 - en) * vh * 0.4 + bob) + 'px,0)');
    css(phone, 'transform', 'perspective(1500px) rotateY(' + f2(tilt + E.mx * 4 + (1 - en) * -18) + 'deg) rotateX(' + f2(E.my * -3 + (1 - en) * 14) + 'deg) scale(' + f3(P.s * (1 - w * 0.36)) + ')');
    css(phone, 'opacity', f3(1 - smooth((w - 0.35) / 0.4)));
    css(arch, 'transform', 'scale(' + f3(P.s * 1.06) + ')'); css(arch, 'opacity', f3(en * (1 - w)));
    if (w > 0.004) { css(win, 'visibility', 'visible'); css(win, 'opacity', f3(smooth((w - 0.2) / 0.5))); css(win, 'transform', 'scale(' + f3(P.sw * (0.86 + 0.14 * w)) + ')'); }
    else css(win, 'visibility', 'hidden');

    // ---- the name of the state under the phone
    var ck = w > 0.5 ? 'Presentation mode' : label[1];
    if (ck !== capKey) { capKey = ck; cap.textContent = ck; cap.className = 'l-cap' + (w <= 0.5 && label[2] ? ' ar' : ''); }
    css(cap, 'transform', 'translate3d(0,' + f1(868 * P.s * 0.5 * (1 + w * 0.1) + (E.mobile ? 18 : 30)) + 'px,0)');
    css(cap, 'opacity', f3(en * (to ? 1 - Math.sin(Math.PI * p) * 0.999 : 1)));

    // ---- text and index
    for (var m = 0; m < N; m++) {
      var M = LY[m], loc = (pos - M.at) / M.w;
      var inn = m === 0 ? 1 : smooth((loc + 0.02) / 0.1), ou = m === N - 1 ? 1 : 1 - smooth((loc - 0.92) / 0.08), o = (loc < -0.05 || loc > 1.05) ? 0 : inn * ou;
      if (y < s.top) o = m === 0 ? 1 : 0;
      css(items[m], 'opacity', f3(o)); css(items[m], 'transform', 'translate3d(0,' + f1(((1 - inn) - (1 - ou)) * (E.mobile ? 14 : 40)) + 'px,0)'); css(items[m], 'visibility', o < 0.004 ? 'hidden' : 'visible');
      if ((m === i) !== !!index[m].__on) { index[m].__on = m === i; index[m].classList.toggle('on', m === i); }
    }
  });

  function setLabels(a, b, dir) {
    var key = a[1] + '|' + b[1] + dir; if (key === labKey) return; labKey = key;
    la.textContent = a[1]; lb.textContent = b[1];
    la.className = 'l-la' + (a[2] ? ' ar' : ''); lb.className = 'l-lb' + (b[2] ? ' ar' : '');
    div.classList.toggle('flip', dir < 0);
  }
})();
