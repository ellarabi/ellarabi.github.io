# ellarabi.github.io

Personal academic website of **Ella Rabinovich, Ph.D.**: profile, publications, talks, teaching, group.

- Plain static **HTML + CSS + vanilla JS**. No framework, no build step, no database.
- Content lives in **JSON files** (`site/data/`) and **uploaded files** (`site/files/`, `site/img/`).
- Hosted on **GitHub Pages** at https://ellarabi.github.io. Every push to `main` deploys automatically (`.github/workflows/deploy.yml`).

## Layout

```
site/                     <- everything in here is published as-is
  index.html              About: bio
  publications.html       Publications by year, filter by type/topic, search
  talks.html              Invited talks
  teaching.html           Courses
  group.html              Research group (placeholder: "Coming soon")
  404.html
  css/style.css           One stylesheet, automatic light/dark mode
  js/main.js              Reads site/data/*.json and renders each page
  data/
    profile.json          Name, titles, bio, sidebar links, photo
    publications.json     [{ year, type, title, authors, venue, topics[], award?, links:[{label,url}] }]
    talks.json            [{ date, title, venue, kind?, url? }]
    teaching.json         [{ term, course, institution, role, level? }]
  files/                  PDFs (papers, slides)
  img/                    photo, favicon, icons/
scripts/check.mjs         Validates JSON + referenced files (runs in CI before deploy)
scripts/serve.mjs         Zero-dependency local preview server
.github/workflows/        GitHub Actions: check, then publish site/ to Pages
```

## Updating content

1. Edit the relevant JSON file in `site/data/`. Text fields support **bold**, *italic* and [links](https://example.com) using Markdown syntax.
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
- Pages: About, Publications, Talks, Teaching, Group.
- JSON-driven content, responsive layout, light/dark mode, search filter on publications.
- Push-to-deploy via GitHub Actions with content validation.

**Phase 2: real content (done, from Ella's CVs)**
- Bio, 52 publications with ACL Anthology / arXiv / DOI / code links, talks, teaching.
- Still needed from Ella: a professional photo (`img/profile.jpg`, square, ≥ 400×400, then set `"photo"` in `profile.json`),
  her Google Scholar profile URL, and review of the bio wording and topic tags.

**Phase 3: polish & launch**
- Open Graph / social preview image and meta tags.
- `sitemap.xml`.
- Optional: BibTeX export per publication, a contact form via a mailto link only (no backend).

**Deliberately out of scope:** database, CMS, server-side code, build tooling.
