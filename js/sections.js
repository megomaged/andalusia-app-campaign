/* Section builders. Every word of campaign content comes from window.CAMPAIGN. */
var SECTIONS = (function () {
  'use strict';
  var A = APP, C = A.C, h = A.h, img = A.img, qs = A.qs, qsa = A.qsa, pad2 = A.pad2;
  var PHASE_COLORS = ['#D6B27A', '#E8743B', '#3E8E68', '#F4E8D2'];
  var phaseColor = {};
  C.phases.forEach(function (p, i) { phaseColor[p.phase] = PHASE_COLORS[i % PHASE_COLORS.length]; });
  function postOfHero(hero) { return C.posts.filter(function (p) { return p.title === hero.title; })[0]; }
  function kvById(id) { return C.kvs.filter(function (k) { return k.id === id; })[0]; }
  function castSrc(id) { return 'assets/cast/' + id + '.webp'; }
  function castFrame(id, cls) { return h('span', { class: 'cast-ph ' + (cls || '') }, img(castSrc(id), A.castName(id))); }
  /* video structure: 2 main copies + 4 tactical videos (tier comes from the data) */
  var NUMW = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  function tierOf(id) { var k = kvById(id); return k && k.tier ? k.tier : ''; }
  function hasScript(id) { return !!A.heroByKv[id]; }
  function tierLabel(id, long) { var t = tierOf(id); return !t ? '' : (t === 'main' ? 'Main copy' : 'Tactical video') + (long && t === 'main' && !hasScript(id) ? ' · in production' : ''); }
  function tierTag(id, long, cls) { var t = tierOf(id); return t ? h('span', { class: 'chip sm tier ' + t + (cls ? ' ' + cls : ''), 'data-tier': t, text: tierLabel(id, long) }) : null; }
  function vidById(id) { return C.videos.filter(function (v) { return v.id === id; })[0]; }
  function storyFilm(kv) { return C.videos.filter(function (v) { return v.group === 'story' && v.kv === kv; })[0]; }
  function lbBtn(el, items, i) { el.addEventListener('click', function () { A.lightbox(typeof items === 'function' ? items() : items, typeof i === 'function' ? i() : i); }); return el; }

  /* ---------- 1 hero ---------- */
  function hero(s) {
    var f = C.facts, bg = h('div', { class: 'hero-bg', 'data-speed': '0.34', 'data-depth': '-0.5' });
    var order = ['teacher', 'mom', 'businessman', 'lawyer', 'employee', 'goalkeeper'];
    var scenes = order.map(function (id, i) {
      var im = h('img', { alt: '', decoding: 'async', class: i === 0 ? 'on' : '' });
      if (i === 0) im.src = kvById(id).scene; else im.setAttribute('data-src', kvById(id).scene);
      bg.appendChild(im); return im;
    });
    var dust = h('div', { class: 'hero-dust', 'data-speed': '-0.3', 'data-depth': '2.4' });
    for (var i = 0; i < 16; i++) {
      var r = function (n) { var x = Math.sin((i + 1) * n) * 43758.5453; return x - Math.floor(x); };
      dust.appendChild(h('i', { style: 'left:' + (r(12.9) * 100).toFixed(1) + '%;top:' + (r(78.2) * 100).toFixed(1) + '%;width:' + (3 + r(3.3) * 7).toFixed(1) + 'px;height:' + (3 + r(3.3) * 7).toFixed(1) + 'px;opacity:' + (0.2 + r(5.1) * 0.5).toFixed(2) + ';animation-delay:-' + (r(9.7) * 9).toFixed(1) + 's' }));
    }
    var chips = [
      [A.fmtDate(f.start).split(' ')[0] + ' — ' + A.fmtDate(f.end, true), null],
      [f.days, 'days'], [f.platforms.join(' · '), null],
      [f.volume.feed_posts, 'feed posts'], [f.volume.stories, 'stories'], [f.volume.main_copies, 'main copies'], [f.volume.tactical_videos, 'tactical videos']
    ].map(function (c, i) {
      return h('span', { class: 'chip rv', style: '--d:' + (0.5 + i * 0.07) + 's' }, c[1] ? [h('b', { text: c[0] }), c[1]] : [h('b', { text: c[0] })]);
    });
    s.appendChild(bg);
    s.appendChild(h('div', { class: 'hero-shade' }));
    s.appendChild(h('div', { class: 'hero-orbs', 'data-speed': '0.2', 'data-depth': '0.8' }, [h('i'), h('i'), h('i')]));
    s.appendChild(h('div', { class: 'hero-mid' }, [
      h('p', { class: 'eyebrow rv', 'data-depth': '0.6' }, [f.name, h('i', { text: '—' }), 'Campaign presentation']),
      h('div', { class: 'hero-lock rv-s', style: '--d:.15s' }, h('div', { 'data-speed': '0.08', 'data-depth': '1.5' }, img('assets/el/lockup.webp', f.slogan + ' — ' + f.sub, true))),
      h('div', { class: 'rv', style: '--d:.4s' }, h('div', { 'data-speed': '-0.03', 'data-depth': '2' }, img('assets/el/cta.webp', f.cta, true, 'hero-cta')))
    ]));
    s.appendChild(dust);
    s.appendChild(h('div', { class: 'hero-chips', 'data-speed': '-0.14', 'data-depth': '1.1' }, chips));
    s.appendChild(h('a', { class: 'cue', href: '#idea' }, ['Scroll', h('i')]));
    if (!A.STATIC && !A.CALM) {
      var cur = 0;
      window.addEventListener('load', function () {
        setTimeout(function () { scenes.forEach(function (im) { var d = im.getAttribute('data-src'); if (d) im.src = d; }); }, 900);
        setInterval(function () {
          if (document.hidden || window.pageYOffset > innerHeight) return;
          var nx = (cur + 1) % scenes.length;
          if (!scenes[nx].complete || !scenes[nx].naturalWidth) return;
          scenes[cur].classList.remove('on'); scenes[nx].classList.add('on'); cur = nx;
        }, 6000);
      });
    }
  }

  /* ---------- 2 idea ---------- */
  function splitScript(lines) {
    var q = 0, a = lines.length - 3, i;
    for (i = 0; i < lines.length; i++) if (lines[i].indexOf('وليه') === 0) { q = i; break; }
    for (i = 0; i < lines.length; i++) if (lines[i].indexOf('ابلكيشن اندلسية') === 0) { a = i; break; }
    return [lines.slice(0, q), lines.slice(q, q + 1), lines.slice(q + 1, a), lines.slice(a)];
  }
  function idea(s) {
    var f = C.facts, bd = h('div', { class: 'backdrop' });
    var bimgs = C.heroes.map(function (x, i) { var im = img(kvById(x.kv).scene, ''); im.setAttribute('data-speed', '0.1'); if (i === 0) im.className = 'on'; bd.appendChild(im); return im; });
    var labels = ['The day goes wrong', 'The question', 'The app', 'The line'], cls = ['', 'q', 'app', 'end'];
    var boxes = [], tabs = [];
    var steps = h('div', { class: 'idea-steps' }, labels.map(function (l, i) {
      var box = h('div', { class: 'step-lines', ar: true }); boxes.push(box);
      return h('div', { class: 'step glass rv ' + cls[i], style: '--d:' + (i * 0.1) + 's' }, [
        h('div', { class: 'step-top' }, [h('span', { class: 'step-n', text: pad2(i + 1) }), h('span', { class: 'step-l', text: l })]), box]);
    }));
    function show(k) {
      var parts = splitScript(C.heroes[k].script);
      boxes.forEach(function (b, i) { b.textContent = ''; parts[i].forEach(function (t) { b.appendChild(h('p', { text: t })); }); });
      tabs.forEach(function (t, i) { t.setAttribute('aria-pressed', i === k ? 'true' : 'false'); });
      bimgs.forEach(function (im, i) { im.classList.toggle('on', i === k); });
    }
    var tabRow = h('div', { class: 'idea-tabs rv', style: '--d:.1s' }, C.heroes.map(function (x, i) {
      var b = h('button', { class: 'chip', type: 'button', on: { click: function () { show(i); } } }, [h('span', { class: 'cast-ph round' }, img(castSrc(x.kv), '')), x.title]);
      tabs.push(b); return b;
    }));
    s.appendChild(bd);
    s.appendChild(h('div', { class: 'wrap' }, [
      h('p', { class: 'eyebrow c rv' }, ['01', h('i', { text: '—' }), 'The idea']),
      h('h2', { class: 'idea-slogan rv-s', ar: true, text: f.slogan }),
      h('p', { class: 'idea-sub rv', ar: true, style: '--d:.2s', text: f.sub }),
      h('div', { class: 'idea-how', id: 'idea-how' }, [
        h('div', { class: 'idea-how-head' }, [
          h('div', null, [h('p', { class: 'eyebrow rv', text: 'How every story works' }), h('h3', { class: 'rv', style: '--d:.06s', text: 'Four beats, in the heroes’ own lines.' })]),
          tabRow]),
        steps])
    ]));
    show(0);
  }

  /* ---------- 4 main copies (top of the stories section) ---------- */
  function mcStatus(m) { return 'Main copy · ' + String(m.status || '').replace(' keyframes', ''); }
  function mainCopies(s) {
    var list = C.main_copies || [];
    if (!list.length) return;
    var cards = list.map(function (m, ci) {
      var tag = h('span', { class: 'chip sm tier main', 'data-tier': 'main', text: mcStatus(m) }), pic, body = [], extra = null;
      if (m.kind === 'film' && m.frames && m.frames.length) {
        var fitems = m.frames.map(function (src, i) { return { src: src, cap: m.title + ' · frame ' + (i + 1) }; });
        var cur = 0, imgs = m.frames.map(function (src, i) { var im = img(src, fitems[i].cap); if (i === 0) im.className = 'on'; return im; }), thumbs = [];
        var count = h('span', { class: 'mc-count', text: '01 / ' + pad2(m.frames.length) });
        var show = function (i) {
          cur = (i + imgs.length) % imgs.length;
          imgs.forEach(function (im, j) { im.classList.toggle('on', j === cur); });
          thumbs.forEach(function (t, j) { t.setAttribute('aria-pressed', j === cur ? 'true' : 'false'); });
          count.textContent = pad2(cur + 1) + ' / ' + pad2(imgs.length);
        };
        var mv = m.video ? vidById(m.video) : null;
        pic = h('button', { class: 'mc-pic mc-frames' + (mv ? ' mc-play' : ''), type: 'button', 'data-video': mv ? mv.id : null, 'aria-label': (mv ? 'Play ' : 'Open frames of ') + m.title }, imgs.concat([count, mv ? h('span', { class: 'film-play glass' }) : null]));
        if (mv) pic.addEventListener('click', function () { A.player(mv); }); else lbBtn(pic, fitems, function () { return cur; });
        var hold = false;
        extra = h('div', { class: 'mc-strip' }, m.frames.map(function (src, i) {
          var t = h('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', 'aria-label': 'Frame ' + (i + 1), on: { click: function () { hold = true; show(i); } } }, img(src, ''));
          thumbs.push(t); return t;
        }));
        if (!A.STATIC && !A.CALM) setInterval(function () {
          if (hold || document.hidden) return;
          var b = pic.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return;
          show(cur + 1);
        }, 2600);
        body = [h('h3', null, [m.title, m.title_ar ? h('span', { ar: true, text: m.title_ar }) : null]),
          h('div', { class: 'mc-meta' }, [tag, m.option ? h('span', { class: 'chip sm ember', text: m.option }) : null, m.length ? h('span', { class: 'chip sm', text: m.length }) : null]),
          h('p', { class: 'mc-log', text: m.logline }), m.endline ? h('p', { class: 'mc-end', ar: true, text: m.endline }) : null];
      } else {
        var k = kvById(m.id), one = [{ src: k.kv, cap: m.title + ' · ' + A.clean(k.headline) }];
        pic = lbBtn(h('button', { class: 'mc-pic', type: 'button', 'aria-label': 'Open key visual of ' + m.title }, img(k.kv, A.clean(k.headline))), one, 0);
        body = [h('h3', null, [m.title, h('span', { ar: true, text: A.clean(k.headline) })]),
          h('div', { class: 'mc-meta' }, [tag, h('span', { class: 'chip sm', text: 'Key visual ready' })]),
          h('div', { class: 'mc-duo' }, [castFrame(m.id), castFrame('coach'), h('p', { class: 'mc-log', text: 'The goalkeeper and his coach.' })])];
      }
      return h('article', { class: 'mc glass glass-dark rv', style: '--d:' + (ci * 0.1) + 's', 'data-main': m.id }, [pic, extra, h('div', { class: 'mc-body' }, body)]);
    });
    s.appendChild(h('div', { class: 'wrap mcs', id: 'main-copies' }, [
      h('p', { class: 'eyebrow rv' }, ['Main copies', h('i', { text: '·' }), list.length]),
      h('div', { class: 'mc-grid' }, cards),
      h('p', { class: 'eyebrow rv mc-next' }, ['Tactical videos', h('i', { text: '·' }), C.facts.volume.tactical_videos])]));
  }

  /* ---------- 4 stories (+ cast) ---------- */
  var storyEls = [];
  function stories(s) {
    var vol = C.facts.volume, nv = vol.main_copies + vol.tactical_videos;
    s.appendChild(A.secHead('03', 'The videos', [(NUMW[nv] || nv) + ' videos, ', h('b', { text: 'one question.' })], vol.main_copies + ' main copies and ' + vol.tactical_videos + ' tactical videos.'));
    /* cast: the seven faces */
    var ids = C.kvs.map(function (k) { return k.id; });
    var singles = ids.filter(function (id) { return id !== 'goalkeeper'; });
    function card(id, i, sub, subAr) {
      return h('figure', { class: 'cast-card rv', style: '--d:' + (i * 0.07) + 's', 'data-cast': id, 'data-tier': tierOf(id) || null }, [
        h('div', { 'data-speed': (i % 2 ? '0.05' : '-0.04') }, castFrame(id)),
        h('figcaption', null, [tierTag(id), h('b', { text: A.castShort(id) }), subAr ? h('span', { ar: true, text: subAr }) : h('span', { text: sub || '' })])
      ]);
    }
    var row = h('div', { class: 'cast-row' }, singles.map(function (id, i) { var x = A.heroByKv[id]; return card(id, i, '', x && x.title_ar); }));
    row.appendChild(h('div', { class: 'cast-pair' }, [card('goalkeeper', 5, 'In production'), card('coach', 6, 'With the goalkeeper')]));
    mainCopies(s);
    s.appendChild(h('div', { class: 'wrap cast', id: 'cast' }, [h('p', { class: 'eyebrow rv', text: 'The cast' }), row]));

    C.heroes.forEach(function (x, i) {
      var post = postOfHero(x) || {}, kv = kvById(x.kv), n = x.script.length, sf = storyFilm(x.kv);
      var lines = x.script.map(function (t, j) {
        var c = j >= n - 3 ? 'sl' : (t.indexOf('وليه') === 0 ? 'qq' : '');
        return h('li', { class: c, text: t });
      });
      var bg = h('div', { class: 'story-bg' }, img(kv.scene, ''));
      var num = h('div', { class: 'story-num', text: pad2(x.n), 'aria-hidden': 'true' });
      var prog = h('i');
      var art = h('article', { class: 'story', id: 'story-' + x.kv, 'data-hero': x.n, style: '--n:' + n }, h('div', { class: 'story-pin' }, [
        bg, h('div', { class: 'story-shade' }), num,
        h('div', { class: 'story-card glass glass-dark' }, [
          h('div', { class: 'story-cast' }, castFrame(x.kv, 'fill')),
          h('p', { class: 'eyebrow' }, ['Story ' + pad2(x.n) + ' / ' + pad2(C.heroes.length), h('i', { text: '·' }), A.fmtDate(x.date) + ' ' + A.dayName(x.date)]),
          h('h3', { text: x.title }),
          h('p', { class: 'story-tag', ar: true, text: x.title_ar }),
          h('div', { class: 'story-meta' }, [
            tierTag(x.kv),
            h('span', { class: 'chip sm green', ar: true, text: x.feature }),
            post.meta_time ? h('span', { class: 'chip sm' }, ['Meta ', h('b', { text: post.meta_time })]) : null,
            post.tiktok_time ? h('span', { class: 'chip sm' }, ['TikTok ', h('b', { text: post.tiktok_time })]) : null,
            post.campaign_type ? h('span', { class: 'chip sm', text: post.campaign_type }) : null
          ]),
          sf ? h('button', { class: 'story-watch', type: 'button', 'data-video': sf.id, on: { click: function () { A.player(sf); } } }, [h('i'), 'Watch the film']) : null,
          h('ol', { class: 'script', ar: true }, lines)
        ]),
        h('div', { class: 'story-prog' }, prog)
      ]));
      s.appendChild(art);
      storyEls.push({ el: art, lines: lines, bg: bg, num: num, prog: prog, k: -1 });
    });
    /* the goalkeeper: a main copy whose script is not in the data yet, so he is shown with his key visual */
    var g = kvById('goalkeeper');
    var fig = h('figure', { class: 'rv-s' }, img(g.kv, A.clean(g.headline)));
    lbBtn(fig, [{ src: g.kv, cap: A.clean(g.headline) }], 0);
    s.appendChild(h('div', { class: 'kv6', id: 'kv6' }, [A.backdrop(g.scene, '0.1'), h('div', { class: 'kv6-in' }, [
      h('div', { class: 'kv6-txt' }, [
        h('p', { class: 'eyebrow rv', text: 'Sixth key visual' }),
        h('h3', { class: 'rv', style: '--d:.06s', text: 'The goalkeeper and his coach.' }),
        h('p', { class: 'rv', style: '--d:.12s' }, tierTag(g.id, true)),
        h('div', { class: 'rv', style: '--d:.18s' }, img(g.headline_img, A.clean(g.headline)))
      ]), fig])]));

    A.onFrame(function (sy, vh) {
      if (A.STATIC) return;
      for (var i = 0; i < storyEls.length; i++) {
        var st = storyEls[i], b = st.el.getBoundingClientRect();
        if (b.bottom < -50 || b.top > vh + 50) continue;
        var p = A.clamp(-b.top / Math.max(1, b.height - vh), 0, 1);
        var k = A.CALM ? st.lines.length : Math.min(st.lines.length, Math.floor(p / 0.86 * st.lines.length + 0.35));
        if (k !== st.k) {
          st.k = k;
          for (var j = 0; j < st.lines.length; j++) { st.lines[j].classList.toggle('on', j < k); st.lines[j].classList.toggle('now', j === k - 1); }
        }
        if (!A.CALM) {
          st.bg.style.transform = 'scale(' + (1.1 - p * 0.07).toFixed(4) + ') translate3d(' + (p * -1.6).toFixed(2) + '%,0,0)';
          st.num.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0)';
        }
        st.prog.style.transform = 'scaleY(' + p.toFixed(3) + ')';
      }
    });
  }

  /* ---------- 5 key visuals ---------- */
  function visuals(s) {
    var items = C.kvs.map(function (k) { return { src: k.kv, cap: A.castName(k.id) + ' · ' + A.clean(k.headline) }; });
    var count = h('b', { text: '01' });
    var track = h('div', { class: 'kvx-track' }, C.kvs.map(function (k, i) {
      var b = h('button', { type: 'button', 'aria-label': 'Open key visual ' + (i + 1) }, img(k.kv, A.clean(k.headline)));
      lbBtn(b, items, i);
      return h('div', { class: 'kv-slide', 'data-kv': k.id }, [b, h('div', { class: 'kv-cap' }, [
        h('div', { class: 'l' }, [h('span', { class: 'n', text: pad2(i + 1) }), h('span', { class: 't', text: A.castName(k.id) }), tierTag(k.id, true)]),
        h('span', { class: 'h', ar: true, text: A.clean(k.headline) })])]);
    }));
    var head = h('div', { class: 'sec-head' }, [
      h('div', null, [A.eyebrow('04', 'Key visuals'), h('h2', { class: 'sec-title rv', style: '--d:.08s' }, ['Six scenes, ', h('b', { text: 'one lockup.' })])]),
      h('div', { class: 'kvx-count rv' }, [count, ' / ' + pad2(C.kvs.length)])]);
    var wrap = h('div', { class: 'kvx' }, h('div', { class: 'kvx-pin' }, [head, track]));
    s.appendChild(wrap);
    var last = -1;
    A.onFrame(function (sy, vh, vw) {
      if (A.STATIC || vw < 861) return;
      var b = wrap.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      var p = A.clamp(-b.top / Math.max(1, b.height - vh), 0, 1);
      var max = Math.max(0, track.scrollWidth - vw);
      track.style.transform = 'translate3d(' + (-max * p).toFixed(1) + 'px,0,0)';
      var i = Math.min(C.kvs.length - 1, Math.round(p * (C.kvs.length - 1)));
      if (i !== last) { last = i; count.textContent = pad2(i + 1); }
    });
  }

  /* ---------- 6 the new app design ---------- */
  /* screens of features that are not in the app yet (same five as the "feature_soon" films) */
  var RD_SOON = { ai_assistant: 1, feel_checkin: 1, pregnancy: 1, derma_capture: 1, derma_scan: 1 };
  function rdFilm() { var R = C.redesign; return R ? C.videos.filter(function (v) { return v.id === R.film; })[0] : null; }
  /* cover for the film, composed from the new screens: the film's own poster frame still shows the old app */
  function rdCover(par) {
    var scr = C.redesign.screens, by = {};
    scr.forEach(function (x) { by[x.id] = x; });
    var pick = [by.book_doctor || scr[1], by.home || scr[0], by.results || scr[2]], sp = ['0.05', '-0.04', '0.07'];
    return h('span', { class: 'rd-cover', 'aria-hidden': 'true' }, [h('i'), h('i')].concat(pick.map(function (x, i) {
      return h('span', { class: 'rd-cp rd-cp' + i, 'data-speed': par ? sp[i] : null }, img(x.src, ''));
    })));
  }
  function redesign(s) {
    var R = C.redesign, film = rdFilm();
    if (!R || !R.screens || !R.screens.length) { s.hidden = true; return; }
    var scr = R.screens, nSoon = scr.filter(function (x) { return RD_SOON[x.id]; }).length;
    var items = scr.map(function (x) { return { src: x.src, cap: x.title + (RD_SOON[x.id] ? ' · Coming soon' : '') }; });
    var parts = film ? film.title.split(' · ') : [], secs = parseInt(parts[1], 10);
    s.appendChild(h('div', { class: 'rd-glow', 'aria-hidden': 'true' }, [h('i'), h('i'), h('i')]));
    s.appendChild(A.secHead('05', 'New design', ['The app, ', h('b', { text: 'redesigned.' })],
      (film && secs ? 'A ' + secs + '-second film and ' : '') + scr.length + ' screens of the new design.'));
    /* the film */
    var stage = null;
    if (film) {
      stage = h('div', { class: 'rd-stage glass' }, h('button', { class: 'rd-film', type: 'button', 'data-video': film.id, 'aria-label': 'Play ' + film.title, on: { click: function () { A.player(film); } } }, [
        rdCover(true),
        h('span', { class: 'rd-film-txt' }, [
          h('span', { class: 'rd-play' }),
          h('small', null, ['The film', h('i', { text: '·' }), secs ? secs + ' s' : '', h('i', { text: '·' }), 'Sound on']),
          h('b', { text: parts[0] })])
      ]));
      s.appendChild(h('div', { class: 'wrap rd-top' }, h('div', { class: 'rv-s' }, stage)));
    }
    /* the screens: a pinned, tilted wall of phones; columns travel in opposite directions with the scroll */
    var NC = 4, cols = [], prog = h('i');
    for (var c = 0; c < NC; c++) cols.push(h('div', { class: 'rdx-col' }));
    scr.forEach(function (x, i) {
      var soon = !!RD_SOON[x.id];
      var b = h('button', { class: 'rd-phone' + (soon ? ' soon' : ''), type: 'button', 'data-screen': x.id, 'aria-label': 'Open screen: ' + items[i].cap }, [
        h('span', { class: 'rd-fr' }, img(x.src, x.title)),
        h('span', { class: 'rd-cap' }, [h('span', { class: 'n', text: pad2(i + 1) }), h('span', { class: 't', text: x.title }), soon ? h('span', { class: 'chip sm ember', text: 'Coming soon' }) : null])]);
      lbBtn(b, items, i);
      cols[i % NC].appendChild(b);
    });
    var wall = h('div', { class: 'rdx-wall' }, cols);
    var side = h('div', { class: 'rdx-side' }, [
      h('p', { class: 'eyebrow rv', text: 'The screens' }),
      h('div', { class: 'rdx-n rv', style: '--d:.06s' }, [h('b', { text: scr.length }), h('span', { text: 'screens' })]),
      nSoon ? h('p', { class: 'rdx-note rv', style: '--d:.12s' }, [h('span', { class: 'chip sm ember', text: 'Coming soon' }), nSoon + ' of them show features that are not in the app yet.']) : null,
      h('p', { class: 'rdx-hint rv', style: '--d:.18s', text: 'Select a screen to enlarge it' }),
      h('div', { class: 'rdx-prog' }, prog)]);
    var pin = h('div', { class: 'rdx-pin' }, [wall, h('div', { class: 'rdx-shade' }), side]);
    var wrap = h('div', { class: 'rdx', id: 'redesign-screens' }, pin);
    s.appendChild(wrap);

    var mode = '';
    function clear() { wall.style.transform = ''; cols.forEach(function (c) { c.style.transform = ''; }); }
    A.onFrame(function (sy, vh, vw) {
      var b, p, i;
      if (stage && !A.STATIC && !A.CALM) {
        b = stage.getBoundingClientRect();
        if (b.bottom > -100 && b.top < vh + 100) {
          p = A.clamp((vh - b.top) / (vh * 0.85), 0, 1); p = 1 - Math.pow(1 - p, 3);
          stage.style.transform = 'perspective(1800px) rotateX(' + ((1 - p) * 14).toFixed(2) + 'deg) scale(' + (0.86 + p * 0.14).toFixed(4) + ')';
        }
      }
      var m = vw < 861 ? 'm' : 'd';
      if (m !== mode) { mode = m; clear(); }
      b = wrap.getBoundingClientRect();
      if (!A.STATIC && (b.bottom < -200 || b.top > vh + 200)) return;
      if (m === 'm') {
        if (A.STATIC || A.CALM) return;
        var q = A.clamp((b.top + b.height / 2 - vh / 2) / vh, -4, 4);
        for (i = 0; i < cols.length; i++) cols[i].style.transform = 'translate3d(0,' + (q * (i % 2 ? 16 : -16)).toFixed(1) + 'px,0)';
        return;
      }
      p = A.STATIC ? 0.5 : A.CALM ? 0.5 : A.clamp(-b.top / Math.max(1, b.height - vh), 0, 1);
      var ph = pin.clientHeight || vh;
      wall.style.transform = 'rotateX(' + (22 - p * 10).toFixed(2) + 'deg) rotateY(' + (20 - p * 9).toFixed(2) + 'deg) rotateZ(' + (-7 + p * 4).toFixed(2) + 'deg)';
      for (i = 0; i < cols.length; i++) {
        var ch = cols[i].offsetHeight, top = ph * 0.2, bot = ph * 0.86 - ch, y = i % 2 ? bot + (top - bot) * p : top + (bot - top) * p;
        cols[i].style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      }
      prog.style.transform = 'scaleY(' + p.toFixed(3) + ')';
    });
  }

  /* ---------- 7 calendar ---------- */
  function calendar(s) {
    var f = C.facts, days = [], d = A.parseDate(f.start), end = A.parseDate(f.end);
    while (d <= end) { days.push(A.iso(d)); d = new Date(d.getTime() + 864e5); }
    var postsBy = {}, storyBy = {};
    C.posts.forEach(function (p) { (postsBy[p.date] = postsBy[p.date] || []).push(p); });
    C.stories.forEach(function (x) { storyBy[x.date] = x; });
    function phasesOn(day) { return C.phases.filter(function (p) { return p.from <= day && day <= p.to; }); }
    var dayBtns = {}, panes = {}, phaseBtns = [], selPhase = null;

    var phases = h('div', { class: 'phases' }, C.phases.map(function (p, i) {
      var b = h('button', { class: 'phase glass rv', type: 'button', 'aria-pressed': 'false', style: '--pc:' + phaseColor[p.phase] + ';--w:' + p.weight + ';--d:' + (i * 0.08) + 's' }, [
        h('div', { class: 'phase-top' }, [h('span', { class: 'phase-name', text: p.phase }), h('span', { class: 'phase-w', text: Math.round(p.weight * 100) + '%' })]),
        h('div', { class: 'phase-d', text: A.fmtDate(p.from) + ' — ' + A.fmtDate(p.to) + ' · ' + p.posts + ' posts' }),
        h('div', { class: 'phase-topic', dir: 'auto', lang: 'ar', text: p.topic }),
        h('div', { class: 'phase-goal', ar: true, text: p.goal }),
        h('div', { class: 'phase-bar' }, h('i'))
      ]);
      b.addEventListener('click', function () {
        selPhase = selPhase === p ? null : p;
        phaseBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', C.phases[j] === selPhase ? 'true' : 'false'); });
        days.forEach(function (dy) { dayBtns[dy].classList.toggle('dimmed', !!selPhase && !(selPhase.from <= dy && dy <= selPhase.to)); });
      });
      phaseBtns.push(b); return b;
    }));

    var grid = h('div', { class: 'cal-grid glass rv' });
    for (var w = 0; w < days.length; w += 7) {
      var rowEl = h('div', { class: 'cal-wk' }, h('span', { class: 'cal-wkl', text: 'Week ' + (w / 7 + 1) }));
      days.slice(w, w + 7).forEach(function (day) {
        var ps = postsBy[day] || [], st = storyBy[day], fr = st ? st.frames : [];
        var b = h('button', { class: 'day', type: 'button', 'aria-pressed': 'false', 'data-day': day, 'aria-label': A.fmtDate(day) }, [
          h('span', { class: 'day-top' }, [h('span', { class: 'day-n', text: A.parseDate(day).getUTCDate() }), h('span', { class: 'day-w', text: A.dayName(day) })]),
          h('span', { class: 'day-posts' }, ps.map(function (p) { return h('span', { class: 'cal-post', 'data-post': p.n, style: '--pc:' + phaseColor[p.phase], text: p.title }); })),
          h('span', { class: 'day-st' }, fr.map(function () { return h('i'); })),
          h('span', { class: 'day-bands' }, phasesOn(day).map(function (p) { return h('i', { style: '--pc:' + phaseColor[p.phase] }); }))
        ]);
        b.addEventListener('click', function () { select(day); });
        dayBtns[day] = b; rowEl.appendChild(b);
      });
      grid.appendChild(rowEl);
    }
    var side = h('div', { class: 'cal-side glass rv', style: '--d:.1s', 'aria-live': 'polite' });
    days.forEach(function (day) {
      var ps = postsBy[day] || [], st = storyBy[day];
      var pane = h('div', { class: 'dd', 'data-pane': day }, [
        h('p', { class: 'eyebrow', text: 'Selected day' }),
        h('div', { class: 'dd-date' }, [h('b', { text: A.parseDate(day).getUTCDate() }), h('span', { text: A.dayName(day) + ' · ' + A.fmtDate(day, true).split(' ').slice(1).join(' ') })]),
        h('div', { class: 'dd-tags' }, [st ? h('span', { class: 'chip sm', text: st.day_type }) : null].concat(phasesOn(day).map(function (p) {
          return h('span', { class: 'chip sm', style: 'border-color:' + phaseColor[p.phase], text: p.phase });
        }))),
        h('h4', { text: ps.length > 1 ? 'Posts' : 'Post' }),
        ps.length ? h('div', null, ps.map(function (p) {
          function row(k, v, ar) { return v && v !== 'NA' ? [h('dt', { text: k }), ar ? h('dd', { ar: true, text: v }) : h('dd', { text: v })] : []; }
          var rows = [].concat(row('Format', p.format), row('Type', p.type), row('Meta', p.meta_time), row('TikTok', p.tiktok_time), row('CTA', p.cta, true),
            row('Campaign', p.campaign_type), row('Daily budget', p.budget_daily), row('Feature', p.feature !== '—' ? p.feature : null, true));
          return h('div', { class: 'dpost', style: '--pc:' + phaseColor[p.phase] }, [
            h('div', { class: 'dpost-t' }, [h('span', { text: p.title }), p.title_ar ? h('span', { ar: true, text: p.title_ar }) : null]),
            h('p', { class: 'dpost-c', ar: true, text: p.concept }),
            h('dl', { class: 'kvl' }, rows)
          ]);
        })) : h('p', { class: 'dd-none', text: 'No feed post on this day.' }),
        h('h4', { text: 'Stories' + (st ? ' · ' + st.frames.length : '') }),
        st ? h('div', null, st.frames.map(function (fr) {
          return h('div', { class: 'frame', 'data-frame': '1' }, [h('p', { ar: true, text: fr.text }), h('time', { text: fr.time })]);
        })) : h('p', { class: 'dd-none', text: 'No story in the plan for this day.' })
      ]);
      panes[day] = pane; side.appendChild(pane);
    });
    function select(day) {
      days.forEach(function (x) { dayBtns[x].setAttribute('aria-pressed', x === day ? 'true' : 'false'); panes[x].classList.toggle('on', x === day); });
    }
    var first = C.heroes[0] ? C.heroes[0].date : days[0];
    select(first);

    var open = h('button', { class: 'chip', type: 'button', on: { click: function () { A.drawer(true); } } }, ['Story rules & best posting times', h('b', { text: '+' })]);
    s.appendChild(A.backdrop(kvById('employee').scene, '0.1'));
    s.appendChild(A.secHead('06', 'Calendar', [f.days + ' days, ', h('b', { text: 'day by day.' })], f.timezone));
    s.appendChild(h('div', { class: 'wrap' }, [phases, h('div', { class: 'cal' }, [
      h('div', null, [grid, h('div', { class: 'cal-actions' }, [
        h('div', { class: 'cal-legend' }, [h('span', null, [h('i', { class: 'sq' }), 'Feed post']), h('span', null, [h('i', { class: 'dot' }), 'Story frame']), h('span', { text: 'Bottom bands: active phases' })]),
        open])]),
      side])]));

    /* drawer */
    var dr = qs('#drawer');
    dr.appendChild(h('button', { class: 'ov-x glass', type: 'button', 'aria-label': 'Close', text: '✕', on: { click: function () { A.drawer(false); } } }));
    dr.appendChild(h('p', { class: 'eyebrow', text: 'Stories' }));
    dr.appendChild(h('h3', { text: 'Story rules' }));
    dr.appendChild(h('ol', { ar: true }, C.story_rules.map(function (r) { return h('li', { text: r }); })));
    dr.appendChild(h('p', { class: 'eyebrow', text: 'Best posting times' }));
    dr.appendChild(h('table', { class: 'bt', style: 'margin-top:14px' }, [
      h('thead', null, h('tr', null, [h('th', { text: 'Day' }), h('th', { text: 'Primary' }), h('th', { text: 'Secondary' })])),
      h('tbody', null, C.best_times.map(function (b) { return h('tr', null, [h('td', { text: b.day }), h('td', { text: b.primary }), h('td', { text: b.secondary })]); }))
    ]));
  }

  /* ---------- 8 social ---------- */
  function social(s) {
    var ry = [16, 10, 4, -4, -10, -16], ty = [0, 14, 22, 22, 14, 0];
    var pItems = C.kvs.map(function (k) { return { src: k.post, cap: 'Post 4:5 · ' + A.castName(k.id) }; });
    var sItems = C.kvs.map(function (k) { return { src: k.story, cap: 'Story 9:16 · ' + A.castName(k.id) }; });
    var posts = h('div', { class: 'posts-row' }, C.kvs.map(function (k, i) {
      return lbBtn(h('button', { class: 'pcard rv', type: 'button', 'data-social-post': k.id, style: '--ry:' + ry[i % 6] + 'deg;--ty:' + ty[i % 6] + 'px;--d:' + (i * 0.06) + 's', 'aria-label': pItems[i].cap }, img(k.post, pItems[i].cap)), pItems, i);
    }));
    var phones = h('div', { class: 'phones' }, C.kvs.map(function (k, i) {
      var b = lbBtn(h('button', { class: 'phone', type: 'button', 'data-social-story': k.id, 'aria-label': sItems[i].cap, 'data-speed': (i % 2 ? '0.07' : '-0.05') }, img(k.story, sItems[i].cap)), sItems, i);
      return h('div', { class: 'rv', style: '--d:' + (i * 0.06) + 's' }, b);
    }));
    /* carousel */
    var cItems = C.carousel.map(function (src, i) { return { src: src, cap: 'Carousel · slide ' + (i + 1) }; });
    var track = h('div', { class: 'car-track snap' }, C.carousel.map(function (src, i) {
      return h('div', { class: 'cslide', 'data-slide': i }, [img(src, cItems[i].cap), h('span', { text: pad2(i + 1) + ' / ' + pad2(C.carousel.length) })]);
    }));
    var view = h('div', { class: 'car-view' }, track), pos = h('span', { class: 'car-pos' });
    var x = 0, idx = 0, drag = null;
    function step() { var a = track.children[0]; return a ? a.getBoundingClientRect().width + 18 : 300; }
    function maxX() { return Math.max(0, track.scrollWidth - view.clientWidth); }
    function setX(v) { x = A.clamp(v, 0, maxX()); track.style.transform = 'translate3d(' + (-x) + 'px,0,0)'; }
    function go(i) { idx = A.clamp(i, 0, C.carousel.length - 1); track.classList.add('snap'); setX(idx * step()); idx = Math.min(idx, Math.round(x / step() + 0.49)); pos.textContent = pad2(Math.min(C.carousel.length, idx + 1)) + ' / ' + pad2(C.carousel.length); }
    view.addEventListener('pointerdown', function (e) { drag = { x0: e.clientX, s: x, moved: false, t: e.target, id: e.pointerId }; });
    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.remove('snap'); view.classList.add('drag'); }
      if (drag.moved) setX(drag.s - dx);
    });
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dg = drag; drag = null; view.classList.remove('drag');
      if (dg.moved) { var dx = e.clientX - dg.x0; go(Math.round((dg.s - dx * 1.25) / step())); }
      else if (e.type === 'pointerup') { var sl = dg.t.closest && dg.t.closest('.cslide'); if (sl) A.lightbox(cItems, +sl.getAttribute('data-slide')); }
    }
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    view.setAttribute('tabindex', '0'); view.setAttribute('aria-label', 'Carousel, use arrow keys');
    view.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); } });
    var ctl = h('div', { class: 'car-ctl' }, [
      h('button', { class: 'rbtn glass', type: 'button', 'aria-label': 'Previous slide', text: '‹', on: { click: function () { go(idx - 1); } } }), pos,
      h('button', { class: 'rbtn glass', type: 'button', 'aria-label': 'Next slide', text: '›', on: { click: function () { go(idx + 1); } } })]);
    pos.textContent = '01 / ' + pad2(C.carousel.length);
    function sub(t, n, extra) { return h('div', { class: 'sub-head rv' }, [h('h3', { text: t }), extra || h('span', { text: n })]); }
    s.appendChild(A.backdrop(kvById('mom').scene, '0.1'));
    s.appendChild(A.secHead('07', 'Social', ['Feed, stories, ', h('b', { text: 'carousel.' })]));
    s.appendChild(h('div', { class: 'wrap' }, [
      sub('Feed posts', '4:5 · ' + C.kvs.length), posts,
      sub('Stories', '9:16 · ' + C.kvs.length), phones,
      sub('Carousel · ' + C.carousel.length + ' slides', '', ctl), h('div', { class: 'car rv' }, view)
    ]));
  }

  /* ---------- 9 outdoor ---------- */
  function parseOoh(src) {
    var m = /\/(s\d+)_(.+)_([a-z]+)\.webp$/.exec(src);
    return m ? { scene: m[1], place: A.cap(m[2].replace(/_/g, ' ')), kv: m[3] } : { scene: '', place: '', kv: '' };
  }
  function outdoor(s) {
    var vids = C.videos.filter(function (v) { return v.group === 'outdoor'; });
    function vEl(v) {
      var el = h('video', { muted: true, loop: true, playsinline: true, preload: 'none', poster: v.poster, src: v.src, 'data-ambient': '1', 'data-video': v.id, 'aria-label': v.title });
      el.muted = true;
      var box = h('div', { class: 'oohv rv-s ' + (v.vertical ? 'tall' : 'wide'), style: '--a:' + (v.vertical ? 0.5625 : 1.7778) }, [el, h('i', { class: 'live' }), h('span', { class: 'chip sm', text: v.title })]);
      A.ambientVideo(el, box);
      return box;
    }
    var byId = {}; vids.forEach(function (v) { byId[v.id] = v; });
    var wide = vids.filter(function (v) { return !v.vertical; }), tall = vids.filter(function (v) { return v.vertical; });
    var note = h('div', { class: 'ooh-note glass rv', style: '--a:0.9' }, [
      h('b', { text: C.outdoor.variants.length }), h('p', { text: 'placements: ' + C.outdoor.stills.length + ' sites × ' + C.kvs.length + ' key visuals. ' + vids.length + ' animated mockups.' })]);
    var r1 = h('div', { class: 'jrow' }, [wide[0], tall[0], tall[1]].filter(Boolean).map(vEl));
    var r2 = h('div', { class: 'jrow' }, [note].concat([tall[2], wide[1]].filter(Boolean).map(vEl)));
    /* stills */
    var stItems = C.outdoor.stills.map(function (src) { var o = parseOoh(src); return { src: src, cap: o.place + ' · ' + A.castName(o.kv), o: o }; });
    function still(it, i) {
      var tallS = /s3_|s6_/.test(it.src);
      return lbBtn(h('button', { class: 'still rv ' + (tallS ? '' : 'wide'), type: 'button', 'data-still': i, style: '--a:' + (tallS ? 0.8056 : 1.4905), 'aria-label': it.cap }, [img(it.src, it.cap), h('span', { class: 'chip sm', text: it.o.place })]), stItems, i);
    }
    var wS = [], tS = [];
    stItems.forEach(function (it, i) { (/s3_|s6_/.test(it.src) ? tS : wS).push(still(it, i)); });
    var sr1 = h('div', { class: 'jrow' }, wS.slice(0, 3));
    var sr2 = h('div', { class: 'jrow' }, [tS[0]].concat(wS.slice(3), [tS[1]]).filter(Boolean));
    /* variants */
    var vars = C.outdoor.variants.map(function (src) { var o = parseOoh(src); return { src: src, cap: o.place + ' · ' + A.castName(o.kv), o: o }; });
    var scenes = [], seen = {};
    vars.forEach(function (v) { if (!seen[v.o.scene]) { seen[v.o.scene] = 1; scenes.push(v.o); } });
    var state = { scene: 'all', kv: 'all' }, tiles = [], countEl = h('b', { text: vars.length });
    function visible() { return vars.filter(function (v) { return (state.scene === 'all' || v.o.scene === state.scene) && (state.kv === 'all' || v.o.kv === state.kv); }); }
    var gridEl = h('div', { class: 'vgrid' }, vars.map(function (v, i) {
      var t = h('button', { class: 'vt' + (/^s3$|^s6$/.test(v.o.scene) ? ' tall' : ''), type: 'button', 'data-variant': v.o.scene + '_' + v.o.kv, 'aria-label': v.cap }, img(v.src, v.cap));
      lbBtn(t, visible, function () { return visible().indexOf(v); });
      tiles.push(t); return t;
    }));
    function apply() {
      var n = 0;
      vars.forEach(function (v, i) { var ok = (state.scene === 'all' || v.o.scene === state.scene) && (state.kv === 'all' || v.o.kv === state.kv); tiles[i].classList.toggle('hide', !ok); if (ok) n++; });
      countEl.textContent = n;
      qsa('[data-vf]', s).forEach(function (b) { var p = b.getAttribute('data-vf').split(':'); b.setAttribute('aria-pressed', state[p[0]] === p[1] ? 'true' : 'false'); });
      A.measure();
    }
    function fbtn(group, val, kids) { return h('button', { class: 'chip sm', type: 'button', 'data-vf': group + ':' + val, 'aria-pressed': 'false', on: { click: function () { state[group] = val; apply(); } } }, kids); }
    var filters = h('div', { class: 'vfilters rv' }, [
      h('div', { class: 'vf-row' }, [h('span', { text: 'Site' }), fbtn('scene', 'all', 'All')].concat(scenes.map(function (o) { return fbtn('scene', o.scene, [h('b', { text: o.scene.toUpperCase() }), o.place]); })).concat([h('span', { class: 'vcount' }, [countEl, ' of ' + vars.length])])),
      h('div', { class: 'vf-row' }, [h('span', { text: 'Key visual' }), fbtn('kv', 'all', 'All')].concat(C.kvs.map(function (k) { return fbtn('kv', k.id, [h('span', { class: 'cast-ph round xs' }, img(castSrc(k.id), '')), A.castName(k.id)]); })))
    ]);
    function sub(t, n) { return h('div', { class: 'sub-head rv', style: 'margin-top:70px' }, [h('h3', { text: t }), h('span', { text: n })]); }
    s.appendChild(A.backdrop('assets/outdoor/s2_wall_dusk_lawyer.webp', '0.1'));
    s.appendChild(A.secHead('08', 'Outdoor', ['On the street, ', h('b', { text: 'in motion.' })]));
    s.appendChild(h('div', { class: 'wrap' }, [r1, r2, sub('Sites', C.outdoor.stills.length + ' stills'), sr1, sr2, sub('Every site × every key visual', vars.length + ' variants'), filters, gridEl]));
    apply();
  }

  /* ---------- 10 films ---------- */
  function films(s) {
    function tile(v, cls) {
      var parts = v.title.split(' · '), soon = v.group === 'feature_soon';
      var small = soon ? 'Feature film' : (parts[1] || (v.group === 'feature' ? 'Feature film' : 'Film'));
      return h('button', { class: 'film rv ' + (cls || '') + (soon ? ' soon' : '') + (v.vertical ? ' v' : ' h'), type: 'button', 'data-video': v.id, style: '--a:' + (v.vertical ? '9/16' : '16/9') + ';--fa:' + (v.vertical ? 0.5625 : 1.7778), 'aria-label': 'Play ' + v.title,
        on: { click: function () { A.player(v); } } }, [
        img(v.poster, v.title), soon ? h('span', { class: 'chip sm ember soon-tag', text: 'Coming soon' }) : null,
        h('span', { class: 'film-play glass' }), h('span', { class: 'film-t' }, [h('small', { text: small }), parts[0]])]);
    }
    /* the finished copies (story, main) play in the videos section, not on this wall */
    var all = C.videos.filter(function (v) { return v.group !== 'outdoor' && v.group !== 'story' && v.group !== 'main'; });
    var master = all.filter(function (v) { return v.id === 'master_60s'; })[0] || all[0];
    var live = all.filter(function (v) { return v.group === 'feature' && v !== master; });
    var soon = all.filter(function (v) { return v.group === 'feature_soon'; });
    var other = all.filter(function (v) { return v.group === 'film'; });
    var wide = other.filter(function (v) { return !v.vertical; }), rest = other.filter(function (v) { return v.vertical; });
    /* the new-design film plays in its own section; here it is a wide tile that leads there */
    var rd = rdFilm(), rdTile = rd ? h('a', { class: 'film h film-go rv', href: '#redesign', style: '--fa:1.7778', 'aria-label': rd.title + ', shown in the New design section' }, [
      rdCover(false), h('span', { class: 'film-arrow glass', text: '↑' }),
      h('span', { class: 'film-t' }, [h('small', { text: 'In its own section' }), rd.title.split(' · ')[0]])]) : null;
    s.appendChild(A.backdrop(kvById('businessman').scene, '0.1'));
    s.appendChild(A.secHead('09', 'Films', [all.length + ' films, ', h('b', { text: 'one app.' })], live.length + ' live feature films, ' + soon.length + ' marked coming soon.'));
    s.appendChild(h('div', { class: 'wrap' }, [
      h('div', { class: 'wall' }, [tile(master, 'master')].concat(live.map(function (v) { return tile(v); }))),
      h('div', { class: 'wall2' }, [rdTile].concat(wide.concat(soon, rest).map(function (v) { return tile(v); })))
    ]));
  }

  /* ---------- 11 plan ---------- */
  function plan(s) {
    var F = C.forecast, keys = ['conservative', 'expected', 'optimistic'], names = ['Conservative', 'Expected', 'Optimistic'];
    var maxD = Math.max.apply(null, F.daily.map(function (d) { return d.optimistic; }));
    var cols = [], cur = [0, 0, 0], curM = [0, 0, 0], sel = -1, spendEl = h('b'), th = h('i', { class: 'seg-th' }), segBtns = [];
    var fills = [['rgba(62,142,104,.75)', 'rgba(31,90,63,.5)'], ['rgba(242,217,168,.8)', 'rgba(214,178,122,.45)'], ['rgba(232,116,59,.7)', 'rgba(214,178,122,.4)']];
    var pcols = h('div', { class: 'pcols' }, keys.map(function (k, i) {
      var n = h('div', { class: 'pcol-n', text: '0' }), m = h('b', { text: '0' }), fill = h('div', { class: 'pcol-fill', style: '--fc1:' + fills[i][0] + ';--fc2:' + fills[i][1] });
      cols.push({ n: n, m: m, fill: fill });
      return h('div', { class: 'pcol glass rv', style: '--d:' + (i * 0.1) + 's', 'data-plan': k }, [fill, h('p', { class: 'eyebrow', text: names[i] }), n, h('div', { class: 'pcol-u', text: 'installs / day' }),
        h('div', { class: 'pcol-m' }, [h('span', { text: 'per 30 days' }), m])]);
    }));
    function tween(from, to, fn) {
      if (A.STATIC || A.CALM) { fn(to); return; }
      var t0 = performance.now();
      (function tick(t) { var p = A.clamp((t - t0) / 1100, 0, 1), e = 1 - Math.pow(1 - p, 4); fn(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(tick); })(t0);
    }
    function pick(i) {
      if (i === sel) return; sel = i;
      var d = F.daily[i], m = F.monthly[i];
      segBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      th.style.setProperty('--i', i);
      spendEl.textContent = '$' + m.spend;
      keys.forEach(function (k, j) {
        var c = cols[j];
        /* square-root scale so the conservative column stays readable next to the optimistic one */
        c.fill.style.setProperty('--f', (0.1 + 0.82 * Math.sqrt(d[k] / maxD)).toFixed(3));
        (function (a, b, a2, b2) { tween(a, b, function (v) { c.n.textContent = v; }); tween(a2, b2, function (v) { c.m.textContent = v.toLocaleString('en-US'); }); })(cur[j], d[k], curM[j], m[k]);
        cur[j] = d[k]; curM[j] = m[k];
      });
    }
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Daily budget' }, [th].concat(F.daily.map(function (d, i) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false', text: '$' + d.budget, on: { click: function () { pick(i); } } }); segBtns.push(b); return b;
    })));
    var cp = F.cpi, markPos = (cp.expected - cp.min) / (cp.max - cp.min) * 100;
    var ctrl = h('div', { class: 'plan-ctrl glass rv' }, [
      h('p', { class: 'eyebrow', text: 'Daily budget' }), seg,
      h('div', { class: 'plan-stat' }, [h('span', { text: 'Spend / 30 days' }), spendEl]),
      h('div', { class: 'cpi' }, [h('p', { class: 'eyebrow', text: 'Cost per install' }),
        h('div', { class: 'cpi-bar' }, h('span', { class: 'cpi-mark', style: 'left:' + markPos.toFixed(1) + '%', text: '$' + cp.expected.toFixed(2) })),
        h('div', { class: 'cpi-ends' }, [h('span', { text: '$' + cp.min.toFixed(2) + ' min' }), h('span', { text: 'expected' }), h('span', { text: '$' + cp.max.toFixed(2) + ' max' })])])
    ]);
    s.appendChild(A.backdrop(kvById('lawyer').scene, '0.1'));
    s.appendChild(A.secHead('10', 'Media plan', ['Budget in, ', h('b', { text: 'installs out.' })]));
    s.appendChild(h('div', { class: 'wrap plan-grid' }, [ctrl, pcols]));
    pick(Math.min(1, F.daily.length - 1));
  }

  /* ---------- 12 close ---------- */
  function close(s) {
    var f = C.facts;
    s.appendChild(A.backdrop(kvById('teacher').scene, '0.12'));
    s.appendChild(h('div', { class: 'close-in' }, [
      h('div', { class: 'rv-s' }, h('div', { 'data-speed': '0.1', 'data-depth': '1.2' }, img('assets/el/lockup.webp', f.slogan + ' — ' + f.sub, false, 'close-lock'))),
      h('div', { class: 'rv', style: '--d:.15s' }, img('assets/el/cta.webp', f.cta, false, 'close-cta')),
      h('div', { class: 'close-row glass rv', style: '--d:.25s' }, [img('assets/el/app_icon.webp', f.name, false, 'icon'), img('assets/el/stores.webp', 'Google Play and App Store', false, 'stores')]),
      h('div', { class: 'rv', style: '--d:.35s' }, img('assets/el/logo_white.webp', 'Andalusia Hospitals', false, 'close-logo'))
    ]));
  }

  function build() {
    var map = { hero: hero, idea: idea, stories: stories, visuals: visuals, redesign: redesign, calendar: calendar, social: social, outdoor: outdoor, films: films, plan: plan, close: close };
    for (var id in map) { var s = qs('#' + id); if (s) map[id](s); }
    if (A.STATIC) {
      /* screenshots: the section named in the hash must not wait for lazy loading */
      var t = location.hash && qs(location.hash);
      if (t) qsa('img[loading=lazy]', t).forEach(function (im) { im.loading = 'eager'; });
    }
  }
  function counts() {
    var vids = {};
    qsa('[data-video]').forEach(function (e) { vids[e.getAttribute('data-video')] = 1; });
    return ['posts:' + qsa('.cal-post[data-post]').length, 'stories:' + qsa('.frame[data-frame]').length, 'heroes:' + qsa('.story[data-hero]').length,
      'kvs:' + qsa('.kv-slide[data-kv]').length, 'videos:' + Object.keys(vids).length, 'variants:' + qsa('.vt[data-variant]').length,
      'cast:' + qsa('.cast-card[data-cast]').length, 'carousel:' + qsa('.cslide').length, 'stills:' + qsa('.still[data-still]').length].join(';');
  }
  return { build: build, counts: counts, phaseColor: phaseColor, tierLabel: tierLabel, tierTag: tierTag, tierOf: tierOf, kvById: kvById, postOfHero: postOfHero, castSrc: castSrc, parseOoh: parseOoh };
})();
