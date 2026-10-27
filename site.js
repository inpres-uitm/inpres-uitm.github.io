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
