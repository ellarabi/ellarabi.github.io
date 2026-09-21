# ellarabi.github.io

Personal academic website of **Ella Rabinovich, Ph.D.**: profile, publications, talks & materials, teaching, CV.

- Plain static **HTML + CSS + vanilla JS**. No framework, no build step, no database.
- Content lives in **JSON files** (`site/data/`) and **uploaded files** (`site/files/`, `site/img/`).
- Hosted on **GitHub Pages** at https://ellarabi.github.io. Every push to `main` deploys automatically (`.github/workflows/deploy.yml`).

## Layout

```
site/                     <- everything in here is published as-is
  index.html              About: photo, bio, research interests, links, news
  publications.html       Publications grouped by year, with a search filter
  materials.html          Talks, slides, posters, datasets, code
  teaching.html           Courses
  404.html
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
scripts/check.mjs         Validates JSON + referenced files (runs in CI before deploy)
scripts/serve.mjs         Zero-dependency local preview server
.github/workflows/        GitHub Actions: check, then publish site/ to Pages
```

## Updating content

1. Edit the relevant JSON file in `site/data/`.
2. Drop any PDF / image into `site/files/` or `site/img/`, and reference it by relative path (e.g. `"files/talk-2026.pdf"`).
3. Preview locally: `npm run dev` then open http://localhost:8000
4. Commit and push to `main`. GitHub Actions checks the content and publishes it; the site updates in about a minute. Progress is visible under the repo's **Actions** tab.

The check fails the deploy if a JSON file is invalid, and warns about any `files/…` or `img/…` path that doesn't exist. Run it locally with `npm run check`.

Editing directly on github.com also works: open a JSON file, click the pencil, commit. Upload PDFs with **Add file → Upload files** into `site/files/`.

## One-time setup

Requires [Node.js](https://nodejs.org/) 20+ (only for local preview) and git. No `npm install` needed; there are no dependencies.

```bash
git clone https://github.com/ellarabi/ellarabi.github.io.git
cd ellarabi.github.io
npm run dev
```

In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (once).

## Plan / roadmap

**Phase 1: skeleton (done)**
- Pages: About, Publications, Talks & Materials, Teaching, CV (PDF link).
- JSON-driven content, responsive layout, light/dark mode, search filter on publications.
- Push-to-deploy via GitHub Actions with content validation.

**Phase 2: real content (Ella)**
- Fill in `profile.json` (position, affiliation, bio, interests, email, links).
- Add `img/profile.jpg` (square, ≥ 440×440) and `files/cv.pdf`.
- Enter publications, talks, and teaching; upload the PDFs.
- Remove the `TODO` placeholders and example entries.

**Phase 3: polish & launch**
- Open Graph / social preview image and meta tags.
- `sitemap.xml`.
- Optional: BibTeX export per publication, a contact form via a mailto link only (no backend).

**Deliberately out of scope:** database, CMS, server-side code, build tooling.
