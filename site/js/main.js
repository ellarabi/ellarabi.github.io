// Renders page content from the JSON files in /data.
// To update the site, edit the JSON files — no HTML changes needed.

const loadJSON = async (name) => {
  const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load data/${name}.json (${res.status})`);
  return res.json();
};

// Tiny element helper: el('a', { href: '#' }, 'text', childNode)
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === '') continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === '') continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
};

const isExternal = (url) => /^https?:\/\//.test(url);
const link = (label, url) =>
  el('a', isExternal(url) ? { href: url, target: '_blank', rel: 'noopener' } : { href: url }, label);

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '');

function renderProfile(p) {
  document.querySelectorAll('[data-bind]').forEach((n) => {
    const v = p[n.dataset.bind];
    if (v) n.textContent = v;
  });
  document.querySelectorAll('[data-bind-src]').forEach((n) => {
    const v = p[n.dataset.bindSrc];
    if (v) n.src = v;
  });
  document.querySelectorAll('[data-bind-href]').forEach((n) => {
    const v = p[n.dataset.bindHref];
    if (v) n.href = v;
  });

  const email = document.getElementById('email');
  if (email && p.email) {
    email.href = `mailto:${p.email}`;
    email.textContent = p.email;
  }

  const bio = document.getElementById('bio');
  if (bio) bio.replaceChildren(...(p.bio || []).map((t) => el('p', {}, t)));

  const interests = document.getElementById('interests');
  if (interests) interests.replaceChildren(...(p.interests || []).map((t) => el('li', {}, t)));

  const links = document.getElementById('links');
  if (links) {
    const items = (p.links || []).map((l) => link(l.label, l.url));
    links.replaceChildren(...items.flatMap((a, i) => (i ? [' · ', a] : [a])));
  }
}

function renderNews(items) {
  const list = document.getElementById('news');
  list.replaceChildren(
    ...items.sort(byDateDesc).map((n) =>
      el('li', {}, el('time', { datetime: n.date }, formatDate(n.date)), el('span', {}, n.text)))
  );
}

function renderPublications(pubs) {
  const root = document.getElementById('publications');
  const filter = document.getElementById('filter');

  const draw = () => {
    const q = filter.value.trim().toLowerCase();
    const shown = pubs.filter((p) =>
      !q || [p.title, p.authors, p.venue, p.year].join(' ').toLowerCase().includes(q));

    const years = [...new Set(shown.map((p) => p.year))].sort((a, b) => b - a);
    root.replaceChildren(
      ...years.map((y) => el('section', {},
        el('h2', {}, y),
        el('ol', { class: 'pubs' },
          ...shown.filter((p) => p.year === y).map((p) =>
            el('li', {},
              el('div', { class: 'pub-title' }, p.title),
              el('div', { class: 'pub-authors' }, p.authors),
              el('div', { class: 'pub-venue' }, p.venue),
              el('div', { class: 'pub-links' }, ...(p.links || []).map((l) => link(l.label, l.url))))))))
    );
    if (!shown.length) root.replaceChildren(el('p', { class: 'muted' }, 'No matching publications.'));
  };

  filter.addEventListener('input', draw);
  draw();
}

function renderMaterials(items) {
  const list = document.getElementById('materials');
  list.replaceChildren(
    ...items.sort(byDateDesc).map((m) =>
      el('li', { class: 'card' },
        el('div', { class: 'meta' }, m.kind, ' · ', el('time', { datetime: m.date }, formatDate(m.date))),
        el('h3', {}, m.file ? link(m.title, m.file) : m.title),
        el('p', {}, m.description)))
  );
}

function renderTeaching(items) {
  const list = document.getElementById('teaching');
  list.replaceChildren(
    ...items.map((t) =>
      el('li', {},
        el('div', { class: 'pub-title' }, t.url ? link(t.course, t.url) : t.course),
        el('div', { class: 'muted' }, [t.role, t.institution, t.term].filter(Boolean).join(' · '))))
  );
}

async function main() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const page = document.body.dataset.page;
  try {
    renderProfile(await loadJSON('profile'));
    if (page === 'home') renderNews(await loadJSON('news'));
    if (page === 'publications') renderPublications(await loadJSON('publications'));
    if (page === 'materials') renderMaterials(await loadJSON('materials'));
    if (page === 'teaching') renderTeaching(await loadJSON('teaching'));
  } catch (err) {
    console.error(err);
    document.querySelector('main')?.append(el('p', { class: 'error' }, 'Could not load content. Please try again later.'));
  }
}

main();
