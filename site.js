// header, menu, reveal-on-scroll, counters, lightbox, plant diagram, list filters
const hdr = document.querySelector('.top');
const onScroll = () => hdr.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
if (!document.querySelector('.hero')) hdr.classList.add('always');
document.querySelector('.burger').onclick = e => { const o = hdr.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };

const fmt = (v, d) => v.toLocaleString('en-MY', { minimumFractionDigits: d, maximumFractionDigits: d });
function count(el) {
  const to = +el.dataset.to, d = +(el.dataset.d || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 3);
    el.textContent = pre + fmt(to * e, d) + suf; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
  e.target.querySelectorAll('[data-to]').forEach(count);
}), { threshold: .15 });
document.querySelectorAll('.reveal,.yearchart,[data-count]').forEach(el => io.observe(el));

// lightbox for any figure in .mosaic
const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<div><img alt=""><p></p></div>'; document.body.append(lb);
lb.onclick = () => lb.classList.remove('on');
addEventListener('keydown', e => e.key === 'Escape' && lb.classList.remove('on'));
document.querySelectorAll('.mosaic figure').forEach(f => f.onclick = () => {
  lb.querySelector('img').src = f.querySelector('img').src; lb.querySelector('p').textContent = f.querySelector('figcaption')?.textContent || ''; lb.classList.add('on');
});

// plant diagram: click/hover a unit to show its expertise in the side panel
const P = window.PLANT;
if (P) {
  const panel = document.querySelector('.panel'), units = document.querySelectorAll('.unit');
  const show = k => { const u = P[k]; units.forEach(x => x.classList.toggle('on', x.dataset.k === k));
    panel.innerHTML = `<span class="k">${u.k}</span><h3>${u.t}</h3><p>${u.d}</p><ul>${u.l.map(x => `<li>${x}</li>`).join('')}</ul>
      <div class="who">${u.who.map(w => `<a href="person-${w[0]}.html" title="${w[1]}"><img src="img/face-${w[0]}.jpg" alt="${w[1]}"></a>`).join('')}</div>`; };
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
