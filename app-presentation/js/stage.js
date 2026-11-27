/* Andalusia app presentation — the phone stage (ticket 001). Vanilla, classic script.

   One fixed phone plays the hero and the journey. Each frame its pose is a pure function of (E.y, E.intro, E.t, pointer):
     hero pose  --(scroll through the hero)-->  journey pose  --(6 pinned steps: screens change inside the phone)-->  leaves with the page
   Inside the phone: the screens of SITE.journey, moved with the app's own transitions (push / success / rise), and "lifts":
   cards cut out of the same screenshot and brought forward in Z, so the interface has real depth when the phone turns.
   Units: the phone is 414 x 868 (screen 390 x 844) and is scaled as a whole; Z distances scale with it.
*/
(function () {
  'use strict';
  var E = window.ENGINE, S = window.SITE;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, parent) { var n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  var css = E.css, c01 = E.c01, lerp = E.lerp, smooth = E.smooth;
  var f1 = function (v) { return v.toFixed(1); }, f2 = function (v) { return v.toFixed(2); }, f3 = function (v) { return v.toFixed(3); };

  var jCopy, cue;
  var stage, rig, phone, halo, archD, archL, shadow, glare, veil, orbA, orbB, heroCopy, jHead, jRail;
  var scr = [], ghosts = [], heroLifts = [], stepLifts = [], steps = [], railItems = [], words = [];
  var N = S.journey.length;
  var STEP = 0.92;                 // viewport heights of scroll per journey step
  var P = {};                      // poses for this viewport
  var ST = { mix: 0, step: 0 };    // what the rest of the page may read (active step)
  window.STAGE = ST;

  // Images. The ones the first frame needs (Home, its lifted cards, the screens fanned out behind) are `first`: js/main.js waits until
  // every one of them is loaded AND decoded before the page starts, so the first painted frame is complete (ticket 002, fix 1).
  // The other journey screens are given their src after that, and each late arrival nudges its layer so it is rastered again.
  var first = [], later = [];
  function img(src, parent, now) {
    var i = el('img', '', parent); i.alt = ''; i.draggable = false; i.loading = 'eager';
    var url = S.screens + src + '.webp';
    if (now) { i.decoding = 'sync'; i.src = url; first.push(i); } else later.push([i, url]);
    i.addEventListener('load', nudge);
    return i;
  }
  var nudged = 0;
  function nudge() { nudged++; var ps = $('ph-screen'); if (ps) ps.style.transform = 'translateZ(' + (0.5 + (nudged % 2) * 0.01) + 'px)'; }
  ST.first = first;
  ST.loadRest = function () { later.forEach(function (p) { p[0].decoding = 'async'; p[0].src = p[1]; }); later.length = 0; };
  function makeLift(parent, screen, rect, now) {
    // the place the card leaves behind: a clean recess in the paper (ticket 002: it was the same pixels blurred, which left a blob where a portrait had been)
    var pl = el('div', 'plate'); $('ph-screen').insertBefore(pl, $('ph-veil')); pl.style.cssText = 'left:' + rect[0] + 'px;top:' + rect[1] + 'px;width:' + rect[2] + 'px;height:' + rect[3] + 'px;border-radius:' + rect[4] + 'px';
    var l = el('div', 'lift', parent); l.__plate = pl; l.style.cssText = 'left:' + rect[0] + 'px;top:' + rect[1] + 'px;width:' + rect[2] + 'px;height:' + rect[3] + 'px';
    el('div', 'sh', l);
    var cut = el('div', 'cut', l); cut.style.borderRadius = rect[4] + 'px';
    var i = img(screen, cut, now); i.style.left = -rect[0] + 'px'; i.style.top = -rect[1] + 'px';
    return l;
  }

  function build() {
    stage = $('stage'); rig = $('rig'); phone = $('phone'); glare = $('ph-glare'); veil = $('ph-veil');
    halo = rig.querySelector('.halo'); archD = rig.querySelector('.arch-dark'); archL = rig.querySelector('.arch-light'); shadow = rig.querySelector('.ph-shadow');
    orbA = document.querySelector('.orb-a'); orbB = document.querySelector('.orb-b');
    heroCopy = $('hero-copy'); jHead = document.querySelector('.j-head'); jRail = $('j-rail'); jCopy = document.querySelector('.j-copy'); cue = $('cue');

    var edges = $('ph-edges'); for (var k = 0; k < 9; k++) { var e = el('i', '', edges); e.style.transform = 'translateZ(' + (-1.6 * (k + 1)) + 'px)'; }

    var screenBox = $('ph-screen');
    S.journey.forEach(function (st, i) {
      var d = el('div', 'scr'); screenBox.insertBefore(d, veil); img(st.screen, d, i === 0); el('i', '', d); scr.push(d);
      stepLifts.push(makeLift($('lifts'), st.screen, st.lift));

      var s = el('div', 'j-step', $('j-steps'));
      s.innerHTML = '<div class="in"><div class="num">' + ('0' + (i + 1)).slice(-2) + '<small>/ ' + ('0' + N).slice(-2) + '</small></div>' +
        '<p class="k"><span>' + st.name + '</span><span class="ar" lang="ar" dir="rtl">' + st.ar + '</span></p><h3>' + st.line + '</h3><p class="note">' + st.note + '</p></div>';
      steps.push(s);

      var li = el('li', '', jRail); li.innerHTML = '<button type="button" aria-label="' + st.name + '"><i></i><span>' + (st.short || st.name) + '</span></button>';
      li.firstChild.addEventListener('click', function () { var j = E.sec('journey'); E.scrollTo(j.top + (i + 0.3) * STEP * E.vh); });
      railItems.push(li);

      var w = el('span', '', $('words')); w.lang = 'ar'; w.textContent = st.ar; words.push(w);
    });
    S.hero.lifts.forEach(function (l) { var n = makeLift($('lifts'), S.hero.screen, l.rect, true); n.__z = l.z; heroLifts.push(n); });
    S.hero.ghosts.forEach(function (g) { var d = el('div', 'ghost', $('ghosts')); img(g, d, true); ghosts.push(d); });
  }

  // ---------------------------------------------------------------- poses for this viewport
  function measure() {
    var vw = E.vw, vh = E.vh, m = E.mobile;
    var jr = document.getElementById('journey'); if (jr) jr.style.height = Math.round(vh * (1 + N * STEP)) + 'px';
    fitWords();
    if (m) {
      var top = 318, bottom = 94, avail = Math.max(260, vh - top - bottom);
      P.hero = { x: vw * 0.5, y: vh * 0.5 + Math.max(276, vh * 0.375), s: Math.min(vw * 0.66 / 414, 0.74), rx: 17, ry: 15, rz: -5 };
      P.jour = { x: vw * 0.5, y: top + avail / 2, s: Math.min(avail / 868, vw * 0.66 / 414), rx: 2, ry: 5, rz: 0 };
      P.liftK = 0.62; P.kick = 5;
      P.ghost = [ { x: -235, y: 60, z: -260, o: 0.9 }, { x: 240, y: -70, z: -330, o: 0.8 }, { x: -430, y: -160, z: -620, o: 0 }, { x: 440, y: 120, z: -640, o: 0 } ];
    } else {
      var hs = Math.min(vh * 0.86 / 868, vw * 0.3 / 414);
      P.hero = { x: vw * 0.705, y: vh * 0.535, s: hs, rx: 11, ry: 24, rz: -5 };
      P.jour = { x: vw * 0.7, y: vh * 0.52 + 6, s: Math.min(vh * 0.82 / 868, vw * 0.3 / 414), rx: 3, ry: 9, rz: 0 };
      P.liftK = 1; P.kick = 8;
      P.ghost = [ { x: -318, y: 84, z: -300, o: 0.94 }, { x: 338, y: -58, z: -260, o: 0.96 }, { x: 626, y: 84, z: -560, o: 0.72 }, { x: -610, y: -110, z: -700, o: 0 } ];
    }
  }

  // the screen names behind the phone are set as wide as the page allows
  var meter = null;
  function fitWords() {
    if (!meter) meter = document.createElement('canvas').getContext('2d');
    meter.font = '700 200px "Graphik Arabic"';
    words.forEach(function (w) { var wd = meter.measureText(w.textContent).width || 600; w.style.fontSize = Math.round(Math.min(E.vw * 0.9 / (wd / 200), E.vh * 0.46, 460)) + 'px'; });
  }

  // ---------------------------------------------------------------- one frame
  function render() {
    var vh = E.vh, y = E.y, t = E.t / 1000, still = E.still;
    var hero = E.sec('hero'), jo = E.sec('journey');
    var jTop = jo.top, L = N * STEP * vh, jEnd = jTop + L;

    // ---- global progress values
    var hp = c01(y / Math.max(1, jTop));                                        // through the hero
    var e = E.io(c01((hp - 0.04) / 0.92));                                      // hero pose -> journey pose
    var I = still ? 1 : E.expo(c01((E.intro - 0.1) / 2.1));                     // load: the phone arrives
    var Ig = still ? 1 : E.out(c01((E.intro - 0.55) / 1.7));                    // load: the other screens fan out
    var Il = still ? 1 : E.back(c01((E.intro - 1.25) / 1.1));                   // load: the cards lift
    var out = Math.max(0, y - jEnd);                                            // px scrolled past the journey
    var exit = c01(out / vh);
    var amb = still ? 0 : 1 - exit;

    // past the journey the stage is parked off the screen as well as hidden (its screens and cards set their own visibility, which a hidden parent does not override)
    if (out > vh * 1.08) { css(stage, 'visibility', 'hidden'); css(stage, 'transform', 'translate3d(0,-300vh,0)'); lightOnly(jTop, y, vh); return; }
    css(stage, 'visibility', 'visible'); css(stage, 'transform', 'none');

    // ---- journey: which step, where in it
    var f = c01((y - jTop) / L) * N; if (f >= N) f = N - 0.0001;
    var i = Math.floor(f), u = f - i;
    if (y < jTop) { i = 0; u = 0; f = 0; }
    var last = i === N - 1;
    var tr = last ? 0 : E.io(c01((u - 0.7) / 0.27));                            // screen i -> i+1
    if (E.reduced) tr = tr < 0.5 ? 0 : 1;
    var kind = last ? '' : S.journey[i + 1].into;
    var bump = Math.sin(Math.PI * tr);

    // ---- the pose
    var a = P.hero, b = P.jour;
    var x = lerp(a.x, b.x, e), py = lerp(a.y, b.y, e), s = lerp(a.s, b.s, e);
    var rx = lerp(a.rx, b.rx, e), ry = lerp(a.ry, b.ry, e), rz = lerp(a.rz, b.rz, e);
    ry += -Math.sin(Math.PI * e) * 20;                                          // a turn on the way down
    s *= 1 - Math.sin(Math.PI * e) * 0.05;
    // intro: from below, turned away
    py += (1 - I) * vh * 0.78; ry += (1 - I) * -64; rx += (1 - I) * 26; rz += (1 - I) * 9; s *= 0.8 + 0.2 * I;
    // each step turns the phone a little; a transition kicks it
    if (y >= jTop) { ry += Math.sin(i * 2.1 + u * 0.8) * 2.2 * (1 - exit); }
    if (kind === 'push') { ry -= bump * P.kick; s *= 1 - bump * 0.022; }
    else if (kind === 'success') { s *= 1 + bump * 0.035; rx -= bump * 3; }
    else if (kind === 'rise') { rx += bump * 7; s *= 1 - bump * 0.02; }
    // ambient float and the pointer
    py += Math.sin(t * 0.9) * 7 * amb; ry += Math.sin(t * 0.62 + 1) * 1.5 * amb; rx += Math.cos(t * 0.5) * 0.8 * amb;
    // leaving: goes up with the page, leaning back
    py -= out; rx += exit * 22; ry -= exit * 14;

    var px = E.mx * (1 - exit), pyy = E.my * (1 - exit);
    css(stage, 'perspectiveOrigin', f1(x) + 'px ' + f1(py) + 'px');
    css(rig, 'transform', 'translate3d(' + f1(x) + 'px,' + f1(py) + 'px,0) rotateX(' + f2(-pyy * 3.2) + 'deg) rotateY(' + f2(px * 4.6) + 'deg)');
    css(phone, 'transform', 'rotateX(' + f2(rx) + 'deg) rotateY(' + f2(ry) + 'deg) rotateZ(' + f2(rz) + 'deg) scale3d(' + f3(s) + ',' + f3(s) + ',' + f3(s) + ')');

    // ---- light
    var mix = lightOnly(jTop, y, vh);
    css(halo, 'opacity', f3((1 - mix * 0.75) * I * (1 - exit)));
    css(halo, 'transform', 'translate3d(' + f1(-60 * s) + 'px,' + f1(-40 * s) + 'px,' + f1(-520 * s) + 'px) scale(' + f3(s * 1.5) + ')');
    var archT = 'translate3d(' + f1(lerp(26, 0, e) * s) + 'px,' + f1(lerp(30, 10, e) * s) + 'px,' + f1(lerp(-420, -300, e) * s) + 'px) rotateY(' + f2(ry * 0.25) + 'deg) scale(' + f3(s * lerp(1.16, 1.08, e) * (0.9 + 0.1 * Ig)) + ')';
    css(archD, 'transform', archT); css(archL, 'transform', archT);
    css(archD, 'opacity', f3((1 - mix) * Ig * (1 - smooth((e - 0.5) / 0.5)))); css(archL, 'opacity', f3(mix * (1 - smooth(out / (vh * 0.3)))));
    css(shadow, 'transform', 'translate3d(' + f1(30 * s) + 'px,' + f1(60 * s) + 'px,' + f1(-160 * s) + 'px) scale(' + f3(s) + ')');
    css(shadow, 'opacity', f3(lerp(0.95, 0.42, mix) * I));
    css(glare.parentNode, 'opacity', f3(0.55 + 0.45 * (1 - mix)));
    css(glare, 'transform', 'translate3d(' + f2(-ry * 1.15 + px * 6) + '%,0,0)');

    // ---- the other screens, fanned out behind (hero only)
    var spread = Ig * (1 + e * 1.5), gfade = (1 - smooth(e / 0.5)) * Ig;
    for (var g = 0; g < ghosts.length; g++) {
      var G = P.ghost[g], go = G.o * gfade;
      if (go < 0.004) { css(ghosts[g], 'visibility', 'hidden'); continue; }
      css(ghosts[g], 'visibility', 'visible'); css(ghosts[g], 'opacity', f3(go));
      var dep = 1 + (-G.z / 700);
      css(ghosts[g], 'transform', 'translate3d(' + f1(G.x * s * spread + px * dep * -16) + 'px,' + f1((G.y * spread + (1 - Ig) * 240) * s + pyy * dep * -10 + Math.sin(t * 0.7 + g * 1.7) * 5 * amb) + 'px,' + f1(G.z * s) + 'px) rotateX(' + f2(rx) + 'deg) rotateY(' + f2(ry + (G.x < 0 ? 5 : -5)) + 'deg) rotateZ(' + f2(rz) + 'deg) scale(' + f3(s * 0.9) + ')');
    }

    // ---- screens inside the phone
    for (var k = 0; k < N; k++) {
      var d = scr[k], dim = d.lastChild;
      if (k === i) {
        css(d, 'visibility', 'visible'); css(d, 'zIndex', '1');
        if (kind === 'push') { css(d, 'transform', 'translate3d(' + f2(28 * tr) + '%,0,0)'); css(d, 'opacity', '1'); css(dim, 'opacity', f3(0.34 * tr)); }
        else if (kind === 'success') { css(d, 'transform', 'scale(' + f3(1 - 0.07 * tr) + ')'); css(d, 'opacity', f3(1 - smooth(tr / 0.7))); css(dim, 'opacity', '0'); }
        else if (kind === 'rise') { css(d, 'transform', 'scale(' + f3(1 - 0.06 * tr) + ')'); css(d, 'opacity', '1'); css(dim, 'opacity', f3(0.42 * tr)); }
        else { css(d, 'transform', 'none'); css(d, 'opacity', '1'); css(dim, 'opacity', '0'); }
      } else if (k === i + 1 && tr > 0) {
        css(d, 'visibility', 'visible'); css(d, 'zIndex', '2'); css(dim, 'opacity', '0');
        if (kind === 'push') { css(d, 'transform', 'translate3d(' + f2(-100 * (1 - tr)) + '%,0,0)'); css(d, 'opacity', '1'); }
        else if (kind === 'success') { css(d, 'transform', 'scale(' + f3(1.1 - 0.1 * E.back(tr)) + ')'); css(d, 'opacity', f3(smooth((tr - 0.15) / 0.6))); }
        else { css(d, 'transform', 'translate3d(0,' + f2(100 * (1 - tr)) + '%,0)'); css(d, 'opacity', '1'); }
      } else css(d, 'visibility', 'hidden');
    }

    // ---- lifts: hero cards, then one card per step
    var veilO = 0, heroLift = E.reduced ? 0 : Il * (1 - smooth(hp / 0.55));
    for (var h = 0; h < heroLifts.length; h++) veilO = Math.max(veilO, setLift(heroLifts[h], heroLift * (y < jTop + 1 ? 1 : 0), heroLifts[h].__z * P.liftK, Math.sin(t * 0.8 + h * 2) * 4 * amb));
    for (var q = 0; q < N; q++) {
      var lz = 0;
      if (q === i && y >= jTop - vh * 0.2 && !E.reduced) lz = smooth((u - 0.1) / 0.2) * (1 - smooth((u - 0.5) / 0.17));
      if (q === 0 && y < jTop) lz = 0;
      if (q === N - 1 && i === N - 1) lz = smooth((u - 0.1) / 0.2) * (1 - smooth(out / (vh * 0.35)));      // the last card stays out until the phone leaves
      veilO = Math.max(veilO, setLift(stepLifts[q], lz, 84 * P.liftK, Math.sin(t * 0.8) * 3 * amb));
    }
    css(veil, 'opacity', f3(veilO * 0.2));

    // ---- text of the hero and the journey
    css(heroCopy, 'opacity', f3(1 - smooth(hp / 0.4)));
    css(heroCopy, 'transform', 'translate3d(0,' + f1(-hp * vh * 0.2) + 'px,0)');
    css(heroCopy, 'visibility', hp > 0.45 ? 'hidden' : 'visible');
    css(cue, 'opacity', f3((1 - smooth(hp / 0.12)) * (still ? 1 : E.out((E.intro - 2) / 1))));
    var leave = 1 - smooth((out - vh * 0.12) / (vh * 0.3));                      // the big word behind the phone goes as the sheet's lower edge comes up
    css(jCopy, 'opacity', f3(E.mobile ? smooth((hp - 0.74) / 0.24) : 1));       // on a phone the text waits until the phone has moved out of its way
    for (var j = 0; j < N; j++) {
      var loc = f - j, inn = j === 0 ? 1 : smooth((loc + 0.14) / 0.14), ou = j === N - 1 ? 1 : 1 - smooth((loc - 0.66) / 0.13), o = inn * ou;
      if (y < jTop) o = j === 0 ? 1 : 0;
      css(steps[j], 'opacity', f3(o));
      css(steps[j], 'transform', 'translate3d(0,' + f1((1 - inn) * 46 - (1 - ou) * 46) + 'px,0)');
      css(steps[j], 'visibility', o < 0.004 ? 'hidden' : 'visible');
      css(words[j], 'opacity', f3(o * mix * leave));
      css(words[j], 'transform', 'translate3d(' + f2((loc - 0.35) * -7) + 'vw,0,0)');
      var fill = j < i ? 1 : j === i ? (y < jTop ? 0 : c01(u / 0.7)) : 0;
      css(railItems[j].firstChild.firstChild, '--f', f3(fill));
      var act = (!last && u > 0.86) ? i + 1 : i;                                  // the label changes with the text, as the next screen arrives
      if ((j === act) !== !!railItems[j].__on) { railItems[j].__on = j === act; railItems[j].classList.toggle('on', j === act); }
    }
    ST.step = i;
  }

  // the card rises out of the screen; returns its height 0..1 for the veil
  function setLift(n, k, z, bob) {
    if (k < 0.004) { css(n, 'opacity', '0'); css(n, 'visibility', 'hidden'); css(n.__plate, 'visibility', 'hidden'); return 0; }
    css(n, 'visibility', 'visible'); css(n, 'opacity', f3(c01(k * 6)));
    css(n.__plate, 'visibility', 'visible'); css(n.__plate, 'opacity', f3(c01(k * 2.2)));
    css(n, 'transform', 'translate3d(0,' + f1(-10 * k + bob * k) + 'px,' + f1(z * k) + 'px)');
    css(n.firstChild, 'opacity', f3(c01(k)));
    return k;
  }

  // the light around the phone: the journey's cream sheet rises behind it (the sheet itself scrolls with the page, see js/engine.js);
  // `mix` is how far the phone is inside that light, and only changes the phone's own arch and shadow
  function lightOnly(jTop, y, vh) {
    var edge = jTop - y;                                                          // where the top edge of the sheet is on the screen
    var mix = smooth((vh * 0.8 - edge) / (vh * 0.55));
    if (!E.still) {
      css(orbA, 'transform', 'translate3d(' + f1(E.mx * -18) + 'px,' + f1(-Math.min(E.y, vh * 12) * 0.06 + E.my * -12) + 'px,0)');
      css(orbB, 'transform', 'translate3d(' + f1(E.mx * 24) + 'px,' + f1(Math.min(E.y, vh * 12) * 0.04 + E.my * 16) + 'px,0)');
    }
    ST.mix = mix;
    return mix;
  }

  build();
  E.onMeasure(measure);
  E.onFrame(render);
})();
