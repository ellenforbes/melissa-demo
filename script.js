/* =====================================================================
   Love, Melissa xo

   The site is a tab set, not a long scroll. One tab per thing Melissa
   makes, plus About and Contact. Each work tab renders its projects
   from the data below into a scrapbook collage of photos.

   To add a project: drop the photos into a folder and push an object
   onto that section's `projects` array. Nothing else needs touching.
   ===================================================================== */

/* ---------------------------------------------------------------------
   THE WORK
   layout  'a' 3 photos, 'b' 5 photos, 'c' 4 photos (see LAYOUTS below)
   photos  filenames inside `folder`; the FIRST one is the big feature
   --------------------------------------------------------------------- */
/* Each section's heading and blurb live in index.html; what follows is
   only the project data rendered underneath them. */
const SECTIONS = [
  {
    id: 'giant-pbn',
    title: 'Giant Paint-by-Numbers',
    projects: [
      {
        title: 'Glasshouse Paint-by-Numbers',
        meta: 'Large-scale canvas / 2025',
        blurb:
          'Hand-drawn and hand-numbered, painted section by section from blank ' +
          'outline to finished glasshouse.',
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
    ],
  },
  {
    id: 'faux-finishes',
    title: 'Faux Finishes',
    projects: [
      {
        title: 'Fancy Painting',
        meta: 'Decorative interior / 2026',
        blurb:
          'Hand-painted grain, stone and detail work that turns a flat surface into ' +
          'something that looks like it has been there a hundred years.',
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
    ],
  },
  {
    id: 'scenic-art',
    title: 'Scenic Art',
    projects: [
      {
        title: 'Christmas Village Set',
        meta: 'Stage flats / 2025',
        blurb:
          'A French Christmas village built flat by flat, from the Hotel de Noel ' +
          'to the toy shop window.',
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
        meta: 'Stage flats / 2023',
        blurb:
          'A snowbound town in cut-out flats: the station, the fire hall, the chapel ' +
          'and the schoolhouse.',
        layout: 'c',
        folder: 'Project 20231206 Set Design',
        photos: [
          '20231219_190045~2.jpg',
          'IMG_20231206_182918_086~2.jpg',
          'IMG_20231220_073208_289~3.jpg',
          'IMG_20231205_224845_930~3.jpg',
        ],
      },
    ],
  },
  {
    id: 'other-mischief',
    title: 'Other Mischief',
    projects: [
      {
        title: 'Wardrobe Refurbish',
        meta: 'Furniture revival / 2026',
        blurb: 'A tired wardrobe brought back to life with paint and patience.',
        layout: 'a',
        folder: 'Project 20250510 Wardrobe Refurnish',
        photos: [
          'SquareQuick_2026417134038230.jpg',
          'PXL_20260326_164439841.MP.jpg',
          'PXL_20260404_172039672.MP~2.jpg',
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------------------
   COLLAGE PRESETS
   Each entry pins one photo on the stage: t/l/w/h are percentages,
   r is rotation, z is stack order. The first photo is the feature.
   --------------------------------------------------------------------- */
const LAYOUTS = {
  a: [
    { t: 8,  l: 4,  w: 46, h: 86, r: -4, z: 3 },
    { t: 2,  l: 46, w: 38, h: 52, r: 7,  z: 2 },
    { t: 42, l: 56, w: 40, h: 54, r: -9, z: 1 },
  ],
  b: [
    { t: 4,  l: 2,  w: 42, h: 92, r: -3, z: 5 },
    { t: 2,  l: 42, w: 30, h: 48, r: 7,  z: 4 },
    { t: 8,  l: 70, w: 28, h: 44, r: -9, z: 3 },
    { t: 50, l: 44, w: 30, h: 50, r: -6, z: 2 },
    { t: 48, l: 70, w: 28, h: 48, r: 9,  z: 3 },
  ],
  c: [
    { t: 6,  l: 4,  w: 50, h: 62, r: -4, z: 4 },
    { t: 2,  l: 57, w: 30, h: 52, r: 6,  z: 3 },
    { t: 46, l: 32, w: 28, h: 50, r: -8, z: 2 },
    { t: 40, l: 64, w: 32, h: 56, r: 7,  z: 1 },
  ],
};

/* Blooms cycled so each section heading gets its own, drawn by
   Art/draw-flowers.py from Melissa's banner art. */
const FLOWERS = [
  'daisy-lime',
  'cosmos-orange',
  'flower-blue',
  'dahlia-crimson',
];

/* --------------------------------------------------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const enc = (s) => s.split('/').map(encodeURIComponent).join('/');

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const sectionById = (id) => SECTIONS.find((s) => s.id === id);

/* Tab order across the top: About, the four work sections, Contact. */
const TAB_IDS = ['about', ...SECTIONS.map((s) => s.id), 'contact'];

/* Which project each work section is currently showing. */
const shown = Object.fromEntries(SECTIONS.map((s) => [s.id, 0]));

/* ---------------------------------------------------------------------
   RENDERING THE WORK PANELS
   --------------------------------------------------------------------- */
const photoMarkup = (section, project, projectIdx) => {
  const positions = LAYOUTS[project.layout] || LAYOUTS.a;

  return project.photos
    .map((file, j) => {
      const pos = positions[j] || positions[positions.length - 1];
      const src = enc(`${project.folder}/${file}`);
      const style =
        `--t:${pos.t}%;--l:${pos.l}%;--w:${pos.w}%;--h:${pos.h}%;` +
        `--r:${pos.r}deg;--z:${pos.z};`;
      return `
          <figure class="project__photo" style="${style}"
                  data-section="${section.id}" data-project="${projectIdx}" data-photo="${j}">
            <img src="${src}" alt="${project.title}, photo ${j + 1}" loading="lazy" />
          </figure>`;
    })
    .join('');
};

const projectMarkup = (section, project, i) => `
      <div class="subpanel" id="subpanel-${section.id}-${i}" data-index="${i}" role="tabpanel"
           aria-labelledby="subtab-${section.id}-${i}" tabindex="-1"${i === 0 ? '' : ' hidden'}>
        <article class="project">
          <div class="project__head">
            <h3 class="project__title">${project.title}</h3>
            <span class="project__meta">${project.meta}</span>
          </div>
          <p class="project__blurb">${project.blurb}</p>
          <div class="project__stage">${photoMarkup(section, project, i)}
          </div>
        </article>
      </div>`;

const switcherMarkup = (section) => {
  if (section.projects.length < 2) return '';

  const tabs = section.projects
    .map(
      (p, i) => `
        <button type="button" class="subtab${i === 0 ? ' is-active' : ''}"
                id="subtab-${section.id}-${i}" role="tab" data-index="${i}"
                aria-controls="subpanel-${section.id}-${i}" aria-selected="${i === 0}"
                ${i === 0 ? '' : 'tabindex="-1"'}>${p.title}</button>`
    )
    .join('');

  const dots = section.projects
    .map(
      (p, i) => `
        <button type="button" class="stepper__dot${i === 0 ? ' is-active' : ''}"
                data-index="${i}" aria-label="${p.title}"></button>`
    )
    .join('');

  return `
      <div class="subtabs" role="tablist" aria-label="${section.title} projects">${tabs}
      </div>
      <div class="stepper">
        <div class="stepper__bar">
          <button type="button" class="stepper__arrow" data-step="-1" aria-label="Previous project">&lsaquo;</button>
          <span class="stepper__label" aria-live="polite">${section.projects[0].title}</span>
          <button type="button" class="stepper__arrow" data-step="1" aria-label="Next project">&rsaquo;</button>
        </div>
        <div class="stepper__dots">${dots}
        </div>
      </div>`;
};

const emptyMarkup = (flower) => `
      <div class="nothing-yet">
        <img src="Art/blooms/${flower}.svg" alt="" aria-hidden="true" />
        <p>Photos of this work are on their way. In the meantime, drop me a note and I will
           happily talk you through it.</p>
        <a class="btn" href="#contact">Get in touch
          <img class="btn__flower" src="Art/blooms/mini-orange.svg" alt="" aria-hidden="true" />
        </a>
      </div>`;

const renderSection = (section, index) => {
  const panel = $(`#panel-${section.id}`);
  const slot = panel && $('.projects', panel);
  if (!slot) return;

  /* The heading and blurb are already in index.html so they are readable
     without JavaScript and by search crawlers; only the projects below
     them are built here. */
  slot.innerHTML = section.projects.length
    ? `${switcherMarkup(section)}
      <div class="subpanels">${section.projects
        .map((p, i) => projectMarkup(section, p, i))
        .join('')}
      </div>`
    : emptyMarkup(FLOWERS[index % FLOWERS.length]);

  bindSwitcher(panel, section);
  bindSwipe(panel, section);
};

const renderWork = () => SECTIONS.forEach(renderSection);

/* ---------------------------------------------------------------------
   PROJECT SWITCHING inside a work section
   Pills on desktop, prev/next stepper plus swipe on mobile. Both drive
   the same panels and stay in sync.
   --------------------------------------------------------------------- */
const showProject = (sectionId, idx, opts = {}) => {
  const section = sectionById(sectionId);
  const panel = $(`#panel-${sectionId}`);
  if (!section || !panel || !section.projects[idx]) return;

  shown[sectionId] = idx;

  $$('.subtab', panel).forEach((btn) => {
    const on = Number(btn.dataset.index) === idx;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
    if (on) btn.removeAttribute('tabindex');
    else btn.setAttribute('tabindex', '-1');
  });

  $$('.subpanel', panel).forEach((sub) => {
    sub.hidden = Number(sub.dataset.index) !== idx;
  });

  const label = $('.stepper__label', panel);
  if (label) label.textContent = section.projects[idx].title;

  $$('.stepper__dot', panel).forEach((dot) => {
    const on = Number(dot.dataset.index) === idx;
    dot.classList.toggle('is-active', on);
    if (on) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });

  if (opts.focus) {
    const btn = $(`#subtab-${sectionId}-${idx}`);
    if (btn) btn.focus();
  }
  if (opts.hash !== false) syncHash();
};

const stepProject = (sectionId, delta, opts = {}) => {
  const section = sectionById(sectionId);
  if (!section) return;
  const count = section.projects.length;
  const next = (shown[sectionId] + delta + count) % count;
  showProject(sectionId, next, opts);
};

const bindSwitcher = (panel, section) => {
  panel.addEventListener('click', (e) => {
    const tab = e.target.closest('.subtab');
    if (tab) return showProject(section.id, Number(tab.dataset.index));

    const arrow = e.target.closest('.stepper__arrow');
    if (arrow) return stepProject(section.id, Number(arrow.dataset.step));

    const dot = e.target.closest('.stepper__dot');
    if (dot) return showProject(section.id, Number(dot.dataset.index));

    const photo = e.target.closest('.project__photo');
    if (photo && !swipedRecently()) {
      openLightbox(section.id, Number(photo.dataset.project), Number(photo.dataset.photo));
    }
  });

  const bar = $('.subtabs', panel);
  if (!bar) return;
  bar.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    stepProject(section.id, step, { focus: true });
  });
};

/* A swipe also lands as a click on whichever photo was under the finger,
   so a recent swipe suppresses the lightbox for a moment. */
let lastSwipeAt = 0;
const swipedRecently = () => Date.now() - lastSwipeAt < 400;

const bindSwipe = (panel, section) => {
  const stage = $('.subpanels', panel);
  if (!stage || section.projects.length < 2) return;

  let startX = null;
  let startY = null;

  stage.addEventListener(
    'touchstart',
    (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    'touchend',
    (e) => {
      if (startX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      startX = null;
      /* Ignore short drags and anything that reads as a vertical scroll. */
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      lastSwipeAt = Date.now();
      stepProject(section.id, dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
};

/* ---------------------------------------------------------------------
   SECTION TABS
   The URL hash names the view so links can be shared:
     #about  #scenic-art  #contact
     #scenic-art--winter-town-set  for one project inside a section
   --------------------------------------------------------------------- */
const currentTab = () => {
  const active = $('.menuitem.is-active');
  return active ? active.dataset.tab : 'about';
};

const syncHash = () => {
  const name = currentTab();
  const section = sectionById(name);
  let hash = `#${name}`;

  if (section && section.projects.length > 1) {
    hash += `--${slugify(section.projects[shown[name]].title)}`;
  }
  history.replaceState(null, '', hash);
};

const activateTab = (name, opts = {}) => {
  if (!TAB_IDS.includes(name)) return;

  $$('.menuitem').forEach((item) => {
    const on = item.dataset.tab === name;
    item.classList.toggle('is-active', on);
    item.setAttribute('aria-selected', String(on));
    if (on) item.removeAttribute('tabindex');
    else item.setAttribute('tabindex', '-1');
  });

  $$('.panel').forEach((panel) => {
    panel.hidden = panel.id !== `panel-${name}`;
  });

  /* The full banner artwork belongs to the front page. On the work and
     contact tabs it crops down to the flower border so the galleries
     start near the top of the screen. */
  $('.masthead').classList.toggle('is-compact', name !== 'about');

  closeMenu();

  if (opts.focus) {
    const btn = $(`#tab-${name}`);
    if (btn) btn.focus();
  }
  if (opts.scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  if (opts.hash !== false) syncHash();
};

/* Read the opening view out of the URL. Anything unrecognised lands on About. */
const viewFromHash = () => {
  const raw = location.hash.replace(/^#/, '');
  if (!raw || raw === 'top') return { tab: 'about', project: null };
  if (TAB_IDS.includes(raw)) return { tab: raw, project: null };

  const [id, slug] = raw.split('--');
  const section = sectionById(id);
  if (!section) return { tab: 'about', project: null };

  const idx = section.projects.findIndex((p) => slugify(p.title) === slug);
  return { tab: id, project: idx === -1 ? null : idx };
};

const bindTabs = () => {
  /* Every in-page link switches tabs rather than scrolling. */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const raw = link.getAttribute('href').slice(1);
    const name = raw === 'top' ? 'about' : raw;
    if (!TAB_IDS.includes(name)) return;
    e.preventDefault();
    activateTab(name, { scroll: true });
  });

  const list = $('.menubar__list');
  if (list) {
    list.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = (TAB_IDS.indexOf(currentTab()) + step + TAB_IDS.length) % TAB_IDS.length;
      activateTab(TAB_IDS[next], { focus: true });
    });
  }

  window.addEventListener('hashchange', () => {
    const view = viewFromHash();
    if (view.project !== null) showProject(view.tab, view.project, { hash: false });
    activateTab(view.tab, { hash: false });
  });

  const view = viewFromHash();
  if (view.project !== null) showProject(view.tab, view.project, { hash: false });
  activateTab(view.tab, { hash: false });
};

/* ---------------------------------------------------------------------
   LIGHTBOX
   --------------------------------------------------------------------- */
const lightbox = {
  el: null,
  img: null,
  section: null,
  project: 0,
  photo: 0,

  open(sectionId, projectIdx, photoIdx) {
    this.el = $('#lightbox');
    this.img = $('.lightbox__img', this.el);
    this.section = sectionId;
    this.project = projectIdx;
    this.photo = photoIdx;
    this.update();
    this.el.hidden = false;
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.el) return;
    this.el.hidden = true;
    document.body.style.overflow = '';
  },

  current() {
    return sectionById(this.section).projects[this.project];
  },

  step(delta) {
    const photos = this.current().photos;
    this.photo = (this.photo + delta + photos.length) % photos.length;
    this.update();
  },

  update() {
    const project = this.current();
    const file = project.photos[this.photo];
    this.img.src = enc(`${project.folder}/${file}`);
    this.img.alt = `${project.title}, photo ${this.photo + 1} of ${project.photos.length}`;
  },
};

const openLightbox = (sectionId, projectIdx, photoIdx) =>
  lightbox.open(sectionId, projectIdx, photoIdx);

const bindLightbox = () => {
  const el = $('#lightbox');
  if (!el) return;

  $('.lightbox__close', el).addEventListener('click', () => lightbox.close());
  $('.lightbox__nav--prev', el).addEventListener('click', () => lightbox.step(-1));
  $('.lightbox__nav--next', el).addEventListener('click', () => lightbox.step(1));
  el.addEventListener('click', (e) => {
    if (e.target === el) lightbox.close();
  });

  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') lightbox.close();
    if (e.key === 'ArrowLeft') lightbox.step(-1);
    if (e.key === 'ArrowRight') lightbox.step(1);
  });
};

/* ---------------------------------------------------------------------
   MOBILE MENU
   --------------------------------------------------------------------- */
const closeMenu = () => {
  const btn = $('.menubar__toggle');
  const list = $('.menubar__list');
  if (!btn || !list) return;
  list.classList.remove('is-open');
  btn.setAttribute('aria-expanded', 'false');
};

const bindMenu = () => {
  const btn = $('.menubar__toggle');
  const list = $('.menubar__list');
  if (!btn || !list) return;

  btn.addEventListener('click', () => {
    const open = list.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
};

/* ---------------------------------------------------------------------
   INQUIRY FORM
   No backend yet, so the message is handed to the visitor's mail client
   prefilled. Swap this for a fetch() to a form service when there is one.
   --------------------------------------------------------------------- */
const bindForm = () => {
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
    const body = `Hi Melissa,

${data.message}

- ${data.name}
${data.email}
Topic: ${data.topic}`;

    window.location.href =
      `mailto:melissa.smigelski@hotmail.com?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    status.classList.add('is-ok');
    status.textContent =
      'Opening your email app. If nothing happens, email melissa.smigelski@hotmail.com directly.';
  });
};

/* ---------------------------------------------------------------------
   FOOTER YEAR
   --------------------------------------------------------------------- */
const setYear = () => {
  const el = $('#year');
  if (el) el.textContent = String(new Date().getFullYear());
};

/* ---------------------------------------------------------------------
   BOOT
   --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderWork();
  bindTabs();
  bindLightbox();
  bindMenu();
  bindForm();
  setYear();
});
