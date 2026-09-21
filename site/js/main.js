// Renders page content from the JSON files in /data.
// To update the site, edit the JSON files. No HTML changes needed.
//
// Text fields support a tiny Markdown subset: **bold**, *italic*, [label](url).

const OWNER = 'Ella Rabinovich'; // bolded in author lists
const NEWS_LIMIT = 8;            // updates shown on the home page before "Show all"

const loadJSON = async (name) => {
  const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load data/${name}.json (${res.status})`);
  return res.json();
};

// Tiny element helper: el('a', { href: '#' }, 'text', childNode)
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === '' || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === '') continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
};

const isExternal = (url) => /^https?:\/\//.test(url);
const link = (label, url, cls) =>
  el('a', { href: url, class: cls, ...(isExternal(url) && { target: '_blank', rel: 'noopener' }) }, label);

// Inline Markdown subset -> DOM nodes. Text is never parsed as HTML.
function rich(text = '') {
  const out = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] != null) out.push(el('strong', {}, ...rich(m[1])));
    else if (m[2] != null) out.push(el('em', {}, ...rich(m[2])));
    else out.push(link(m[3], /^(https?:|mailto:|[\w./-]+$)/.test(m[4]) ? m[4] : '#'));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Accepts "2025", "2025-11" or "2025-11-03".
const formatDate = (d = '') => {
  const [y, m] = String(d).split('-');
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
};
const byDateDesc = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));

const icon = (name) => el('span', {
  class: 'icon',
  style: `--icon: url("${new URL(`img/icons/${name}.svg`, document.baseURI).href}")`,
  'aria-hidden': 'true',
});

// ---------- Shared: sidebar + bindings ----------

function renderSidebar(p) {
  const side = document.getElementById('sidebar');
  if (!side) return;
  const initials = p.name.split(/\s+/).map((w) => w[0]).join('');
  const avatar = p.photo
    ? el('img', { class: 'avatar', src: p.photo, alt: `Photo of ${p.name}`, width: 160, height: 160 })
    : el('div', { class: 'avatar avatar-initials', 'aria-hidden': 'true' }, initials);

  const links = [...(p.links || [])];
  if (p.cv) links.push({ label: 'CV (PDF)', icon: 'cv', url: p.cv });

  side.replaceChildren(
    avatar,
    el('div', { class: 'side-name' }, p.name),
    el('p', { class: 'side-short' }, p.short),
    p.location ? el('p', { class: 'side-loc muted' }, p.location) : null,
    el('ul', { class: 'side-links' },
      ...links.map((l) => el('li', {}, link([icon(l.icon || 'link'), el('span', {}, l.label)], l.url)))),
  );
}

function bindProfile(p) {
  document.querySelectorAll('[data-bind-href]').forEach((n) => {
    const v = p[n.dataset.bindHref];
    if (v) n.href = v;
  });
}

// ---------- Pages ----------

function renderHome(p, news) {
  document.getElementById('bio').replaceChildren(...(p.bio || []).map((t) => el('p', {}, ...rich(t))));

  const table = document.getElementById('news');
  const toggle = document.getElementById('news-toggle');
  const sorted = [...news].sort(byDateDesc);
  const draw = (all) => table.replaceChildren(
    ...(all ? sorted : sorted.slice(0, NEWS_LIMIT)).map((n) =>
      el('tr', {}, el('th', { scope: 'row' }, formatDate(n.date)), el('td', {}, ...rich(n.text)))));
  draw(false);
  if (sorted.length > NEWS_LIMIT) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => { draw(true); toggle.hidden = true; });
  }
}

const TYPE_LABELS = { journal: 'Journal', conference: 'Conference', workshop: 'Workshop', preprint: 'Preprint' };

function authorsNode(authors) {
  const parts = authors.split(OWNER);
  return parts.flatMap((s, i) => (i ? [el('strong', {}, OWNER), s] : [s]));
}

function renderPublications(pubs) {
  const root = document.getElementById('publications');
  const search = document.getElementById('filter');
  const filters = document.getElementById('filters');
  const count = document.getElementById('pub-count');

  // Filter chips: publication types, then research topics (from the data).
  const types = Object.keys(TYPE_LABELS).filter((t) => pubs.some((p) => p.type === t));
  const topicCounts = new Map();
  pubs.forEach((p) => (p.topics || []).forEach((t) => topicCounts.set(t, (topicCounts.get(t) || 0) + 1)));
  const topics = [...topicCounts.keys()].sort((a, b) => topicCounts.get(b) - topicCounts.get(a));

  let active = { kind: 'all', value: null };
  const chip = (label, kind, value, cls = '') =>
    el('button', { type: 'button', class: `chip ${cls}`, 'data-kind': kind, 'data-value': value ?? '', onclick: () => { active = { kind, value }; draw(); } }, label);

  filters.replaceChildren(
    chip('All', 'all', null),
    ...types.map((t) => chip(TYPE_LABELS[t], 'type', t, `t-${t}`)),
    el('span', { class: 'chip-sep', 'aria-hidden': 'true' }),
    ...topics.map((t) => chip(t, 'topic', t, 'topic')),
  );

  const draw = () => {
    filters.querySelectorAll('.chip').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.kind === active.kind && (b.dataset.value || null) === active.value)));

    const q = search.value.trim().toLowerCase();
    const shown = pubs.filter((p) =>
      (active.kind === 'all'
        || (active.kind === 'type' && p.type === active.value)
        || (active.kind === 'topic' && (p.topics || []).includes(active.value)))
      && (!q || [p.title, p.authors, p.venue, p.year].join(' ').toLowerCase().includes(q)));

    count.textContent = `${shown.length} of ${pubs.length} publications`;
    const years = [...new Set(shown.map((p) => p.year))].sort((a, b) => b - a);
    root.replaceChildren(
      ...years.map((y) => el('section', { class: 'year' },
        el('h2', {}, y),
        el('ul', { class: 'pubs' },
          ...shown.filter((p) => p.year === y).map((p) =>
            el('li', {},
              el('div', { class: 'pub-title' }, p.title),
              el('div', { class: 'pub-authors' }, ...authorsNode(p.authors)),
              el('div', { class: 'pub-venue' }, p.venue, `, ${p.year}`),
              p.award ? el('div', { class: 'pub-award' }, '🏆 ', p.award) : null,
              el('div', { class: 'pub-links' },
                el('span', { class: `badge t-${p.type}` }, TYPE_LABELS[p.type] || p.type),
                ...(p.links || []).map((l) => link(l.label, l.url, 'badge badge-link')))))))),
    );
    if (!shown.length) root.replaceChildren(el('p', { class: 'muted' }, 'No matching publications.'));
  };

  search.addEventListener('input', draw);
  draw();
}

function renderTalks(talks, software) {
  document.getElementById('talks').replaceChildren(
    ...[...talks].sort(byDateDesc).map((t) =>
      el('tr', {},
        el('th', { scope: 'row' }, formatDate(t.date)),
        el('td', {},
          t.kind ? el('span', { class: 'badge t-keynote' }, t.kind) : null,
          t.url ? link(t.title, t.url) : el('span', { class: 'talk-title' }, t.title),
          el('div', { class: 'muted' }, t.venue)))));

  document.getElementById('software').replaceChildren(
    ...software.map((s) => el('li', {}, icon('github'), ' ', link(s.title, s.url))));
}

function renderTeaching(items) {
  document.getElementById('teaching').replaceChildren(
    ...items.map((t) =>
      el('li', { class: 'row' },
        el('div', { class: 'when' }, t.term),
        el('div', {},
          el('div', { class: 'pub-title' }, t.url ? link(t.course, t.url) : t.course),
          el('div', { class: 'muted' }, [t.role, t.institution, t.level].filter(Boolean).join(' · '))))));
}

function renderCV(cv, profile) {
  if (profile.cv) document.getElementById('cv-download').hidden = false;
  document.getElementById('cv').replaceChildren(
    ...cv.sections.map((s) => el('section', {},
      el('h2', {}, s.title),
      el('ul', { class: 'plain' },
        ...s.items.map((i) => el('li', { class: 'row' },
          el('div', { class: 'when' }, i.when || ''),
          el('div', {},
            el('div', { class: 'cv-what' }, ...rich(i.what)),
            i.where ? el('div', { class: 'muted' }, ...rich(i.where)) : null,
            i.note ? el('div', { class: 'small' }, ...rich(i.note)) : null)))))));
}

// ---------- Boot ----------

async function main() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const updated = document.getElementById('updated');
  if (updated) updated.textContent = new Date(document.lastModified).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const page = document.body.dataset.page;
  try {
    const profile = await loadJSON('profile');
    renderSidebar(profile);
    bindProfile(profile);
    if (page === 'home') renderHome(profile, await loadJSON('news'));
    if (page === 'publications') renderPublications(await loadJSON('publications'));
    if (page === 'talks') renderTalks(await loadJSON('talks'), await loadJSON('software'));
    if (page === 'teaching') renderTeaching(await loadJSON('teaching'));
    if (page === 'cv') renderCV(await loadJSON('cv'), profile);
  } catch (err) {
    console.error(err);
    document.querySelector('main')?.append(el('p', { class: 'error' }, 'Could not load content. Please try again later.'));
  }
}

main();
