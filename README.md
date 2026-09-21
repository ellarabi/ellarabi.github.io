# ellarbi-website

Personal academic website of **Ella Rabinovich, Ph.D.**: profile, publications, talks & materials, teaching, CV.

- Plain static **HTML + CSS + vanilla JS**. No framework, no build step, no database.
- Content lives in **JSON files** (`site/data/`) and **uploaded files** (`site/files/`, `site/img/`).
- Hosted on **Cloudflare Pages**, deployed from a local machine with `npm run deploy`.

## Layout

```
site/                     <- everything in here is published as-is
  index.html              About: photo, bio, research interests, links, news
  publications.html       Publications grouped by year, with a search filter
  materials.html          Talks, slides, posters, datasets, code
  teaching.html           Courses
  404.html
  _headers                Cloudflare Pages HTTP headers (security + caching)
  css/style.css           One stylesheet, automatic light/dark mode
  js/main.js              Reads site/data/*.json and renders each page
  data/
    profile.json          Name, position, bio, interests, email, links, CV path
    news.json             [{ date, text }]
    publications.json     [{ year, title, authors, venue, type, links:[{label,url}] }]
    materials.json        [{ date, title, kind, description, file }]
    teaching.json         [{ term, course, institution, role, url }]
  files/                  PDFs: cv.pdf, papers, slides, posters…
  img/                    profile.jpg, favicon.svg, other images
scripts/deploy.mjs        Validate content, then deploy with wrangler
```

## Updating content

1. Edit the relevant JSON file in `site/data/`.
2. Drop any PDF / image into `site/files/` or `site/img/`, and reference it by relative path (e.g. `"files/talk-2026.pdf"`).
3. Preview locally: `npm run dev` then open http://localhost:8788
4. Deploy: `npm run deploy`
5. Commit and push so the repo matches what's live.

The deploy script checks every JSON file parses and warns about any `files/…` or `img/…` path that doesn't exist.

## One-time setup (per computer)

Requires [Node.js](https://nodejs.org/) 20+ and git. Works on Windows, macOS and Linux.

```bash
git clone https://github.com/srabi/ellarbi-website.git
cd ellarbi-website
npm install
```

Authenticate with Cloudflare, **either**:

- **Browser login** (simplest, needs membership in the Cloudflare account): `npm run login`
- **API token**: copy `.env.example` to `.env` and fill in `CLOUDFLARE_API_TOKEN` (permission: *Account → Cloudflare Pages → Edit*) and `CLOUDFLARE_ACCOUNT_ID`. `.env` is git-ignored.

First deployment only — create the Pages project:

```bash
npm run setup      # creates project "ellarbi" -> https://ellarbi.pages.dev
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local preview at http://localhost:8788 (same behavior as Cloudflare, incl. `_headers`) |
| `npm run deploy` | Validate + deploy to production |
| `npm run deploy:preview` | Validate + deploy to a preview URL; production untouched |
| `npm run setup` | Create the Cloudflare Pages project (once) |
| `npm run login` | Log in to Cloudflare in the browser |

## Plan / roadmap

**Phase 1: skeleton (done)**
- Pages: About, Publications, Talks & Materials, Teaching, CV (PDF link).
- JSON-driven content, responsive layout, light/dark mode, search filter on publications.
- Local deploy script with content validation and commit tracking.

**Phase 2: real content (Ella)**
- Fill in `profile.json` (position, affiliation, bio, interests, email, links).
- Add `img/profile.jpg` (square, ≥ 440×440) and `files/cv.pdf`.
- Enter publications, talks, and teaching; upload the PDFs.
- Remove the `TODO` placeholders and example entries.

**Phase 3: polish & launch**
- Custom domain (Cloudflare dashboard → Pages → ellarbi → Custom domains).
- Open Graph / social preview image and meta tags.
- `sitemap.xml` once the domain is final.
- Optional: BibTeX export per publication, Cloudflare Web Analytics (cookie-free), a contact form via a mailto link only (no backend).

**Deliberately out of scope:** database, CMS, server-side code, build tooling.
