/* The campaign network: canvas 2D, graph built from window.CAMPAIGN at runtime.
   Interaction model after the SYNAPSE brain explorer: typed nodes on a living field, hover lights the
   neighbourhood, click focuses a node and opens a detail panel, type filters, travelling pulses. */
var BRAIN = (function () {
  'use strict';
  var A = APP, C = A.C, h = A.h, S = SECTIONS;
  var T = {
    core: { label: 'Campaign', c: '#F2D9A8', r: 30 },
    phase: { label: 'Phases', c: '#D6B27A', r: 15 },
    post: { label: 'Posts', c: '#F4E8D2', r: 7 },
    hero: { label: 'Hero stories', c: '#E8743B', r: 17 },
    kv: { label: 'Characters', c: '#F2D9A8', r: 19, img: true },
    feature: { label: 'App features', c: '#3E8E68', r: 13 },
    channel: { label: 'Channels', c: '#3E8E68', r: 11, hollow: true },
    group: { label: 'Asset groups', c: '#D6B27A', r: 13, hollow: true },
    film: { label: 'Films', c: '#E8743B', r: 11, img: true },
    ooh: { label: 'Outdoor videos', c: '#F4E8D2', r: 11, img: true }
  };
  var ORDER = ['core', 'phase', 'post', 'hero', 'kv', 'feature', 'channel', 'group', 'film', 'ooh'];
  var ALWAYS = { core: 1, phase: 1, hero: 1, kv: 1, feature: 1, channel: 1, group: 1 };
  var nodes = [], edges = [], byId = {}, off = {};
  var sec, cv, ctx, W = 0, H = 0, dpr = 1, portrait = false;
  var cam = { x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 }, fit = 1, fitC = { x: 0, y: 0 };
  var hover = null, sel = null, explore = false, running = false, visible = false;
  var pm = { x: 0, y: 0, tx: 0, ty: 0 };
  var panelEl, hudEl, exploreBtn, filterBtns = {}, sprites = {}, far = [];
  var stat = { fps: 0, ms: 0, frames: [], last: 0, acc: 0, n: 0, minFps: 0 };

  function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function hash(str) { var v = 2166136261; for (var i = 0; i < str.length; i++) v = Math.imul(v ^ str.charCodeAt(i), 16777619); return ((v >>> 0) % 10000) / 10000; }
  function rad(d) { return d * Math.PI / 180; }

  /* ---------- graph ---------- */
  function add(id, type, label, o) {
    o = o || {};
    var n = { id: id, type: type, label: label, sub: o.sub || '', ar: !!o.ar, main: !!o.main, data: o.data, imgSrc: o.img, to: o.to, r: (o.r || T[type].r), nb: [], x: 0, y: 0, al: 1,
      p1: hash(id) * 6.28, p2: hash(id + 'y') * 6.28, f1: 0.25 + hash(id + 'f') * 0.35, f2: 0.2 + hash(id + 'g') * 0.35 };
    nodes.push(n); byId[id] = n; return n;
  }
  function link(a, b, weak) {
    a = byId[a]; b = byId[b];
    if (!a || !b || a === b) return;
    for (var i = 0; i < a.nb.length; i++) if (a.nb[i].n === b) return;
    var e = { a: a, b: b, weak: !!weak, curv: (hash(a.id + b.id) - 0.5) * 0.34, ph: hash(b.id + a.id) * 3, sp: 0.16 + hash(a.id + '>' + b.id) * 0.16 };
    edges.push(e); a.nb.push({ n: b, e: e }); b.nb.push({ n: a, e: e });
  }
  var FEATS = [
    { key: 'booking', re: /حجز/, films: ['f01_book_in_clinic', 'f02_queue'] },
    { key: 'results', re: /تحاليل/, films: ['f06_medical_results'] },
    { key: 'consult', re: /استشار/, films: ['f03_online_consultation'] },
    { key: 'homecare', re: /الرعاية المنزلية/, films: ['f04_home_care'] },
    { key: 'ambulance', re: /إسعاف/, films: ['f05_emergency'] },
    { key: 'all', re: /كل الـ ?features/, films: [] }
  ];
  function featOf(text) { var t = A.clean(text); if (/features/.test(text)) return FEATS[5]; for (var i = 0; i < 5; i++) if (FEATS[i].re.test(t)) return FEATS[i]; return null; }

  function buildGraph() {
    var f = C.facts;
    add('core', 'core', f.slogan, { ar: true, sub: f.sub, to: 'hero', img: 'assets/el/app_icon.webp' });
    C.phases.forEach(function (p) { add('phase:' + p.phase, 'phase', p.phase, { data: p, to: 'calendar' }); link('phase:' + p.phase, 'core'); });
    C.posts.forEach(function (p) { add('post:' + p.n, 'post', p.title, { data: p, to: 'calendar' }); link('post:' + p.n, 'phase:' + p.phase); });
    C.heroes.forEach(function (x) { add('hero:' + x.n, 'hero', x.title, { data: x, to: 'story-' + x.kv }); });
    C.kvs.forEach(function (k) { add('kv:' + k.id, 'kv', A.castShort(k.id), { data: k, img: S.castSrc(k.id), to: k.tier === 'main' ? 'main-copies' : 'visuals', r: k.tier === 'main' ? 26 : 0, main: k.tier === 'main' }); });
    /* main copies that are films without a character (Waiting Seasons): a main-copy node on the core */
    (C.main_copies || []).forEach(function (m) {
      if (m.kind !== 'film') return;
      add('main:' + m.id, 'film', m.title, { data: m, img: m.frames && m.frames[0], to: 'main-copies', r: 26, main: true }); link('main:' + m.id, 'core');
    });
    (C.main_copies || []).forEach(function (m) { if (m.kind === 'kv' || m.kv_link) link('kv:' + m.id, 'core'); });
    /* the coach: a supporting face in the goalkeeper key visual (no story, no entry in kvs) */
    add('cast:coach', 'kv', 'Coach', { data: { id: 'coach', coach: true }, img: S.castSrc('coach'), to: 'stories', r: 14 });
    link('cast:coach', 'kv:goalkeeper');
    /* features: distinct post features + key-visual headlines, merged by keyword */
    var flabel = {};
    C.posts.forEach(function (p) { var ft = featOf(p.feature); if (ft && !flabel[ft.key]) flabel[ft.key] = p.feature; });
    C.kvs.forEach(function (k) { var ft = featOf(k.headline); if (ft && !flabel[ft.key]) flabel[ft.key] = A.clean(k.headline); });
    FEATS.forEach(function (ft) { if (flabel[ft.key]) add('feat:' + ft.key, 'feature', flabel[ft.key], { ar: true, data: ft, to: 'films' }); });
    f.platforms.concat(['Outdoor', 'Stories']).forEach(function (c) { add('ch:' + c, 'channel', c, { to: c === 'Outdoor' ? 'outdoor' : c === 'Stories' ? 'calendar' : 'calendar' }); });
    [['posts', 'Social posts 4:5', 'social'], ['stories', 'Story designs 9:16', 'social'], ['carousel', 'Carousel', 'social'], ['outdoor', 'Outdoor mockups', 'outdoor'], ['films', 'Films', 'films']]
      .forEach(function (g) { add('grp:' + g[0], 'group', g[1], { to: g[2], data: { key: g[0] } }); link('grp:' + g[0], 'core'); });
    C.videos.forEach(function (v) {
      if (v.group === 'main') return; /* shown by its main-copy node */
      var o = v.group === 'outdoor', rd = v.group === 'redesign', scr = rd && C.redesign && C.redesign.screens && C.redesign.screens[0];
      /* the new-design film: a headline node on the core; its thumbnail is the new home screen (the poster frame shows the old app) */
      add('vid:' + v.id, o ? 'ooh' : 'film', v.title.split(' · ')[0], { data: v, img: scr ? scr.src : v.poster, to: o ? 'outdoor' : rd ? 'redesign' : v.group === 'story' ? 'story-' + v.kv : 'films', r: v.id === 'master_60s' || rd ? 16 : 0 });
      if (rd) link('vid:' + v.id, 'core');
      link('vid:' + v.id, o ? 'grp:outdoor' : 'grp:films');
    });
    /* relations */
    C.heroes.forEach(function (x) {
      var p = S.postOfHero(x); if (p) link('post:' + p.n, 'hero:' + x.n);
      link('hero:' + x.n, 'kv:' + x.kv);
      var ft = featOf(x.feature); if (ft) link('hero:' + x.n, 'feat:' + ft.key);
      link('hero:' + x.n, 'ch:Stories', true);
    });
    C.posts.forEach(function (p) {
      var ft = featOf(p.feature); if (ft && p.category !== 'Hero Copy') link('post:' + p.n, 'feat:' + ft.key);
      if (/carousel/i.test(p.format)) link('post:' + p.n, 'grp:carousel');
      f.platforms.forEach(function (c) { link('post:' + p.n, 'ch:' + c, true); });
    });
    C.kvs.forEach(function (k) {
      var ft = featOf(k.headline); if (ft) link('kv:' + k.id, 'feat:' + ft.key);
      link('kv:' + k.id, 'grp:posts', true); link('kv:' + k.id, 'grp:stories', true); link('kv:' + k.id, 'grp:outdoor', true);
    });
    FEATS.forEach(function (ft) { ft.films.forEach(function (id) { link('feat:' + ft.key, 'vid:' + id); }); });
    link('feat:all', 'grp:carousel');
    f.platforms.forEach(function (c) { link('ch:' + c, 'core'); });
    link('ch:Stories', 'grp:stories'); link('ch:Outdoor', 'grp:outdoor');
  }

  /* ---------- layout: seeded sectors + a short force relaxation (deterministic) ---------- */
  function layout() {
    function seed(id, ang, r) { var n = byId[id]; if (n) { n.sx = Math.cos(rad(ang)) * r * 1.55; n.sy = Math.sin(rad(ang)) * r; } }
    seed('core', 0, 0);
    var pa = [128, 160, 200, 232];
    C.phases.forEach(function (p, i) {
      seed('phase:' + p.phase, pa[i], 215);
      var ps = C.posts.filter(function (x) { return x.phase === p.phase; });
      ps.forEach(function (x, k) { seed('post:' + x.n, pa[i] + (k - (ps.length - 1) / 2) * 8.5, 380 + (k % 2) * 62); });
    });
    C.facts.platforms.forEach(function (c, i) { seed('ch:' + c, 166 + i * 14, 560 + (i % 2) * 30); });
    C.heroes.forEach(function (x, j) { seed('hero:' + x.n, -78 + j * 20, 250 + (j % 2) * 26); seed('kv:' + x.kv, -80 + j * 20, 440 + (j % 2) * 50); });
    seed('kv:goalkeeper', 26, 430); seed('cast:coach', 33, 540);
    var fa = { booking: -68, results: -50, consult: -32, homecare: -92, ambulance: 20, all: 58 };
    FEATS.forEach(function (ft) { seed('feat:' + ft.key, fa[ft.key], ft.key === 'all' ? 200 : 345); });
    seed('grp:films', 52, 330);
    var fl = nodes.filter(function (n) { return n.type === 'film' && !n.main && !(n.data && n.data.group === 'redesign'); });
    nodes.forEach(function (n) { if (n.main && n.type === 'film') seed(n.id, -98, 175); });
    fl.forEach(function (n, k) { seed(n.id, 34 + k * 4.6, 455 + (k % 2) * 80); });
    nodes.forEach(function (n) { if (n.data && n.data.group === 'redesign') seed(n.id, 70, 285); });
    seed('grp:carousel', 84, 210);
    seed('grp:outdoor', 108, 300); seed('ch:Outdoor', 122, 380);
    nodes.filter(function (n) { return n.type === 'ooh'; }).forEach(function (n, k) { seed(n.id, 96 + k * 7, 430 + (k % 2) * 56); });
    seed('grp:posts', -100, 520); seed('grp:stories', -116, 470); seed('ch:Stories', -122, 300);
    nodes.forEach(function (n) { if (n.sx == null) { n.sx = (hash(n.id) - 0.5) * 800; n.sy = (hash(n.id + 'q') - 0.5) * 500; } n.x = n.sx; n.y = n.sy; });
    for (var it = 0; it < 220; it++) {
      var i, j, a, b, dx, dy, d, fo, min;
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j]; dx = b.x - a.x; dy = b.y - a.y; d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        min = (a.r + b.r) * 1.5 + 44;
        if (d < min) { fo = (min - d) / d * 0.5; a.x -= dx * fo; a.y -= dy * fo; b.x += dx * fo; b.y += dy * fo; }
      }
      for (i = 0; i < nodes.length; i++) { a = nodes[i]; a.x += (a.sx - a.x) * 0.06; a.y += (a.sy - a.y) * 0.06; }
      byId.core.x = 0; byId.core.y = 0;
    }
  }

  /* ---------- sprites ---------- */
  function mk(w, hh) { var c = document.createElement('canvas'); c.width = w; c.height = hh || w; return c; }
  function rgba(hex, a) { var v = parseInt(hex.slice(1), 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; }
  function makeSprites() {
    ORDER.forEach(function (t) {
      var col = T[t].c, g, c, x;
      c = mk(128); x = c.getContext('2d');
      g = x.createRadialGradient(64, 64, 6, 64, 64, 64); g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.4, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); sprites['glow:' + t] = c;
      c = mk(128); x = c.getContext('2d');
      if (T[t].hollow) {
        x.fillStyle = 'rgba(30,19,11,.92)'; x.beginPath(); x.arc(64, 64, 58, 0, 6.3); x.fill();
        x.strokeStyle = col; x.lineWidth = 9; x.beginPath(); x.arc(64, 64, 55, 0, 6.3); x.stroke();
        x.fillStyle = col; x.beginPath(); x.arc(64, 64, 20, 0, 6.3); x.fill();
      } else {
        g = x.createRadialGradient(46, 40, 4, 64, 64, 64); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.22, col); g.addColorStop(0.85, rgba(col, 0.75)); g.addColorStop(1, 'rgba(58,37,22,.9)');
        x.fillStyle = g; x.beginPath(); x.arc(64, 64, 62, 0, 6.3); x.fill();
      }
      sprites['orb:' + t] = c;
    });
    var c = mk(48), x = c.getContext('2d'), g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255,246,228,1)'); g.addColorStop(0.3, 'rgba(242,217,168,.7)'); g.addColorStop(1, 'rgba(242,217,168,0)');
    x.fillStyle = g; x.fillRect(0, 0, 48, 48); sprites.pulse = c;
    c = mk(96); x = c.getContext('2d'); g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(242,217,168,.5)'); g.addColorStop(0.5, 'rgba(214,178,122,.14)'); g.addColorStop(1, 'rgba(214,178,122,0)');
    x.fillStyle = g; x.fillRect(0, 0, 96, 96); sprites.far = c;
    for (var i = 0; i < 46; i++) far.push({ x: (rnd(i + 1) - 0.5) * 2600, y: (rnd(i + 77) - 0.5) * 1500, r: 8 + rnd(i + 31) * 34, z: 0.25 + rnd(i + 5) * 0.4, a: 0.25 + rnd(i + 9) * 0.5, l: rnd(i + 3) > 0.55 ? Math.floor(rnd(i + 13) * 46) : -1 });
  }
  var imgsLoaded = false;
  function loadImages() {
    if (imgsLoaded) return; imgsLoaded = true;
    nodes.forEach(function (n) {
      if (!n.imgSrc) return;
      var im = new Image();
      im.onload = function () {
        var c = mk(128), x = c.getContext('2d'), iw = im.naturalWidth, ih = im.naturalHeight, s = Math.min(iw, ih);
        var sx = (iw - s) / 2, sy = n.type === 'kv' ? Math.min(ih - s, ih * 0.03) : (ih - s) * (n.type === 'core' ? 0.5 : 0.42);
        x.beginPath(); x.arc(64, 64, 62, 0, 6.3); x.clip();
        x.drawImage(im, sx, sy, s, s, 0, 0, 128, 128);
        if (n.type === 'kv') { /* warm the cool studio backdrop so the face sits in the palette */
          var g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(232,150,80,.16)'); g.addColorStop(1, 'rgba(58,37,22,.42)');
          x.fillStyle = g; x.fillRect(0, 0, 128, 128);
        }
        n.thumb = c;
      };
      im.src = n.imgSrc;
    });
  }

  /* ---------- camera ---------- */
  function P(n, k) { return portrait ? (k ? n.x * 0.8 : n.y * 0.85) : (k ? n.y : n.x); }
  function resize() {
    var b = sec.getBoundingClientRect();
    W = Math.round(b.width); H = Math.round(b.height); dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    portrait = H > W * 1.05;
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    nodes.forEach(function (n) { var x = P(n, 0), y = P(n, 1); x0 = Math.min(x0, x - n.r); x1 = Math.max(x1, x + n.r); y0 = Math.min(y0, y - n.r); y1 = Math.max(y1, y + n.r); });
    var top = portrait ? 226 : 96, bot = portrait ? 130 : 76, side = portrait ? 18 : 56, left = portrait ? 18 : (W > 900 ? 232 : 56);
    fit = Math.min((W - side - left) / (x1 - x0), (H - top - bot) / (y1 - y0));
    fitC = { x: (x0 + x1) / 2 - ((left - side) / 2) / fit, y: (y0 + y1) / 2 - ((top - bot) / 2) / fit };
    if (!sel) { cam.tx = fitC.x; cam.ty = fitC.y; cam.ts = fit; }
    else focus(sel);
    cam.x = cam.tx; cam.y = cam.ty; cam.s = cam.ts;
  }
  /* frame the node together with its neighbourhood inside the free area (between the legend and the panel) */
  function focus(n) {
    var wide = W > 900, L = wide ? 236 : 16, R = wide ? 440 : 16, Tp = wide ? 90 : 150, B = wide ? 80 : H * 0.58;
    var aw = Math.max(120, W - L - R), ah = Math.max(120, H - Tp - B);
    var x0 = P(n, 0), x1 = x0, y0 = P(n, 1), y1 = y0;
    n.nb.forEach(function (m) { var x = P(m.n, 0), y = P(m.n, 1); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    var s = A.clamp(Math.min(aw / (x1 - x0 + 150), ah / (y1 - y0 + 150)), fit * 0.85, fit * (wide ? 2.2 : 3));
    /* keep the node itself comfortably inside the area even when its neighbourhood is lopsided */
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, mx = aw / 2 / s - 60 / s, my = ah / 2 / s - 60 / s;
    cx = A.clamp(cx, P(n, 0) - mx, P(n, 0) + mx); cy = A.clamp(cy, P(n, 1) - my, P(n, 1) + my);
    cam.ts = s;
    cam.tx = cx - ((L + aw / 2) - W / 2) / s; cam.ty = cy - ((Tp + ah / 2) - H / 2) / s;
    if (A.STATIC) { cam.x = cam.tx; cam.y = cam.ty; cam.s = cam.ts; }
  }
  function reset() { select(null); cam.tx = fitC.x; cam.ty = fitC.y; cam.ts = fit; }
  function zoomAt(mx, my, k) {
    var s2 = A.clamp(cam.ts * k, fit * 0.6, fit * 5);
    var wx = (mx - W / 2) / cam.ts + cam.tx, wy = (my - H / 2) / cam.ts + cam.ty;
    cam.tx = wx - (mx - W / 2) / s2; cam.ty = wy - (my - H / 2) / s2; cam.ts = s2;
  }

  /* ---------- draw ---------- */
  function hlSet() {
    var c = hover || sel; if (!c) return null;
    var m = {}; m[c.id] = 1; c.nb.forEach(function (x) { m[x.n.id] = 1; });
    if (sel && hover && hover !== sel) { m[sel.id] = 1; }
    return m;
  }
  function qpt(e, u) {
    var a = e.a, b = e.b, v = 1 - u;
    return { x: v * v * a.X + 2 * v * u * e.cx + u * u * b.X, y: v * v * a.Y + 2 * v * u * e.cy + u * u * b.Y };
  }
  function draw(now) {
    var t = now / 1000, i, n, e, s = cam.s, hl = hlSet(), center = hover || sel;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    /* far layer: blurred lights + ghost threads, slower than the network (depth) */
    ctx.lineWidth = 1;
    for (i = 0; i < far.length; i++) {
      var fz = far[i];
      fz.X = (fz.x - cam.x * fz.z) * s * 0.75 + W / 2 - pm.x * 46 * fz.z + Math.sin(t * 0.13 + i) * 9;
      fz.Y = (fz.y - cam.y * fz.z) * s * 0.75 + H / 2 - pm.y * 30 * fz.z + Math.cos(t * 0.11 + i * 2) * 9;
    }
    ctx.strokeStyle = 'rgba(214,178,122,.07)'; ctx.beginPath();
    for (i = 0; i < far.length; i++) if (far[i].l >= 0) { ctx.moveTo(far[i].X, far[i].Y); ctx.lineTo(far[far[i].l].X, far[far[i].l].Y); }
    ctx.stroke();
    for (i = 0; i < far.length; i++) { var q = far[i], rr = q.r * (0.6 + s); ctx.globalAlpha = q.a * 0.55; ctx.drawImage(sprites.far, q.X - rr, q.Y - rr, rr * 2, rr * 2); }
    ctx.globalAlpha = 1;
    /* node screen positions */
    var rs = Math.pow(s, 0.55), still = A.STATIC || A.CALM;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var dx = still ? 0 : Math.sin(t * n.f1 + n.p1) * 5, dy = still ? 0 : Math.cos(t * n.f2 + n.p2) * 5;
      n.X = (P(n, 0) + dx - cam.x) * s + W / 2 - pm.x * 10;
      n.Y = (P(n, 1) + dy - cam.y) * s + H / 2 - pm.y * 7;
      n.R = Math.max(2.6, n.r * rs);
      var target = off[n.type] ? 0.05 : (hl && !hl[n.id] ? 0.14 : 1);
      n.al += (target - n.al) * (still ? 1 : 0.14);
    }
    /* edges */
    var pass, on;
    for (i = 0; i < edges.length; i++) {
      e = edges[i];
      var mx = (e.a.X + e.b.X) / 2, my = (e.a.Y + e.b.Y) / 2, ex = e.b.X - e.a.X, ey = e.b.Y - e.a.Y;
      e.cx = mx - ey * e.curv; e.cy = my + ex * e.curv;
      e.off = off[e.a.type] || off[e.b.type];
      e.hl = !!center && !e.off && (e.a === center || e.b === center);
    }
    for (pass = 0; pass < 3; pass++) {
      ctx.beginPath(); on = false;
      for (i = 0; i < edges.length; i++) {
        e = edges[i]; if (e.off) continue;
        if (pass === 2 ? !e.hl : (e.hl || (pass === 0) !== e.weak)) continue;
        ctx.moveTo(e.a.X, e.a.Y); ctx.quadraticCurveTo(e.cx, e.cy, e.b.X, e.b.Y); on = true;
      }
      if (!on) continue;
      if (pass === 0) { ctx.strokeStyle = 'rgba(214,178,122,' + (hl ? 0.035 : 0.075) + ')'; ctx.lineWidth = 0.8; }
      else if (pass === 1) { ctx.strokeStyle = 'rgba(242,217,168,' + (hl ? 0.07 : 0.3) + ')'; ctx.lineWidth = 1.1; }
      else { ctx.strokeStyle = 'rgba(242,217,168,.9)'; ctx.lineWidth = 1.7; }
      ctx.stroke();
    }
    /* pulses */
    if (!still || true) {
      for (i = 0; i < edges.length; i++) {
        e = edges[i]; if (e.off) continue;
        if (e.hl) {
          var u2 = (t * 0.55 + e.ph) % 1, from = e.a === center ? u2 : 1 - u2, p2 = qpt(e, from);
          ctx.globalAlpha = 1; ctx.drawImage(sprites.pulse, p2.x - 11, p2.y - 11, 22, 22);
        } else if (!e.weak && !hl) {
          var u = (t * e.sp + e.ph) % 2.6;
          if (u < 1) { var p = qpt(e, u); ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9; ctx.drawImage(sprites.pulse, p.x - 7, p.y - 7, 14, 14); }
        }
      }
      ctx.globalAlpha = 1;
    }
    /* nodes (small first, core last) */
    for (i = nodes.length - 1; i >= 0; i--) {
      n = nodes[i]; var R = n.R, big = n === hover || n === sel;
      if (n.X < -80 || n.X > W + 80 || n.Y < -80 || n.Y > H + 80) continue;
      ctx.globalAlpha = n.al * (big ? 1 : 0.8);
      var gr = R * (n.type === 'core' ? 3.6 : big ? 3.4 : 2.7);
      ctx.drawImage(sprites['glow:' + n.type], n.X - gr, n.Y - gr, gr * 2, gr * 2);
      ctx.globalAlpha = n.al;
      if (n.thumb) {
        ctx.drawImage(n.thumb, n.X - R, n.Y - R, R * 2, R * 2);
        ctx.strokeStyle = T[n.type].c; ctx.lineWidth = Math.max(1.2, R * 0.11); ctx.beginPath(); ctx.arc(n.X, n.Y, R, 0, 6.3); ctx.stroke();
      } else ctx.drawImage(sprites['orb:' + n.type], n.X - R, n.Y - R, R * 2, R * 2);
      if (n.main) {
        ctx.strokeStyle = '#F2D9A8'; ctx.lineWidth = Math.max(2, R * 0.13); ctx.beginPath(); ctx.arc(n.X, n.Y, R + Math.max(4, R * 0.22), 0, 6.3); ctx.stroke();
        ctx.strokeStyle = 'rgba(242,217,168,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.X, n.Y, R + Math.max(8, R * 0.44), 0, 6.3); ctx.stroke();
      }
      if (n.data && n.data.group === 'feature_soon') { ctx.fillStyle = '#E8743B'; ctx.beginPath(); ctx.arc(n.X + R * 0.72, n.Y - R * 0.72, Math.max(2.5, R * 0.3), 0, 6.3); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    /* rings: core + selection */
    var core = byId.core; ring(core, core.R + 7, t * 0.25, [2, 6], 0.55 * core.al, 2.4); ring(core, core.R + 13, -t * 0.18, [16, 6, 3, 6], 0.4 * core.al, 1);
    if (sel) { ring(sel, sel.R + 6, t * 0.6, [10, 5, 2, 5], 0.95, 1.4); ring(sel, sel.R + 11, -t * 0.4, [1, 4.5], 0.5, 2.2); }
    labels(hl);
  }
  function ring(n, r, rot, dash, a, w) {
    ctx.save(); ctx.translate(n.X, n.Y); ctx.rotate(rot); ctx.setLineDash(dash); ctx.strokeStyle = 'rgba(242,217,168,' + a + ')'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.stroke(); ctx.restore();
  }
  var FONT = '"Graphik Arabic",system-ui,sans-serif';
  function labels(hl) {
    var placed = [], zoomed = cam.s > fit * 1.45, i, n, list = [];
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.al < 0.5) continue;
      var must = n === hover || n === sel, show = must || ALWAYS[n.type] || n.main || (n.data && n.data.group === 'redesign') || zoomed || (hl && hl[n.id]);
      if (!show) continue;
      list.push({ n: n, pr: must ? 1000 : (hl && hl[n.id] ? 500 : 0) + n.r });
    }
    list.sort(function (a, b) { return b.pr - a.pr; });
    ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (i = 0; i < list.length; i++) {
      n = list[i].n;
      var must2 = n === hover || n === sel, fs = n.type === 'core' ? 17 : must2 ? 13.5 : n.r >= 15 ? 12.5 : 11.5, wt = n.type === 'core' || must2 ? 700 : n.r >= 15 ? 600 : 500;
      var text = n.label.length > 44 ? n.label.slice(0, 43) + '…' : n.label;
      ctx.font = wt + ' ' + fs + 'px ' + FONT;
      if (n.tw == null || n.twf !== fs) { n.tw = ctx.measureText(text).width; n.twf = fs; }
      var w = n.tw + (must2 ? 22 : 6), hh = fs + (must2 ? 12 : 4), x = n.X, y = n.Y + n.R + hh / 2 + (n.type === 'core' ? 18 : 6);
      var box = { x0: x - w / 2, y0: y - hh / 2, x1: x + w / 2, y1: y + hh / 2 }, hit = false;
      if (!must2) for (var j = 0; j < placed.length; j++) { var p = placed[j]; if (box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0) { hit = true; break; } }
      if (hit) continue;
      placed.push(box);
      ctx.direction = n.ar ? 'rtl' : 'ltr'; ctx.textAlign = 'center';
      if (must2) {
        ctx.fillStyle = 'rgba(24,14,8,.92)'; ctx.strokeStyle = 'rgba(242,217,168,.55)'; ctx.lineWidth = 1;
        rr(box.x0, box.y0, w, hh, hh / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF6E4'; ctx.fillText(text, x, y + 0.5);
      } else {
        ctx.globalAlpha = n.al;
        ctx.strokeStyle = 'rgba(18,11,6,.9)'; ctx.lineWidth = 3.4; ctx.strokeText(text, x, y);
        ctx.fillStyle = n.type === 'core' ? '#F2D9A8' : n.r >= 15 ? '#F4E8D2' : 'rgba(244,232,210,.8)'; ctx.fillText(text, x, y);
        ctx.globalAlpha = 1;
      }
    }
  }
  function rr(x, y, w, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function loop(now) {
    if (!running) return;
    var k = A.STATIC ? 1 : 0.1;
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.s += (cam.ts - cam.s) * k;
    pm.x += (pm.tx - pm.x) * 0.06; pm.y += (pm.ty - pm.y) * 0.06;
    var t0 = performance.now();
    draw(now);
    var ms = performance.now() - t0;
    if (stat.last) { stat.frames.push(now - stat.last); if (stat.frames.length > 90) stat.frames.shift(); }
    stat.last = now; stat.acc += ms; stat.n++;
    if (stat.n >= 30) {
      var sum = 0, mx = 0; stat.frames.forEach(function (d) { sum += d; if (d > mx) mx = d; });
      stat.fps = stat.frames.length ? 1000 / (sum / stat.frames.length) : 0; stat.minFps = mx ? 1000 / mx : 0; stat.ms = stat.acc / stat.n; stat.acc = 0; stat.n = 0;
      hudEl.textContent = nodes.length + ' nodes · ' + edges.length + ' links · ' + Math.round(stat.fps) + ' fps';
      sec.setAttribute('data-fps', stat.fps.toFixed(1)); sec.setAttribute('data-draw-ms', stat.ms.toFixed(2));
    }
    requestAnimationFrame(loop);
  }
  function setRunning(v) { if (v && !running) { running = true; stat.last = 0; stat.frames = []; requestAnimationFrame(loop); } else if (!v) running = false; }

  /* ---------- interaction ---------- */
  function hit(x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]; if (off[n.type]) continue;
      var d = Math.hypot(n.X - x, n.Y - y), lim = Math.max(n.R + 5, 13);
      if (d < lim && d - n.R < bd) { bd = d - n.R; best = n; }
    }
    return best;
  }
  function select(n) {
    sel = n || null;
    sec.classList.toggle('has-sel', !!sel);
    if (sel) { focus(sel); panel(sel); } else { var v = panelEl.querySelector('video'); if (v) v.pause(); }
    panelEl.setAttribute('aria-hidden', sel ? 'false' : 'true');
  }
  function setExplore(v) {
    explore = v; sec.classList.toggle('explore', v);
    exploreBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    exploreBtn.lastChild.textContent = v ? 'Release (Esc)' : 'Explore';
  }
  function bind() {
    var pts = {}, np = 0, down = null, pinch = null;
    function pos(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    cv.addEventListener('pointerdown', function (e) {
      var p = pos(e); pts[e.pointerId] = p; np = Object.keys(pts).length;
      var can = e.pointerType !== 'touch' || explore;
      down = { x: p.x, y: p.y, cx: cam.tx, cy: cam.ty, moved: false, can: can };
      if (can) { try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
      if (np === 2 && explore) { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.ts }; }
    });
    cv.addEventListener('pointermove', function (e) {
      var p = pos(e);
      if (e.pointerType !== 'touch') { pm.tx = (p.x / W - 0.5) * 2; pm.ty = (p.y / H - 0.5) * 2; }
      if (pts[e.pointerId]) pts[e.pointerId] = p;
      if (pinch && np === 2) {
        var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        var target = A.clamp(pinch.s * d / pinch.d, fit * 0.6, fit * 5);
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, target / cam.ts); if (down) down.moved = true; return;
      }
      if (down && pts[e.pointerId]) {
        var dx = p.x - down.x, dy = p.y - down.y;
        if (!down.moved && Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
        if (down.moved && down.can) { cam.tx = down.cx - dx / cam.s; cam.ty = down.cy - dy / cam.s; cam.x = cam.tx; cam.y = cam.ty; sec.classList.add('drag'); }
        return;
      }
      if (e.pointerType !== 'touch') { var n = hit(p.x, p.y); if (n !== hover) { hover = n; cv.style.cursor = n ? 'pointer' : ''; } }
    });
    function up(e) {
      var p = pos(e), was = down, had = pts[e.pointerId];
      delete pts[e.pointerId]; np = Object.keys(pts).length; if (np < 2) pinch = null;
      sec.classList.remove('drag');
      if (!had || np > 0) return;
      down = null;
      if (e.type === 'pointerup' && was && !was.moved) { var n = hit(p.x, p.y); if (n) select(n); else if (sel) select(null); }
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', function () { hover = null; pm.tx = 0; pm.ty = 0; cv.style.cursor = ''; });
    /* wheel never traps the page: it zooms only in explore mode or with Ctrl / Cmd held */
    cv.addEventListener('wheel', function (e) {
      if (!(explore || e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); var p = pos(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0016));
    }, { passive: false });
    cv.addEventListener('keydown', function (e) {
      var vis = nodes.filter(function (n) { return !off[n.type]; }), i = sel ? vis.indexOf(sel) : -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { select(vis[(i + 1) % vis.length]); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { select(vis[(i - 1 + vis.length) % vis.length]); e.preventDefault(); }
      else if (e.key === 'Enter' && !sel && vis.length) { select(vis[0]); }
      else if (e.key === '+' || e.key === '=') zoomAt(W / 2, H / 2, 1.3);
      else if (e.key === '-') zoomAt(W / 2, H / 2, 1 / 1.3);
      else if (e.key === '0') reset();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || document.querySelector('.ov.open') || document.querySelector('.drawer.open')) return;
      if (sel) select(null); else if (explore) setExplore(false);
    });
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (x) { visible = x.isIntersecting; setRunning(visible); if (!visible && explore) setExplore(false); }); }, { threshold: 0.02 }).observe(sec);
      new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) loadImages(); }); }, { rootMargin: '150% 0px' }).observe(sec);
    } else { loadImages(); setRunning(true); }
  }

  /* ---------- detail panel ---------- */
  function row(k, v, ar) { return v == null || v === '' || v === 'NA' || v === '—' ? [] : [h('dt', { text: k }), ar ? h('dd', { ar: true, text: v }) : h('dd', { text: String(v) })]; }
  function panel(n) {
    var d = n.data || {}, body = [], f = C.facts, k;
    if (n.type === 'core') {
      body.push(h('img', { src: 'assets/el/lockup.webp', alt: f.slogan, class: 'bp-lock' }));
      body.push(h('dl', { class: 'kvl' }, [].concat(row('Dates', A.fmtDate(f.start) + ' — ' + A.fmtDate(f.end, true)), row('Days', f.days), row('Platforms', f.platforms.join(' · ')),
        row('Feed posts', f.volume.feed_posts), row('Stories', f.volume.stories), row('Main copies', f.volume.main_copies), row('Tactical videos', f.volume.tactical_videos), row('CTA', f.cta, true))));
    } else if (n.type === 'phase') {
      body.push(h('p', { class: 'bp-ar big', ar: true, text: d.topic })); body.push(h('p', { class: 'bp-ar', ar: true, text: d.goal }));
      body.push(h('dl', { class: 'kvl' }, [].concat(row('From', A.fmtDate(d.from)), row('To', A.fmtDate(d.to)), row('Weight', Math.round(d.weight * 100) + '%'), row('Posts', d.posts))));
    } else if (n.type === 'post') {
      if (d.title_ar) body.push(h('p', { class: 'bp-ar big', ar: true, text: d.title_ar }));
      body.push(h('p', { class: 'bp-ar', ar: true, text: d.concept }));
      body.push(h('dl', { class: 'kvl' }, [].concat(row('Date', A.fmtDate(d.date) + ' · ' + d.day), row('Week', d.week), row('Category', d.category), row('Format', d.format), row('Type', d.type),
        row('Meta', d.meta_time), row('TikTok', d.tiktok_time), row('Feature', d.feature, true), row('CTA', d.cta, true), row('Campaign', d.campaign_type), row('Daily budget', d.budget_daily), row('Status', d.status))));
    } else if (n.type === 'hero') {
      body.push(h('p', { class: 'bp-tier' }, S.tierTag(d.kv, true)));
      body.push(h('div', { class: 'bp-hero' }, [h('span', { class: 'cast-ph' }, A.img(S.castSrc(d.kv), n.label, true)), h('div', null, [
        h('p', { class: 'bp-ar big', ar: true, text: d.title_ar }), h('dl', { class: 'kvl' }, [].concat(row('Airs', A.fmtDate(d.date) + ' · ' + A.dayName(d.date)), row('Feature', d.feature, true)))])]));
      body.push(h('ol', { class: 'bp-script', ar: true }, d.script.map(function (t) { return h('li', { text: t }); })));
    } else if (n.type === 'kv') {
      if (d.coach) {
        body.push(h('span', { class: 'cast-ph bp-cast' }, A.img(S.castSrc('coach'), 'Coach', true)));
        body.push(h('p', { class: 'bp-note', text: 'Supporting character in the goalkeeper key visual.' }));
      } else {
        body.push(h('p', { class: 'bp-tier' }, S.tierTag(d.id, true)));
        body.push(h('img', { src: d.kv, alt: A.clean(d.headline), class: 'bp-img' }));
        body.push(h('p', { class: 'bp-ar big', ar: true, text: A.clean(d.headline) }));
      }
    } else if (n.type === 'film' && d.frames) {
      body.push(h('p', { class: 'bp-tier' }, [h('span', { class: 'chip sm tier main', text: 'Main copy · ' + String(d.status || '').replace(' keyframes', '') }), d.length ? h('span', { class: 'chip sm', style: 'margin-left:6px', text: d.length }) : null]));
      var dv = d.video && C.videos.filter(function (x) { return x.id === d.video; })[0];
      body.push(dv ? h('video', { controls: true, playsinline: true, preload: 'none', poster: dv.poster, src: dv.src, class: 'bp-video h' }) : h('img', { src: d.frames[0], alt: d.title, class: 'bp-img' }));
      body.push(h('div', { class: 'bp-strip' }, d.frames.slice(1).map(function (x) { return h('img', { src: x, alt: '', loading: 'lazy' }); })));
      if (d.title_ar) body.push(h('p', { class: 'bp-ar big', ar: true, text: d.title_ar }));
      body.push(h('p', { class: 'bp-note', text: d.logline }));
      if (d.endline) body.push(h('p', { class: 'bp-ar big', ar: true, text: d.endline }));
    } else if (n.type === 'film' || n.type === 'ooh') {
      var v = h('video', { controls: true, playsinline: true, preload: 'none', poster: d.poster, src: d.src, class: 'bp-video ' + (d.vertical ? 'v' : 'h') });
      if (n.type === 'ooh') { v.muted = true; v.loop = true; }
      body.push(v);
      if (d.group === 'feature_soon') body.push(h('span', { class: 'chip sm ember', text: 'Coming soon' }));
    } else if (n.type === 'group') {
      var srcs = d.key === 'posts' ? C.kvs.map(function (x) { return x.post; }) : d.key === 'stories' ? C.kvs.map(function (x) { return x.story; }) : d.key === 'carousel' ? C.carousel
        : d.key === 'outdoor' ? C.outdoor.stills : C.videos.filter(function (x) { return x.group !== 'outdoor'; }).map(function (x) { return x.poster; });
      body.push(h('div', { class: 'bp-strip' }, srcs.slice(0, 8).map(function (s) { return h('img', { src: s, alt: '', loading: 'lazy' }); })));
      body.push(h('dl', { class: 'kvl' }, row('Assets', d.key === 'outdoor' ? C.outdoor.stills.length + ' sites · ' + C.outdoor.variants.length + ' variants' : srcs.length)));
    }
    var groups = {}, order = [];
    n.nb.forEach(function (x) { if (!groups[x.n.type]) { groups[x.n.type] = []; order.push(x.n.type); } groups[x.n.type].push(x.n); });
    order.sort(function (a, b) { return ORDER.indexOf(a) - ORDER.indexOf(b); });
    var conn = h('div', { class: 'bp-conn' }, order.map(function (t) {
      return h('div', null, [h('p', { class: 'bp-ct', text: T[t].label + ' · ' + groups[t].length }), h('div', { class: 'bp-chips' }, groups[t].map(function (m) {
        var b = h('button', { class: 'chip sm', type: 'button', on: { click: function () { select(m); }, mouseenter: function () { hover = m; }, mouseleave: function () { hover = null; } } },
          [h('i', { class: 'bp-dot', style: 'background:' + T[m.type].c }), h('span', m.ar ? { ar: true, text: m.label } : { text: m.label })]);
        return b;
      }))]);
    }));
    panelEl.textContent = '';
    panelEl.appendChild(h('button', { class: 'bp-x', type: 'button', 'aria-label': 'Close panel', text: '✕', on: { click: function () { select(null); } } }));
    panelEl.appendChild(h('p', { class: 'eyebrow' }, [h('i', { class: 'bp-dot', style: 'background:' + T[n.type].c + ';margin:0 8px 0 0' }), T[n.type].label.replace(/s$/, '').replace(/ie$/, 'y')]));
    panelEl.appendChild(n.ar ? h('h3', { ar: true, text: n.label }) : h('h3', { text: n.data && n.data.title ? n.data.title.split(' · Coming soon')[0] : n.label }));
    if (n.sub) panelEl.appendChild(h('p', { class: 'bp-ar', ar: true, text: n.sub }));
    body.forEach(function (b) { panelEl.appendChild(b); });
    panelEl.appendChild(h('p', { class: 'eyebrow', style: 'margin-top:20px', text: 'Connected · ' + n.nb.length }));
    panelEl.appendChild(conn);
    if (n.to) panelEl.appendChild(h('a', { class: 'chip bp-go', href: '#' + n.to }, ['Go to section', h('b', { text: '›' })]));
    panelEl.scrollTop = 0;
  }

  /* ---------- build ---------- */
  function init(section) {
    sec = section;
    buildGraph(); layout(); makeSprites();
    nodes.sort(function (a, b) { return b.r - a.r; });
    cv = h('canvas', { class: 'brain-cv', tabindex: '0', role: 'application', 'aria-label': 'Campaign network. Arrow keys move between nodes, plus and minus zoom, zero resets.' });
    ctx = cv.getContext('2d');
    var counts = {}; nodes.forEach(function (n) { counts[n.type] = (counts[n.type] || 0) + 1; });
    var filters = h('div', { class: 'brain-filters' }, ORDER.filter(function (t) { return t !== 'core'; }).map(function (t) {
      var b = h('button', { class: 'chip sm', type: 'button', 'aria-pressed': 'true', on: { click: function () {
        off[t] = !off[t]; b.setAttribute('aria-pressed', off[t] ? 'false' : 'true');
        if (sel && off[sel.type]) select(null);
      } } }, [h('i', { class: 'bp-dot', style: 'background:' + T[t].c + (T[t].hollow ? ';box-shadow:0 0 0 2px #1E130B inset,0 0 0 1px ' + T[t].c : '') }), T[t].label, h('b', { text: counts[t] })]);
      filterBtns[t] = b; return b;
    }));
    exploreBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', on: { click: function () { setExplore(!explore); if (explore) cv.focus({ preventScroll: true }); } } }, [h('b', { text: '⌖' }), 'Explore']);
    var tools = h('div', { class: 'brain-tools' }, [
      exploreBtn,
      h('button', { class: 'chip', type: 'button', 'aria-label': 'Zoom in', text: '+', on: { click: function () { zoomAt(W / 2, H / 2, 1.35); } } }),
      h('button', { class: 'chip', type: 'button', 'aria-label': 'Zoom out', text: '−', on: { click: function () { zoomAt(W / 2, H / 2, 1 / 1.35); } } }),
      h('button', { class: 'chip', type: 'button', text: 'Reset', on: { click: function () { ORDER.forEach(function (t) { off[t] = false; if (filterBtns[t]) filterBtns[t].setAttribute('aria-pressed', 'true'); }); reset(); } } })
    ]);
    hudEl = h('span', { class: 'brain-stat', text: nodes.length + ' nodes · ' + edges.length + ' links' });
    panelEl = h('aside', { class: 'brain-panel glass glass-dark', 'aria-hidden': 'true', 'aria-label': 'Node details' });
    sec.appendChild(h('div', { class: 'brain-bg' }, A.img(S.kvById('lawyer').scene, '')));
    sec.appendChild(cv);
    sec.appendChild(h('div', { class: 'brain-head' }, [
      A.eyebrow('02', 'The campaign network'),
      h('h2', { class: 'sec-title rv', style: '--d:.08s' }, ['One campaign, ', h('b', { text: 'every connection.' })]),
      filters]));
    sec.appendChild(tools);
    sec.appendChild(h('div', { class: 'brain-hud' }, [hudEl, h('span', { class: 'brain-hint', text: 'Click a node · drag to pan · Ctrl/⌘ + scroll or Explore to zoom' })]));
    sec.appendChild(panelEl);
    sec.setAttribute('data-nodes', nodes.length); sec.setAttribute('data-edges', edges.length);
    resize(); bind();
    var m = /[?&]node=([^&#]+)/.exec(location.search);
    if (m && byId[decodeURIComponent(m[1])]) { select(byId[decodeURIComponent(m[1])]); cam.x = cam.tx; cam.y = cam.ty; cam.s = cam.ts; }
    if (A.STATIC) { loadImages(); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { nodes.forEach(function (n) { n.tw = null; }); });
  }
  return { init: init, select: function (id) { select(byId[id] || null); }, stats: function () { return { cam: cam.s, camT: cam.ts, fit: fit, explore: explore, sel: sel ? sel.id : null, fps: stat.fps, minFps: stat.minFps, drawMs: stat.ms, nodes: nodes.length, edges: edges.length }; }, nodes: nodes, edges: edges };
})();
