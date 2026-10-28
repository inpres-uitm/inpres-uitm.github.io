// INPRES v2 base script: index menu, reveals, scroll-linked drawing, lightbox, plant panel, list filters.
// Page modules append their own static/js/*.js after this file; each must check its elements exist.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// index (drawing register) menu
const menuBtn = document.querySelector('.top .menu');
const setMenu = o => { document.body.classList.toggle('reg-open', o); menuBtn.setAttribute('aria-expanded', o); menuBtn.querySelector('span').textContent = o ? 'Close' : 'Index'; };
menuBtn.onclick = () => setMenu(!document.body.classList.contains('reg-open'));
addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

// reveal once on entering view
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal,.lines').forEach(el => io.observe(el));

// scroll progress: every [data-progress] element gets --p from 0 (top enters viewport bottom) to 1 (bottom passes ~40% of viewport).
// [data-draw] svgs draw their .d paths in step with --p.
const prog = [...document.querySelectorAll('[data-progress],[data-draw]')];
prog.forEach(el => el.matches('[data-draw]') && el.querySelectorAll('.d').forEach(p => { p.setAttribute('pathLength', 1); p.style.strokeDasharray = 1; }));
const tick = () => {
  const vh = innerHeight;
  prog.forEach(el => {
    const r = el.getBoundingClientRect(), span = +(el.dataset.span || 1);
    const p = reduce ? 1 : Math.min(1, Math.max(0, (vh - r.top) / ((r.height + vh * .6) * span)));
    el.style.setProperty('--p', p.toFixed(4));
    if (el.matches('[data-draw]')) el.querySelectorAll('.d').forEach((d, i, all) => {
      const k = Math.min(1, Math.max(0, p * 1.6 - (i / all.length) * .6)); d.style.strokeDashoffset = 1 - k; });
  });
};
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { tick(); ticking = false; }); } }, { passive: true });
addEventListener('resize', tick); tick();

// lightbox for figures marked [data-zoom]
const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<div><img alt=""><p></p></div>'; document.body.append(lb);
lb.onclick = () => lb.classList.remove('on');
addEventListener('keydown', e => e.key === 'Escape' && lb.classList.remove('on'));
document.querySelectorAll('[data-zoom]').forEach(f => { f.style.cursor = 'zoom-in'; f.onclick = () => {
  lb.querySelector('img').src = f.querySelector('img').src; lb.querySelector('p').textContent = f.querySelector('figcaption')?.textContent || ''; lb.classList.add('on'); }; });

// plant diagram: hover/click/keyboard a unit to fill the side panel from window.PLANT
const P = window.PLANT;
if (P) {
  const panel = document.querySelector('.panel'), units = document.querySelectorAll('.unit');
  const show = k => { const u = P[k]; units.forEach(x => x.classList.toggle('on', x.dataset.k === k));
    panel.innerHTML = `<p class="cap">${u.tag} · ${u.k}</p><h3>${u.t}</h3><p>${u.d}</p><ul>${u.l.map(x => `<li>${x}</li>`).join('')}</ul>
      <p class="cap">Who</p><div class="who">${u.who.map(w => `<a href="person-${w[0]}.html"><img src="img/face-${w[0]}.jpg" alt=""><span>${w[1]}</span></a>`).join('')}</div>`; };
  units.forEach(u => { u.addEventListener('mouseenter', () => show(u.dataset.k)); u.addEventListener('click', () => show(u.dataset.k));
    u.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), show(u.dataset.k))); });
  show(Object.keys(P)[0]);
}

