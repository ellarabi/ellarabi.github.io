// Renders page content from the JSON files in /data.
// To update the site, edit the JSON files. No HTML changes needed.
//
// Text fields support a tiny Markdown subset: **bold**, *italic*, [label](url).

const OWNER = 'Ella Rabinovich'; // bolded in author lists

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

function renderHome(p) {
  document.getElementById('bio').replaceChildren(...(p.bio || []).map((t) => el('p', {}, ...rich(t))));
}

function authorsNode(authors) {
  const parts = authors.split(OWNER);
  return parts.flatMap((s, i) => (i ? [el('strong', {}, OWNER), s] : [s]));
}

function renderPublications(pubs) {
  const years = [...new Set(pubs.map((p) => p.year))].sort((a, b) => b - a);
  document.getElementById('publications').replaceChildren(
    ...years.map((y) => el('section', { class: 'year' },
      el('h2', {}, y),
      el('ul', { class: 'pubs' },
        ...pubs.filter((p) => p.year === y).map((p) =>
          el('li', {},
            el('div', { class: 'pub-title' }, p.title),
            el('div', { class: 'pub-authors' }, ...authorsNode(p.authors)),
            el('div', { class: 'pub-venue' }, p.venue, `, ${p.year}`),
            p.award ? el('div', { class: 'pub-award' }, '🏆 ', p.award) : null,
            (p.links || []).length
              ? el('div', { class: 'pub-links' }, ...p.links.map((l) => link(l.label, l.url, 'badge badge-link')))
              : null))))),
  );
}

function renderTalks(talks) {
  document.getElementById('talks').replaceChildren(
    ...[...talks].sort(byDateDesc).map((t) =>
      el('tr', {},
        el('th', { scope: 'row' }, formatDate(t.date)),
        el('td', {},
          t.kind ? el('span', { class: 'badge t-keynote' }, t.kind) : null,
          t.url ? link(t.title, t.url) : el('span', { class: 'talk-title' }, t.title),
          el('div', { class: 'muted' }, t.venue)))));
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
    if (page === 'home') renderHome(profile);
    if (page === 'publications') renderPublications(await loadJSON('publications'));
    if (page === 'talks') renderTalks(await loadJSON('talks'));
    if (page === 'teaching') renderTeaching(await loadJSON('teaching'));
  } catch (err) {
    console.error(err);
    document.querySelector('main')?.append(el('p', { class: 'error' }, 'Could not load content. Please try again later.'));
  }
}

main();
