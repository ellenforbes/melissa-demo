/* =====================================================
   Melissa — site script
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
   - photos: list of image filenames inside `folder`.
             The FIRST photo is always the big feature.
   ------------------------------------------------------- */
const PROJECTS = [
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
};

/* ------------------------------------------------------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const enc = (s) => s.split('/').map(encodeURIComponent).join('/');

function renderPortfolio() {
  const list = $('#portfolio-list');
  if (!list) return;

  list.innerHTML = PROJECTS.map((p, i) => {
    const positions = LAYOUTS[p.layout] || LAYOUTS.a;
    const photos = p.photos.map((file, j) => {
      const pos = positions[j] || positions[positions.length - 1];
      const src = enc(`${p.folder}/${file}`);
      const style =
        `--t:${pos.t}%;--l:${pos.l}%;--w:${pos.w}%;--h:${pos.h}%;` +
        `--r:${pos.r}deg;--z:${pos.z};--ar:auto;`;
      return `
        <figure class="project__photo" data-src="${src}" data-project="${i}" style="${style}">
          <img src="${src}" alt="${p.title} — photo ${j + 1}" loading="lazy" />
        </figure>`;
    }).join('');

    return `
      <article class="project project--${p.layout}">
        <div class="project__head">
          <span class="project__num">No. ${String(i + 1).padStart(2, '0')}</span>
          <h3 class="project__title">${p.title}</h3>
          <span class="project__meta">${p.meta}</span>
        </div>
        <p class="project__blurb">${p.blurb}</p>
        <div class="project__stage">
          <img class="project__splat" src="Motifs/SplatOne.png" alt="" aria-hidden="true" />
          ${photos}
        </div>
      </article>`;
  }).join('');

  $$('.project__photo', list).forEach((el) => {
    el.addEventListener('click', () => {
      const projectIdx = Number(el.dataset.project);
      const photoIdx = $$(`.project__photo[data-project="${projectIdx}"]`)
        .indexOf(el);
      openLightbox(projectIdx, photoIdx);
    });
  });
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
    this.img.alt = `${proj.title} — photo ${this.photo + 1} of ${proj.photos.length}`;
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
   No backend yet — we hand the message off to the user's mail
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

    const subject = `New ${data.topic} inquiry — ${data.name}`;
    const body =
`Hi Melissa,

${data.message}

— ${data.name}
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
  bindLightbox();
  bindNav();
  bindForm();
  setYear();
});