// filterable lists: <div class="rows" data-list> with rows carrying data-* attributes; controls carry data-f="attr"
document.querySelectorAll('[data-list]').forEach(list => {
  const box = list.closest('section'), rows = [...list.children], q = box.querySelector('input[type=search]'),
    sels = box.querySelectorAll('select[data-f]'), segs = box.querySelectorAll('.seg[data-f]'), cnt = box.querySelector('.count'),
    more = box.querySelector('.more'), page = +(list.dataset.page || 40); let lim = page;
  const run = () => {
    const s = (q?.value || '').toLowerCase().trim(); let n = 0;
    rows.forEach(r => {
      let ok = !s || r.textContent.toLowerCase().includes(s);
      sels.forEach(x => { const d = r.dataset[x.dataset.f] || ''; ok = ok && (!x.value || d === x.value || (x.dataset.f === 'who' && d.split(' ').includes(x.value))); });
      segs.forEach(x => { const v = x.querySelector('.on').dataset.v; ok = ok && (!v || r.dataset[x.dataset.f] === v); });
      if (ok) n++; r.hidden = !ok || n > lim;
    });
    if (cnt) cnt.textContent = n.toLocaleString() + ' shown';
    if (more) more.hidden = n <= lim;
  };
  q && (q.oninput = () => { lim = page; run(); }); sels.forEach(x => x.onchange = () => { lim = page; run(); });
  segs.forEach(x => x.querySelectorAll('button').forEach(b => b.onclick = () => { x.querySelectorAll('button').forEach(y => y.classList.remove('on')); b.classList.add('on'); lim = page; run(); }));
  more && (more.onclick = () => { lim += page * 2; run(); });
  run();
});

// about.html lab-life reel: drag to scroll, arrow buttons, counter
(() => {
  const reel = document.querySelector('.ab-reel'); if (!reel) return;
  const figs = [...reel.children], n = document.querySelector('.ab-n');
  const step = () => figs[1] ? figs[1].offsetLeft - figs[0].offsetLeft : reel.clientWidth;
  document.querySelectorAll('.ab-ctl button').forEach(b => b.onclick = () => reel.scrollBy({ left: step() * +b.dataset.d, behavior: 'smooth' }));
  reel.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); reel.scrollBy({ left: step() * (e.key === 'ArrowRight' ? 1 : -1), behavior: 'smooth' }); } });
  reel.addEventListener('scroll', () => { const i = figs.findIndex(f => f.offsetLeft - reel.offsetLeft + f.offsetWidth / 2 > reel.scrollLeft); if (n) n.textContent = String(Math.max(i, 0) + 1).padStart(2, '0'); }, { passive: true });
  // mouse drag; a drag must not open the lightbox
  let x0 = 0, s0 = 0, down = false, moved = false;
  reel.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = reel.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - x0; if (Math.abs(d) > 5) { moved = true; reel.classList.add('drag'); } reel.scrollLeft = s0 - d; });
  addEventListener('pointerup', () => { if (!down) return; down = false; reel.classList.remove('drag'); });
  reel.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
})();

