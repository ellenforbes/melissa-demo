/* =====================================================
   Melissa site script
   - Renders portfolio from a data array (easy to extend)
   - Chaotic overlapping photo layout via per-layout presets
   - Mobile nav toggle
   - Lightbox for portfolio photos
   - Inquiry form handling (mailto handoff)
   - Footer year
   ===================================================== */

/* -------------------------------------------------------
   PORTFOLIO DATA
   To add a new project: push another object onto this array.
   - layout: 'a' (3-photo: feature + 2 angled siblings)
             'b' (5-photo: feature + 4 angled siblings)
             'c' (4-photo: wide feature + 3 angled siblings)
   - photos: list of image filenames inside `folder`.
             The FIRST photo is always the big feature.
   ------------------------------------------------------- */
const PROJECTS = [
  {
    title: 'Paint by Numbers Mural',
    meta: 'Large-scale canvas · 2025',
    blurb: 'A hand-drawn, hand-numbered canvas, painted section by section from blank outline to finished glasshouse.',
    layout: 'b',
    folder: 'Project 20250927 Paint By Numbers',
    photos: [
      '20250927_235943.jpg',
      '20250927_121514.jpg',
      '20250927_191536~2.jpg',
      '20250927_213638.jpg',
      '20250927_224850.jpg',
    ],
  },
  {
    title: 'Fancy Painting',
    meta: 'Decorative interior · 2026',
    blurb: 'Hand-painted detail work that turns a room into a statement.',
    layout: 'b',
    folder: 'Project 20250703 Fancy Painting',
    photos: [
      'PXL_20260222_225423884~3.jpg',
      'SquareQuick_2026319191353443.jpg',
      'SquareQuick_2026319191654603.jpg',
      'SquareQuick_202631919156875.jpg',
      'PXL_20260222_230007922.jpg',
    ],
  },
  {
    title: 'Wardrobe Refurbish',
    meta: 'Furniture revival · 2026',
    blurb: 'A tired wardrobe brought back to life with paint and patience.',
    layout: 'a',
    folder: 'Project 20250510 Wardrobe Refurnish',
    photos: [
      'SquareQuick_2026417134038230.jpg',
      'PXL_20260326_164439841.MP.jpg',
      'PXL_20260404_172039672.MP~2.jpg',
    ],
  },
  {
    title: 'Christmas Village Set',
    meta: 'Stage flats · 2025',
    blurb: 'A French Christmas village built flat by flat, from the Hotel de Noel to the toy shop window.',
    layout: 'b',
    folder: 'Project 20251205 Christmas Set Design',
    photos: [
      'PXL_20251205_162446419.MP~2.jpg',
      'PXL_20251205_165424775.MP~3.jpg',
      'PXL_20251205_165521572.MP~2.jpg',
      'PXL_20251205_165909930.MP~2.jpg',
      'PXL_20251205_165738035.MP~2.jpg',
    ],
  },
  {
    title: 'Winter Town Set',
    meta: 'Stage flats · 2023',
    blurb: 'A snowbound town in cut-out flats: the station, the fire hall, the chapel and the schoolhouse.',
    layout: 'c',
    folder: 'Project 20231206 Set Design',
    photos: [
      '20231219_190045~2.jpg',
      'IMG_20231206_182918_086~2.jpg',
      'IMG_20231220_073208_289~3.jpg',
      'IMG_20231205_224845_930~3.jpg',
    ],
  },
];

/* -------------------------------------------------------
   LAYOUT POSITION PRESETS
   Each entry positions one photo on the relative stage:
     t/l/w/h are percentages of the stage,
     r is rotation in degrees,
     z is stack order (higher = on top).
   The first photo is always the feature (largest).
   ------------------------------------------------------- */
const LAYOUTS = {
  a: [
    { t: 8,  l: 4,  w: 46, h: 86, r: -4,  z: 3 },
    { t: 2,  l: 46, w: 38, h: 52, r: 7,   z: 2 },
    { t: 42, l: 56, w: 40, h: 54, r: -9,  z: 1 },
  ],
  b: [
    { t: 4,  l: 2,  w: 42, h: 92, r: -3,  z: 5 },
    { t: 2,  l: 42, w: 30, h: 48, r: 7,   z: 4 },
    { t: 8,  l: 70, w: 28, h: 44, r: -9,  z: 3 },
    { t: 50, l: 44, w: 30, h: 50, r: -6,  z: 2 },
    { t: 48, l: 70, w: 28, h: 48, r: 9,   z: 3 },
  ],
  c: [
    { t: 6,  l: 3,  w: 50, h: 62, r: -4, z: 4 },
    { t: 2,  l: 55, w: 30, h: 52, r: 6,  z: 3 },
    { t: 46, l: 30, w: 28, h: 50, r: -8, z: 2 },
    { t: 40, l: 62, w: 32, h: 56, r: 7,  z: 1 },
  ],
};

/* ------------------------------------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const enc = (s) => s.split('/').map(encodeURIComponent).join('/');

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function renderPortfolio() {
  const list = $('#portfolio-list');
  if (!list) return;

  const tabs = PROJECTS.map((p, i) => `
      <button type="button" class="subtab${i === 0 ? ' is-active' : ''}"
              id="subtab-${i}" role="tab" data-index="${i}"
              aria-controls="subpanel-${i}" aria-selected="${i === 0}"
              ${i === 0 ? '' : 'tabindex="-1"'}>${p.title}</button>`).join('');

  const panels = PROJECTS.map((p, i) => {
    const positions = LAYOUTS[p.layout] || LAYOUTS.a;
    const photos = p.photos.map((file, j) => {
      const pos = positions[j] || positions[positions.length - 1];
      const src = enc(`${p.folder}/${file}`);
      const style =
        `--t:${pos.t}%;--l:${pos.l}%;--w:${pos.w}%;--h:${pos.h}%;` +
        `--r:${pos.r}deg;--z:${pos.z};--ar:auto;`;
      return `
        <figure class="project__photo" data-src="${src}" data-project="${i}" style="${style}">
          <img src="${src}" alt="${p.title}, photo ${j + 1}" loading="lazy" />
        </figure>`;
    }).join('');

    return `
      <div class="subpanel" id="subpanel-${i}" data-index="${i}" role="tabpanel"
           aria-labelledby="subtab-${i}" tabindex="-1"${i === 0 ? '' : ' hidden'}>
        <article class="project project--${p.layout}">
          <div class="project__head">
            <h3 class="project__title">${p.title}</h3>
            <span class="project__meta">${p.meta}</span>
          </div>
          <p class="project__blurb">${p.blurb}</p>
          <div class="project__stage">
            <img class="project__splat" src="Motifs/SplatOne.png" alt="" aria-hidden="true" />
            ${photos}
          </div>
        </article>
      </div>`;
  }).join('');

  const dots = PROJECTS.map((p, i) => `
      <button type="button" class="stepper__dot${i === 0 ? ' is-active' : ''}"
              data-index="${i}" aria-label="${p.title}"></button>`).join('');

  list.innerHTML = `
    <div class="subtabs" role="tablist" aria-label="Projects">${tabs}
    </div>
    <div class="stepper">
      <div class="stepper__bar">
        <button type="button" class="stepper__arrow" data-step="-1" aria-label="Previous project">&lsaquo;</button>
        <span class="stepper__label" aria-live="polite">${PROJECTS[0].title}</span>
        <button type="button" class="stepper__arrow" data-step="1" aria-label="Next project">&rsaquo;</button>
      </div>
      <div class="stepper__dots">${dots}
      </div>
    </div>
    <div class="subpanels">${panels}
    </div>`;

  $$('.project__photo', list).forEach((el) => {
    el.addEventListener('click', () => {
      if (swipedRecently()) return;
      const projectIdx = Number(el.dataset.project);
      const photoIdx = $$(`.project__photo[data-project="${projectIdx}"]`)
        .indexOf(el);
      openLightbox(projectIdx, photoIdx);
    });
  });

  bindSubtabs(list);
  bindStepper(list);
  bindSwipe(list);
}

/* ---------- Portfolio project switching ----------
   Two controls drive the same set of panels: a row of pills on desktop,
   and a prev/next stepper with dots on mobile (plus swipe on the stage).
   Only one of the two is ever visible, but both stay in sync.
*/
function currentProjectIndex() {
  const active = $('.subtab.is-active');
  return active ? Number(active.dataset.index) : 0;
}