/* ===== hazard builder: live consequence and risk demo on hazard.html (Leaflet, loaded deferred on that page only) ===== */
addEventListener('load', () => {
  const mapEl = document.getElementById('hz-map'); if (!mapEl || !window.L) return;
  const $ = s => document.querySelector(s), F = $('#hz-form');
  const PLACES = { uitm: [3.0712, 101.5003], pg: [1.4636, 103.9205], wp: [2.9195, 101.3105], kt: [4.5320, 103.4440] };
  const SUB = {
    lpg: { name: 'LPG', q: [1, 200], unit: 't', views: [['fire', 'Fireball'], ['vce', 'Explosion'], ['ir', 'Individual risk']] },
    cl2: { name: 'Chlorine', q: [.1, 20], unit: 'kg/s', mw: 70.9, a: -8.29, b: .92, erpg: [20, 3, 1], views: [['tox', 'Plume'], ['ir', 'Individual risk']] },
    nh3: { name: 'Ammonia', q: [.5, 100], unit: 'kg/s', mw: 17.03, a: -35.9, b: 1.85, erpg: [750, 150, 25], views: [['tox', 'Plume'], ['ir', 'Individual risk']] } };
  // two-monsoon sketch: share of the year the wind blows FROM each 30° sector (N, 30, 60 ...)
  const ROSE = [.06, .10, .13, .08, .05, .05, .07, .11, .14, .10, .06, .05];
  const COL = ['#B3261E', '#E8551E', '#F5B041'], IRC = [[1e-4, '#B3261E'], [1e-5, '#E8551E'], [1e-6, '#F5B041'], [1e-7, '#8FA7C9']];

  // ---------- models ----------
  const phi = z => { const t = 1 / (1 + .2316419 * Math.abs(z)), d = .3989423 * Math.exp(-z * z / 2);
    const p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
  const pr = Y => phi(Y - 5);
  const fireball = M => { const D = 5.8 * Math.cbrt(M), t = M < 30000 ? .45 * Math.cbrt(M) : 2.6 * Math.pow(M, 1 / 6), H = .75 * D, E = 350 * .7;
    const q = r => E * (D / 2) ** 2 / (r * r + H * H);  // kW/m², point view factor from the ball centre
    const at = qq => Math.sqrt(Math.max(0, E * (D / 2) ** 2 / qq - H * H));
    return { D, t, q, at, pf: r => pr(-14.9 + 2.56 * Math.log(t * Math.pow(q(r) * 1000, 4 / 3) / 1e4)) }; };
  const vce = M => { const W = .03 * (M / 2) * 46000 / 4680, w3 = Math.cbrt(W);
    const P = r => { const Z = Math.max(r, 1) / w3; return 1772 / Z ** 3 - 114 / Z ** 2 + 108 / Z; };  // kPa, Mills 1987
    const at = p => { let lo = .3, hi = 2000; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; (1772 / mid ** 3 - 114 / mid ** 2 + 108 / mid > p) ? lo = mid : hi = mid; } return lo * w3; };
    return { W, P, at, pf: r => { const pa = P(r) * 1000; return Math.min(1, .3 * pr(-23.8 + 2.92 * Math.log(pa)) + pr(-77.1 + 6.91 * Math.log(pa))); } }; };
  const SIG = { B: [x => .16 * x / Math.sqrt(1 + 1e-4 * x), x => .12 * x], D: [x => .08 * x / Math.sqrt(1 + 1e-4 * x), x => .06 * x / Math.sqrt(1 + .0015 * x)],
    F: [x => .04 * x / Math.sqrt(1 + 1e-4 * x), x => .016 * x / (1 + 3e-4 * x)] };
  const plume = (s, Q, u, st) => { const [sy, sz] = SIG[st];
    const ppm = (x, y) => { if (x < 1) return 0; const Y = sy(x), Z = sz(x); return Q * 1e6 / (Math.PI * Y * Z * u) * Math.exp(-y * y / (2 * Y * Y)) * 24.45 / s.mw; };
    const half = (x, c) => { const c0 = ppm(x, 0); return c0 > c ? sy(x) * Math.sqrt(2 * Math.log(c0 / c)) : 0; };
    return { ppm, half, pf: (x, y) => { const c = ppm(x, y); return c > 0 ? pr(s.a + s.b * Math.log(c * c * 10)) : 0; } }; };

  // ---------- geometry ----------
  const off = (ll, east, north) => [ll[0] + north / 111320, ll[1] + east / (111320 * Math.cos(ll[0] * Math.PI / 180))];
  const circ = (ll, r, n = 72) => Array.from({ length: n }, (_, i) => off(ll, r * Math.sin(i / n * 2 * Math.PI), r * Math.cos(i / n * 2 * Math.PI)));
  const toward = deg => { const a = (deg + 180) * Math.PI / 180; return [Math.sin(a), Math.cos(a)]; };  // unit vector downwind (east, north)
  const plumePoly = (ll, P, c, deg) => { const [ex, ny] = toward(deg), L = [], R = []; let last = 0;
    for (let i = 0; i <= 140; i++) { const x = 2 * Math.pow(1.065, i), h = P.half(x, c); if (h <= 0 && last > 0) break; if (h > 0) last = x;
      L.push(off(ll, x * ex - h * ny, x * ny + h * ex)); R.unshift(off(ll, x * ex + h * ny, x * ny - h * ex)); }
    return last ? { pts: [ll, ...L, ...R], len: last } : null; };

  // ---------- map ----------
  const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(PLACES.uitm, 14);
  const base = { sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' }),
    plan: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '© OpenStreetMap, © CARTO' }) };
  base.sat.addTo(map);
  const icon = L.divIcon({ className: 'hz-tank', html: '<i></i><b>TK-01</b>', iconSize: [28, 28], iconAnchor: [14, 14] });
  let src = PLACES.uitm; const tank = L.marker(src, { icon, draggable: true, keyboard: true, title: 'Hypothetical tank. Drag or click the map to move.' }).addTo(map);
  const layer = L.layerGroup().addTo(map); let ir = null, zones = [];
  map.on('click', e => { src = [e.latlng.lat, e.latlng.lng]; tank.setLatLng(src); run(true); });
  tank.on('dragend', () => { const p = tank.getLatLng(); src = [p.lat, p.lng]; run(true); });
  F.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { src = PLACES[b.dataset.p]; tank.setLatLng(src); map.setView(src, 14); run(true); });

  // ---------- inputs ----------
  const val = n => F.querySelector(`[name=${n}]:checked`)?.value;
  const qOf = s => { const [a, b] = SUB[s].q, k = $('#hz-q').value / 100; return a * Math.pow(b / a, k); };
  const nice = v => v >= 10 ? Math.round(v) : v >= 1 ? +v.toFixed(1) : +v.toFixed(2);
  const sci = x => { if (!x) return '0'; const e = Math.floor(Math.log10(x)), m = x / 10 ** e; return `${m.toFixed(1)} × 10<sup>${e}</sup>`; };
  const sciT = x => { const [m, e] = x.toExponential(1).split('e'); return `${m} × 10${String(+e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
  const m_ = r => r >= 1000 ? (r / 1000).toFixed(2) + ' km' : Math.round(r) + ' m';
  const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  let sub = 'lpg', view = 'fire';
  const setViews = () => { const v = $('#hz-view'); v.innerHTML = SUB[sub].views.map(([k, t], i) => `<label><input type="radio" name="view" value="${k}"${i ? '' : ' checked'}><span>${t}</span></label>`).join(''); view = SUB[sub].views[0][0]; };
  setViews();
  F.addEventListener('input', e => { if (e.target.name === 'sub') { sub = e.target.value; setViews(); }
    if (e.target.name === 'view') view = e.target.value;
    if (e.target.name === 'base') { map.removeLayer(base[e.target.value === 'sat' ? 'plan' : 'sat']); base[e.target.value].addTo(map); return; }
    run(e.target.name === 'sub' || e.target.name === 'view'); });

  // ---------- risk grid: individual risk and N for each outcome ----------
  const grid = (outs, R, dens) => { const n = 90, cell = 2 * R / n, a = cell * cell, IR = new Float32Array(n * n), N = outs.map(() => 0);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -R + (i + .5) * cell, y = R - (j + .5) * cell; let s = 0;
      outs.forEach((o, k) => { const p = o.pf(x, y); if (p > 1e-4) { s += o.f * p; N[k] += p * dens * a; } }); IR[j * n + i] = s; }
    return { n, cell, IR, N }; };
  const irImage = (g, R) => { const c = document.createElement('canvas'); c.width = c.height = g.n; const x = c.getContext('2d'), im = x.createImageData(g.n, g.n);
    g.IR.forEach((v, i) => { const b = IRC.find(([t]) => v >= t); if (!b) return; const h = b[1]; im.data.set([parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 150], i * 4); });
    x.putImageData(im, 0, 0); return L.imageOverlay(c.toDataURL(), [off(src, -R, -R), off(src, R, R)], { className: 'hz-irimg' }); };
  const reach = (g, R, t) => { let r = 0; g.IR.forEach((v, i) => { if (v >= t) { const x = -R + (i % g.n + .5) * g.cell, y = R - (Math.floor(i / g.n) + .5) * g.cell; r = Math.max(r, Math.hypot(x, y)); } }); return r; };

  // ---------- charts ----------
  const fnChart = (pts, pll) => { const W = 360, Hh = 260, l = 46, b = 220, xr = [0, 4], yr = [-9, -2];
    const X = n => l + (Math.log10(n) - xr[0]) / (xr[1] - xr[0]) * (W - l - 10), Y = f => b - (Math.log10(f) - yr[0]) / (yr[1] - yr[0]) * (b - 10);
    let s = ''; for (let e = xr[0]; e <= xr[1]; e++) s += `<line class="g" x1="${X(10 ** e)}" x2="${X(10 ** e)}" y1="10" y2="${b}"/><text x="${X(10 ** e)}" y="${b + 16}" text-anchor="middle">${10 ** e}</text>`;
    for (let e = yr[0]; e <= yr[1]; e++) s += `<line class="g" x1="${l}" x2="${W - 10}" y1="${Y(10 ** e)}" y2="${Y(10 ** e)}"/><text x="${l - 6}" y="${Y(10 ** e) + 4}" text-anchor="end">1e${e}</text>`;
    [[1e-3, 'crit hi', 'Intolerable'], [1e-5, 'crit lo', 'Negligible']].forEach(([c, k, t]) => { const p = [1, 10, 100, 1000, 10000].map(n => `${X(n)},${Y(Math.max(1e-9, c / n / n))}`).join(' ');
      s += `<polyline class="${k}" points="${p}"/><text class="${k}" x="${X(1.4)}" y="${Y(c) - 5}">${t}</text>`; });
    const v = pts.filter(p => p.N >= 1).sort((a, b) => a.N - b.N);
    if (v.length) { let d = '', i = 0; const Fs = v.map((p, k) => v.slice(k).reduce((a, q) => a + q.f, 0));
      v.forEach((p, k) => { const x0 = X(k ? v[k - 1].N : 1), x1 = X(p.N), y = Y(Math.max(1e-9, Fs[k])); d += (k ? ` L${x0} ${y}` : `M${x0} ${y}`) + ` L${x1} ${y}`; i = x1; });
      s += `<path class="fn" d="${d} L${i} ${b}"/>`; }
    else s += `<text x="${W / 2 + 20}" y="${b / 2}" text-anchor="middle" class="nil">No outcome reaches 1 fatality</text>`;
    s += `<text x="${W - 10}" y="${b + 34}" text-anchor="end">N, fatalities</text><text x="12" y="14">F /yr</text>`;
    $('#hz-fn').innerHTML = s; };
  const etree = (f, sub) => { const svg = $('#hz-et');
    if (sub === 'lpg') { $('#hz-etcap').textContent = 'Event tree · LPG vessel failure';
      const r = [['Immediate ignition', .7, 'Fireball (BLEVE)', 40], ['Delayed ignition', .15, 'Vapour cloud explosion', 130], ['No ignition', .15, 'Safe dispersal', 220]];
      svg.innerHTML = `<text x="0" y="124" class="b">Release</text><text x="0" y="146">${sciT(f)} /yr</text><path class="ln" d="M78 130 H100 V40 H224 M100 130 H224 M100 130 V220 H224"/>` +
        r.map(([a, p, o, y]) => `<text x="106" y="${y - 6}">${a} · ${p}</text><text x="232" y="${y + 4}" class="b">${o}</text><text x="232" y="${y + 20}">${sciT(f * p)} /yr</text>`).join('');
    } else { $('#hz-etcap').textContent = 'Wind rose · share of the year, wind from';
      const cx = 200, cy = 130, R = 105, mx = Math.max(...ROSE); let s = [.33, .66, 1].map(k => `<circle class="g" cx="${cx}" cy="${cy}" r="${R * k}"/>`).join('');
      ROSE.forEach((w, i) => { const a0 = (i * 30 - 13) * Math.PI / 180, a1 = (i * 30 + 13) * Math.PI / 180, r = R * w / mx;
        s += `<path class="petal${i * 30 === +$('#hz-d').value - (+$('#hz-d').value % 30) ? ' on' : ''}" d="M${cx} ${cy} L${cx + r * Math.sin(a0)} ${cy - r * Math.cos(a0)} A${r} ${r} 0 0 1 ${cx + r * Math.sin(a1)} ${cy - r * Math.cos(a1)} Z"/>`; });
      s += ['N', 'E', 'S', 'W'].map((t, i) => `<text x="${cx + (R + 12) * Math.sin(i * Math.PI / 2)}" y="${cy - (R + 12) * Math.cos(i * Math.PI / 2) + 4}" text-anchor="middle" class="b">${t}</text>`).join('');
      svg.innerHTML = s; } };

  // ---------- run ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grow = (shapes) => { if (reduce) return; const t0 = performance.now(), full = shapes.map(s => s.getRadius());
    const step = t => { const k = Math.min(1, (t - t0) / 700), e = 1 - (1 - k) ** 3; shapes.forEach((s, i) => s.setRadius(full[i] * e)); if (k < 1) requestAnimationFrame(step); };
    shapes.forEach(s => s.setRadius(0)); requestAnimationFrame(step); };
  function run(animate) {
    const s = SUB[sub], q = qOf(sub), u = +$('#hz-u').value, deg = +$('#hz-d').value, st = $('#hz-st').value;
    const dens = $('#hz-pop').value / 1e6 * +val('dn'), f = +$('#hz-f').value;
    $('#hz-qv').textContent = `${nice(q)} ${s.unit}`; $('#hz-uv').textContent = `${u} m/s`; $('#hz-dv').textContent = `${DIRS[Math.round(deg / 22.5) % 16]} · ${deg}°`;
    layer.clearLayers(); zones = []; const rows = [], leg = [], circles = [];
    let outs, R;
    if (sub === 'lpg') {
      const M = q * 1000, fb = fireball(M), vx = vce(M);
      outs = [{ f: f * .7, pf: (x, y) => fb.pf(Math.hypot(x, y)) }, { f: f * .15, pf: (x, y) => vx.pf(Math.hypot(x, y)) }];
      R = Math.max(fb.at(5), vx.at(14), 150) * 1.15;
      rows.push(['Fireball', `${Math.round(fb.D)} m across, burns ${fb.t.toFixed(0)} s`]);
      [[37.5, 'Process equipment damage'], [12.5, 'Wood ignites, 1% fatal within a minute'], [5, 'Burns through clothing in under a minute']].forEach(([k, t], i) => {
        const r = fb.at(k); rows.push([`${k} kW/m²`, r ? m_(r) : 'inside fireball']); if (view === 'fire' && r) { zones.push([`${k} kW/m²`, circ(src, r)]); circles.push(L.circle(src, { radius: r, color: COL[i], weight: 1.5, fillOpacity: .18 })); leg.push([COL[i], `${k} kW/m² · ${t}`]); } });
      rows.push(['TNT equivalent', `${Math.round(vx.W).toLocaleString()} kg`]);
      [[70, 'Most buildings collapse'], [21, 'Heavy structural damage'], [7, 'Windows shatter, flying glass']].forEach(([k, t], i) => {
        const r = vx.at(k); rows.push([`${k} kPa`, m_(r)]); if (view === 'vce') { zones.push([`${k} kPa`, circ(src, r)]); circles.push(L.circle(src, { radius: r, color: COL[i], weight: 1.5, fillOpacity: .18 })); leg.push([COL[i], `${k} kPa · ${t}`]); } });
    } else {
      const P = plume(s, q, u, st), [ex, ny] = toward(deg);
      outs = ROSE.map((w, i) => { const [e2, n2] = toward(i * 30); return { f: f * w, pf: (x, y) => P.pf(x * e2 + y * n2, -x * n2 + y * e2) }; });
      let far = 0;
      s.erpg.forEach((c, i) => { const p = plumePoly(src, P, c, deg); rows.push([`ERPG-${3 - i} · ${c} ppm`, p ? m_(p.len) : 'not reached']);
        if (p) { far = Math.max(far, p.len); if (view === 'tox') { zones.push([`ERPG-${3 - i}`, p.pts]); layer.addLayer(L.polygon(p.pts, { color: COL[i], weight: 1.5, fillOpacity: .2 })); leg.push([COL[i], `ERPG-${3 - i} · ${['life-threatening', 'serious effects', 'mild effects'][i]}, 1 h`]); } } });
      let r50 = 0; for (let x = 2; x < 30000; x *= 1.04) if (P.pf(x, 0) >= .5) r50 = x;
      rows.push(['50% fatal on the plume axis', r50 ? m_(r50) : 'not reached']);
      R = Math.min(Math.max(r50 * 1.6, 200), 12000);
      if (animate && view === 'tox' && far) map.fitBounds(L.latLngBounds([src, ...circ(src, Math.min(far, 15000), 8)]).pad(.05), { animate: !reduce });
    }
    circles.forEach(c => layer.addLayer(c)); if (animate) grow(circles);
    const g = grid(outs, R, dens);
    if (view === 'ir') { layer.addLayer(irImage(g, R)); IRC.forEach(([t, c]) => { const r = reach(g, R, t); if (r) leg.push([c, `${sciT(t).replace('1.0 × ', '')} /yr · reaches ${m_(r)}`]); }); }
    [1e-5, 1e-6].forEach(t => rows.push([`Individual risk ${t === 1e-5 ? '10⁻⁵' : '10⁻⁶'} /yr`, (r => r ? m_(r) : 'not reached')(reach(g, R, t))]));
    const pts = outs.map((o, k) => ({ f: o.f, N: g.N[k] })), pll = pts.reduce((a, p) => a + p.f * p.N, 0), maxN = Math.max(...g.N);
    rows.push(['Worst single outcome', `${Math.round(maxN).toLocaleString()} fatalities`], ['Potential loss of life', `${sci(pll)} /yr`]);
    if ((view === 'fire' || view === 'vce' || view === 'ir') && sub === 'lpg' && animate) map.fitBounds(L.latLngBounds(circ(src, R, 8)), { animate: !reduce });
    $('#hz-res').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="v">${b}</td></tr>`).join('');
    $('#hz-legend').innerHTML = `<b>${s.name} · ${nice(q)} ${s.unit}</b>` + leg.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');
    fnChart(pts, pll); etree(f, sub);
  }
  run(true);

  // ---------- KML export ----------
  $('#hz-kml').onclick = () => {
    const pm = zones.map(([n, pts], i) => `<Placemark><name>${n}</name><Style><LineStyle><color>ff1e55e8</color><width>2</width></LineStyle><PolyStyle><color>${['551e26b3', '441e55e8', '3341b0f5'][i % 3]}</color></PolyStyle></Style><Polygon><outerBoundaryIs><LinearRing><coordinates>${[...pts, pts[0]].map(([a, b]) => `${b.toFixed(6)},${a.toFixed(6)},0`).join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`).join('');
    const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>INPRES demo zones (illustrative)</name><Placemark><name>TK-01</name><Point><coordinates>${src[1]},${src[0]},0</coordinates></Point></Placemark>${pm}</Document></kml>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })); a.download = 'inpres-demo-zones.kml'; a.click(); URL.revokeObjectURL(a.href); };
});