function stepProject(delta, opts = {}) {
  const next = (currentProjectIndex() + delta + PROJECTS.length) % PROJECTS.length;
  activateProject(next, opts);
}

function activateProject(idx, opts = {}) {
  if (!PROJECTS[idx]) return;
  $$('.subtab').forEach((btn) => {
    const on = Number(btn.dataset.index) === idx;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
    if (on) btn.removeAttribute('tabindex');
    else btn.setAttribute('tabindex', '-1');
  });
  $$('.subpanel').forEach((panel) => {
    panel.hidden = Number(panel.dataset.index) !== idx;
  });

  const label = $('.stepper__label');
  if (label) label.textContent = PROJECTS[idx].title;
  $$('.stepper__dot').forEach((dot) => {
    const on = Number(dot.dataset.index) === idx;
    dot.classList.toggle('is-active', on);
    if (on) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });

  if (opts.focus) $(`#subtab-${idx}`).focus();
  if (opts.hash !== false) syncHash();
}

function bindSubtabs(list) {
  const bar = $('.subtabs', list);
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.subtab');
    if (btn) activateProject(Number(btn.dataset.index));
  });

  bar.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    stepProject(step, { focus: true });
  });
}

function bindStepper(list) {
  const stepper = $('.stepper', list);
  if (!stepper) return;

  stepper.addEventListener('click', (e) => {
    const arrow = e.target.closest('.stepper__arrow');
    if (arrow) return stepProject(Number(arrow.dataset.step));
    const dot = e.target.closest('.stepper__dot');
    if (dot) activateProject(Number(dot.dataset.index));
  });
}

/* ---------- Swipe the photo stage to change project ----------
   A swipe also lands as a click on whatever photo was under the finger,
   so a recent swipe suppresses the lightbox for a moment.
*/
let lastSwipeAt = 0;
const swipedRecently = () => Date.now() - lastSwipeAt < 400;

function bindSwipe(list) {
  const stage = $('.subpanels', list);
  if (!stage) return;
  let startX = null;
  let startY = null;

  stage.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    startX = null;
    /* Ignore short drags and anything that reads as a vertical scroll. */
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    lastSwipeAt = Date.now();
    stepProject(dx < 0 ? 1 : -1);
  }, { passive: true });
}

/* ---------- Section tabs (About / Services / Portfolio / FAQ) ----------
   The page is a tab set, not a long scroll. The URL hash still names the
   view so links can be shared: #about, #services, #faq, and
   #portfolio-<project-slug> for a specific project.
*/
const TAB_IDS = ['about', 'services', 'portfolio', 'faq'];

function currentTab() {
  const active = $('.tab.is-active');
  return active ? active.dataset.tab : 'about';
}

function syncHash() {
  const name = currentTab();
  const hash = name === 'portfolio'
    ? `#portfolio-${slugify(PROJECTS[currentProjectIndex()].title)}`
    : `#${name}`;
  history.replaceState(null, '', hash);
}

function activateTab(name, opts = {}) {
  if (!TAB_IDS.includes(name)) return;

  $$('.tab').forEach((btn) => {
    const on = btn.dataset.tab === name;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
    if (on) btn.removeAttribute('tabindex');
    else btn.setAttribute('tabindex', '-1');
  });
  $$('.tab-panel').forEach((panel) => {
    panel.hidden = panel.id !== `panel-${name}`;
  });
  closeNav();

  if (opts.focus) $(`#tab-${name}`).focus();
  if (opts.scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  if (opts.hash !== false) syncHash();
}

/* Read the opening view out of the URL. Anything unrecognised lands on About. */
function viewFromHash() {
  const raw = location.hash.replace(/^#/, '');
  if (TAB_IDS.includes(raw)) return { tab: raw, project: null };
  if (raw.startsWith('portfolio-')) {
    const slug = raw.slice('portfolio-'.length);
    const idx = PROJECTS.findIndex((p) => slugify(p.title) === slug);
    return { tab: 'portfolio', project: idx === -1 ? null : idx };
  }
  return { tab: 'about', project: null };
}

function bindTabs() {
  const bar = $('.nav__tabs');
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    e.preventDefault();
    activateTab(btn.dataset.tab, { scroll: true });
  });

  bar.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (TAB_IDS.indexOf(currentTab()) + step + TAB_IDS.length) % TAB_IDS.length;
    activateTab(TAB_IDS[next], { focus: true });
  });

  /* Hero buttons and footer links switch tabs instead of scrolling. */
  $$('a[href^="#"]').forEach((a) => {
    if (a.closest('.nav__tabs')) return;
    const target = a.getAttribute('href').slice(1);
    const name = target === 'top' ? 'about' : target;
    if (!TAB_IDS.includes(name)) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab(name, { scroll: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const view = viewFromHash();
    activateTab(view.tab, { hash: false });
    if (view.project !== null) activateProject(view.project, { hash: false });
  });

  const view = viewFromHash();
  if (view.project !== null) activateProject(view.project, { hash: false });
  activateTab(view.tab, { hash: false });
}

/* ---------- Lightbox ---------- */
const lightbox = {
  el: null, img: null,
  project: 0, photo: 0,
  open(p, i) {
    this.el = $('#lightbox');
    this.img = $('.lightbox__img', this.el);
    this.project = p;
    this.photo = i;
    this.update();
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
  },
  close() {
    if (!this.el) return;
    this.el.hidden = true;
    document.body.style.overflow = '';
  },
  step(delta) {
    const photos = PROJECTS[this.project].photos;
    this.photo = (this.photo + delta + photos.length) % photos.length;
    this.update();
  },
  update() {
    const proj = PROJECTS[this.project];
    const file = proj.photos[this.photo];
    this.img.src = enc(`${proj.folder}/${file}`);
    this.img.alt = `${proj.title}, photo ${this.photo + 1} of ${proj.photos.length}`;
  },
};

function openLightbox(p, i) { lightbox.open(p, i); }

function bindLightbox() {
  const el = $('#lightbox');
  $('.lightbox__close', el).addEventListener('click', () => lightbox.close());
  $('.lightbox__nav--prev', el).addEventListener('click', () => lightbox.step(-1));
  $('.lightbox__nav--next', el).addEventListener('click', () => lightbox.step(1));
  el.addEventListener('click', (e) => { if (e.target === el) lightbox.close(); });
  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') lightbox.close();
    if (e.key === 'ArrowLeft') lightbox.step(-1);
    if (e.key === 'ArrowRight') lightbox.step(1);
  });
}

/* ---------- Mobile nav ---------- */
function closeNav() {
  const btn = $('.nav__menu-btn');
  const links = $('.nav__links');
  if (!btn || !links) return;
  links.classList.remove('is-open');
  btn.setAttribute('aria-expanded', 'false');
}

function bindNav() {
  const btn = $('.nav__menu-btn');
  const links = $('.nav__links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
  $$('.nav__links a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ---------- Inquiry form ----------
   No backend yet, so we hand the message off to the user's mail
   client via a mailto: link, prefilled with the form contents.
   Swap this for a fetch() to a form service (Formspree, Netlify,
   etc.) when ready.
*/
function bindForm() {
  const form = $('#inquiry-form');
  if (!form) return;
  const status = $('.inquiry__status', form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'inquiry__status';
    status.textContent = '';

    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.email || !data.topic || !data.message) {
      status.classList.add('is-error');
      status.textContent = 'Please fill in every field so I can help.';
      return;
    }

    const subject = `New ${data.topic} inquiry from ${data.name}`;
    const body =
`Hi Melissa,

${data.message}

- ${data.name}
${data.email}
Topic: ${data.topic}`;

    const mailto = `mailto:hello@lovemelissa.xo?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    status.classList.add('is-ok');
    status.textContent = 'Opening your email app… if nothing happens, email hello@lovemelissa.xo directly.';
  });
}

/* ---------- Footer year ---------- */
function setYear() {
  const el = $('#year');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderPortfolio();
  bindTabs();
  bindLightbox();
  bindNav();
  bindForm();
  setYear();
});