// industry builder: Malaysia map that fills in by year (scroll-linked or scrubbed), with a hover/tap readout.
(() => {
  const sec = document.querySelector('.ind-map'), src = document.getElementById('ind-pts');
  if (!sec || !src) return;
  const D = JSON.parse(src.textContent), G = [...sec.querySelectorAll('.imap .pt')];
  const rng = document.getElementById('ind-range'), yr = document.getElementById('ind-yr'), cnt = document.getElementById('ind-n'), tip = document.getElementById('ind-tip');
  const y0 = +rng.min, y1 = +rng.max, still = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth <= 700;
  let manual = still, shown = -1;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const set = y => {
    if (y === shown) return; shown = y; rng.value = y; yr.textContent = y;
    let n = 0;
    G.forEach((g, i) => { const on = D[i].y <= y; g.classList.toggle('off', !on); g.classList.toggle('new', D[i].y === y); n += on; });
    cnt.textContent = `${n} of ${G.length} placed sites`;
  };
  const show = i => {
    const p = D[i]; G.forEach(g => g.classList.remove('sel')); G[i].classList.add('sel');
    tip.innerHTML = `<p class="cap">${p.y} · <a href="${esc(p.m)}" target="_blank" rel="noopener">${esc(p.pl)}</a></p><h4>${esc(p.t)}</h4><p><a href="${esc(p.cu)}" target="_blank" rel="noopener">${esc(p.c)}</a></p>${p.hq ? '<p class="ax">Approximate: placed at the client’s head office, not the site</p>' : ''}`;
  };
  G.forEach((g, i) => {
    g.querySelector('title')?.remove();  // the readout replaces the native tooltip
    g.setAttribute('role', 'button'); g.setAttribute('aria-label', `${D[i].y}, ${D[i].t}, ${D[i].c}${D[i].hq ? ', approximate location' : ''}`);
    g.addEventListener('pointerenter', () => show(i)); g.addEventListener('focus', () => show(i)); g.addEventListener('click', () => show(i));
  });
  rng.addEventListener('input', () => { manual = true; set(+rng.value); });
  const tick = () => {
    if (manual) return;
    const r = sec.getBoundingClientRect(), run = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (run > 0 ? run : 1)));
    set(Math.round(y0 + p * (y1 - y0)));
  };
  if (still) set(y1); else { set(y0); addEventListener('scroll', tick, { passive: true }); tick(); }
  window.INPRES_INDUSTRY = { set };
})();

// research page: waste-to-wealth sequence picks its step from the --p that site.js sets
(() => {
  const seq = document.querySelector('.rz-seq');
  if (!seq) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { seq.classList.add('all'); seq.dataset.step = 3; return; }
  const set = () => {
    const q = Math.min(1, Math.max(0, (+seq.style.getPropertyValue('--p') - .28) / .55)), s = String(Math.min(3, Math.floor(q * 4)));
    if (seq.dataset.step === s) return;
    seq.dataset.step = s;
    seq.querySelectorAll('li[data-i]').forEach(li => li.classList.toggle('rz-on', li.dataset.i === s));
  };
  addEventListener('scroll', set, { passive: true }); addEventListener('resize', set); set();
})();
